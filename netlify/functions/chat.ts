import type { Context } from '@netlify/functions';

const DEFAULT_MODEL = 'bailu-auto';
const BAILU_CHAT_ENDPOINT = 'https://bailucode.com/openapi/v1/chat/completions';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function cleanErrorMessage(status: number, rawText: string): string {
  if (!rawText) return `BAILU API error (${status})`;
  if (rawText.includes('<title>Just a moment') || rawText.includes('cf-browser-verification')) {
    return 'Cloudflare challenge encountered. Please retry in a few moments.';
  }
  try {
    const json = JSON.parse(rawText);
    if (json.error?.message) return json.error.message;
    if (json.error_description) return json.error_description;
    if (typeof json.error === 'string') return json.error;
  } catch {}
  if (rawText.includes('<') && rawText.includes('>')) {
    const textOnly = rawText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return textOnly.slice(0, 160) || `BAILU API error (${status})`;
  }
  return rawText.slice(0, 200);
}

function buildSystemPrompt(language?: 'en' | 'bn'): string {
  const langPrompt = language === 'bn'
    ? 'The user communicates in Bengali (বাংলা). Respond naturally, fluently, and idiomatically in Bengali unless explicitly instructed otherwise.'
    : 'The user communicates in English. If the user asks in Bengali (বাংলা), naturally respond in Bengali. Otherwise, respond in English.';

  return `You are Wowai, a minimalist, friendly, intelligent, and fast AI assistant.
Your tagline is "AI that feels simple."
Guidelines:
- Provide clear, direct, and well-formatted answers without unnecessary fluff or excessive greetings.
- When generating code, use clean Markdown code blocks with appropriate language tags (e.g., \`\`\`tsx, \`\`\`python).
- Support syntax highlighting, tables, lists, and structured explanations.
- ${langPrompt}
- Maintain a calm, respectful, modern, and helpful tone at all times.`;
}

export default async (req: Request, _context: Context): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Use POST.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const rawKey = process.env.BAILU_API_KEY;
  const hasKey = Boolean(rawKey && rawKey.trim() !== '' && rawKey !== 'your_bailu_api_key_here');
  const rawModel = process.env.BAILU_MODEL?.trim();
  const configuredModel = (rawModel && rawModel !== 'your_model_name_here' && rawModel !== 'bailu-turing')
    ? rawModel
    : DEFAULT_MODEL;

  let payload: any = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }

  const activeModel = (payload?.model && typeof payload.model === 'string' && payload.model.trim())
    ? payload.model.trim()
    : configuredModel;

  // Normalize messages
  const normalizedMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

  if (Array.isArray(payload?.messages) && payload.messages.length > 0) {
    for (const m of payload.messages) {
      if (!m || typeof m.content !== 'string' || !m.content.trim()) continue;
      if (m.content.length > 20000) {
        return new Response(JSON.stringify({ error: 'Message exceeds character limit.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const role = m.role === 'assistant' || m.role === 'system' ? m.role : 'user';
      normalizedMessages.push({ role, content: m.content.trim() });
    }
  } else if (payload?.message && typeof payload.message === 'string' && payload.message.trim()) {
    if (Array.isArray(payload.history)) {
      for (const h of payload.history) {
        if (h && typeof h.content === 'string' && h.content.trim()) {
          const role = h.role === 'assistant' || h.role === 'system' ? h.role : 'user';
          normalizedMessages.push({ role, content: h.content.trim() });
        }
      }
    }
    normalizedMessages.push({ role: 'user', content: payload.message.trim() });
  }

  if (normalizedMessages.length === 0) {
    return new Response(JSON.stringify({ error: 'A valid message or conversation history is required.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Ensure system prompt is present
  const hasSystem = normalizedMessages.some((m) => m.role === 'system');
  if (!hasSystem) {
    normalizedMessages.unshift({
      role: 'system',
      content: buildSystemPrompt(payload?.language),
    });
  }

  const url = new URL(req.url);
  const wantsStream =
    req.headers.get('accept')?.includes('text/event-stream') ||
    url.searchParams.get('stream') === 'true';

  // DEMO MODE: If no API key is provided
  if (!hasKey) {
    const lastUserMsg = [...normalizedMessages].reverse().find((m) => m.role === 'user')?.content || '';
    const isBn = payload?.language === 'bn' || /[\u0980-\u09FF]/.test(lastUserMsg);

    const demoReply = isBn
      ? `আমি **Wowai** ডেমো মোডে সংযুক্ত আছি।\n\nআপনার প্রশ্ন: **"${lastUserMsg}"**\n\nবাইলু এআই (BAILU AI) সক্রিয় করতে Netlify Environment Variables-এ \`BAILU_API_KEY\` যোগ করুন।`
      : `I am running on the **Wowai Demo Engine**.\n\nYour query: **"${lastUserMsg}"**\n\nTo enable real-time intelligence, configure \`BAILU_API_KEY\` in your Netlify Site Settings → Environment Variables.`;

    if (wantsStream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const words = demoReply.split(' ');
          for (let i = 0; i < words.length; i++) {
            const chunk = (i === 0 ? '' : ' ') + words[i];
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
            await new Promise((r) => setTimeout(r, 20));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });

      return new Response(stream, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    }

    const demoPayload = {
      response: demoReply,
      provider: 'Demo Mode (Smart Simulation)',
      model: 'demo-engine',
      isDemo: true,
    };
    return new Response(JSON.stringify(demoPayload), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // REAL BAILU AI COMPLETION VIA OPENAPI ENDPOINT
  if (wantsStream) {
    let upstreamRes: Response;
    try {
      upstreamRes = await fetch(BAILU_CHAT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${rawKey!.trim()}`,
          Accept: 'text/event-stream',
          'User-Agent': 'Wowai/1.0',
        },
        body: JSON.stringify({
          model: activeModel,
          messages: normalizedMessages,
          temperature: 0.7,
          stream: true,
        }),
      });
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: `Connection failed: ${err?.message || 'Gateway unreachable'}` }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text().catch(() => '');
      const message = cleanErrorMessage(upstreamRes.status, errText);
      return new Response(JSON.stringify({ error: message }), {
        status: upstreamRes.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!upstreamRes.body) {
      return new Response(JSON.stringify({ error: 'No stream body returned by upstream.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder('utf-8');
    const upstreamReader = upstreamRes.body.getReader();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await upstreamReader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith(':')) continue;

              if (trimmed === 'data: [DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                continue;
              }

              if (trimmed.startsWith('data: ')) {
                try {
                  const parsed = JSON.parse(trimmed.slice(6));
                  const delta = parsed?.choices?.[0]?.delta?.content;
                  if (delta) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: delta })}\n\n`));
                  }
                } catch {
                  // Ignore non-JSON ping/comment lines
                }
              }
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err: any) {
          const message = cleanErrorMessage(500, err?.message || 'Stream processing failed');
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  }

  // Non-streaming JSON completion
  try {
    const upstreamRes = await fetch(BAILU_CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rawKey!.trim()}`,
        Accept: 'application/json',
        'User-Agent': 'Wowai/1.0',
      },
      body: JSON.stringify({
        model: activeModel,
        messages: normalizedMessages,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text().catch(() => '');
      const message = cleanErrorMessage(upstreamRes.status, errText);
      return new Response(JSON.stringify({ error: message }), {
        status: upstreamRes.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await upstreamRes.json();
    const text = data?.choices?.[0]?.message?.content || '';

    const successPayload = {
      response: text,
      provider: `BAILU AI (${activeModel})`,
      model: activeModel,
      isDemo: false,
    };

    return new Response(JSON.stringify(successPayload), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    const message = cleanErrorMessage(500, err?.message || 'Failed to complete chat request');
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};
