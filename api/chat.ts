/**
 * Vercel Serverless Function: POST /api/chat
 * Handles real-time SSE streaming and JSON completions using BAILU AI,
 * with automatic Demo Mode simulation fallback when BAILU_API_KEY is unset.
 * Self-contained and zero-dependency for maximum reliability.
 */

import { verifyToken, extractTokenFromHeader } from '../server/auth.ts';
import { store } from '../server/store.ts';

const DEFAULT_MODEL = 'bailu-auto';
const BAILU_CHAT_ENDPOINT = 'https://bailucode.com/openapi/v1/chat/completions';

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

async function parseRequestBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk: any) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

export default async function handler(req: any, res: any) {
  // CORS & Preflight handling
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') {
      return res.status(200).end();
    }
    res.statusCode = 200;
    return res.end();
  }

  if (req.method !== 'POST') {
    const errPayload = { error: 'Method not allowed. Use POST.' };
    if (typeof res.status === 'function') {
      return res.status(405).json(errPayload);
    }
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(errPayload));
  }

  const rawKey = process.env.BAILU_API_KEY;
  const hasKey = Boolean(rawKey && rawKey.trim() !== '' && rawKey !== 'your_bailu_api_key_here');
  const rawModel = process.env.BAILU_MODEL?.trim();
  let activeModel = (rawModel && rawModel !== 'your_model_name_here' && rawModel !== 'bailu-turing')
    ? rawModel
    : DEFAULT_MODEL;

  const payload = await parseRequestBody(req);

  // Authenticate user and verify conversation ownership if conversationId is provided
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = extractTokenFromHeader(authHeader);
  const userPayload = token ? verifyToken(token) : null;
  if (payload?.conversationId && userPayload) {
    const existingConv = store.getConversationById(payload.conversationId, userPayload.userId);
    // If conversation belongs to someone else, reject
    const allConvs = (store as any).memoryDb?.conversations;
    if (allConvs && allConvs[payload.conversationId] && allConvs[payload.conversationId].userId !== userPayload.userId) {
      const errPayload = { error: 'Access denied: Conversation belongs to another user.' };
      if (typeof res.status === 'function') {
        return res.status(403).json(errPayload);
      }
      res.statusCode = 403;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(errPayload));
    }
  }

  // Normalize messages
  let normalizedMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

  if (Array.isArray(payload?.messages) && payload.messages.length > 0) {
    for (const m of payload.messages) {
      if (!m || typeof m.content !== 'string' || !m.content.trim()) continue;
      if (m.content.length > 20000) {
        return res.status
          ? res.status(400).json({ error: 'Message exceeds character limit.' })
          : (res.statusCode = 400, res.end(JSON.stringify({ error: 'Message exceeds limit.' })));
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
    const errPayload = { error: 'A valid message or conversation history is required.' };
    if (typeof res.status === 'function') {
      return res.status(400).json(errPayload);
    }
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(errPayload));
  }

  // Ensure system prompt is present
  const hasSystem = normalizedMessages.some((m) => m.role === 'system');
  if (!hasSystem) {
    normalizedMessages.unshift({
      role: 'system',
      content: buildSystemPrompt(payload?.language),
    });
  }

  const wantsStream =
    req.headers?.accept?.includes('text/event-stream') ||
    req.query?.stream === 'true' ||
    (req.url && req.url.includes('stream=true'));

  // DEMO MODE: If no API key is provided
  if (!hasKey) {
    const lastUserMsg = [...normalizedMessages].reverse().find((m) => m.role === 'user')?.content || '';
    const isBn = payload?.language === 'bn' || /[\u0980-\u09FF]/.test(lastUserMsg);

    const demoReply = isBn
      ? `আমি **Wowai** ডেমো মোডে সংযুক্ত আছি।\n\nআপনার প্রশ্ন: **"${lastUserMsg}"**\n\nবাইলু এআই (BAILU AI) সক্রিয় করতে Vercel Environment Variables-এ \`BAILU_API_KEY\` যোগ করুন।`
      : `I am running on the **Wowai Demo Engine**.\n\nYour query: **"${lastUserMsg}"**\n\nTo enable real-time intelligence, configure \`BAILU_API_KEY\` in your Vercel Project Settings → Environment Variables.`;

    if (wantsStream) {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      if (typeof res.flushHeaders === 'function') res.flushHeaders();

      const words = demoReply.split(' ');
      for (let i = 0; i < words.length; i++) {
        const chunk = (i === 0 ? '' : ' ') + words[i];
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        await new Promise((r) => setTimeout(r, 20));
      }
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    const demoPayload = {
      response: demoReply,
      provider: 'Demo Mode (Smart Simulation)',
      model: 'demo-engine',
      isDemo: true,
    };
    if (typeof res.status === 'function') {
      return res.status(200).json(demoPayload);
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(demoPayload));
  }

  // REAL BAILU AI COMPLETION VIA OPENAPI ENDPOINT
  async function callBailu(modelName: string, stream: boolean) {
    return fetch(BAILU_CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rawKey!.trim()}`,
        Accept: stream ? 'text/event-stream' : 'application/json',
        'User-Agent': 'Wowai/1.0',
      },
      body: JSON.stringify({
        model: modelName,
        messages: normalizedMessages,
        temperature: 0.7,
        stream,
      }),
    });
  }

  // Handle SSE Streaming
  if (wantsStream) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    try {
      let upstreamRes = await callBailu(activeModel, true);

      // If activeModel returned 429 (busy) or 403, retry with bailu-2.8-lite or bailu-auto
      if (!upstreamRes.ok && (upstreamRes.status === 429 || upstreamRes.status === 403)) {
        const fallbackModel = activeModel === 'bailu-2.8-lite' ? DEFAULT_MODEL : 'bailu-2.8-lite';
        upstreamRes = await callBailu(fallbackModel, true);
      }

      if (!upstreamRes.ok) {
        const errText = await upstreamRes.text().catch(() => '');
        const message = cleanErrorMessage(upstreamRes.status, errText);
        res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
        return res.end();
      }

      if (!upstreamRes.body) {
        res.write(`data: ${JSON.stringify({ error: 'No stream body returned by upstream.' })}\n\n`);
        return res.end();
      }

      const reader = upstreamRes.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          if (trimmed === 'data: [DONE]') {
            res.write('data: [DONE]\n\n');
            continue;
          }

          if (trimmed.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              const delta = parsed?.choices?.[0]?.delta?.content;
              if (delta) {
                res.write(`data: ${JSON.stringify({ chunk: delta })}\n\n`);
              }
            } catch {
              // Non-JSON line or keep-alive
            }
          }
        }
      }

      res.write('data: [DONE]\n\n');
      return res.end();
    } catch (err: any) {
      res.write(`data: ${JSON.stringify({ error: err.message || 'Stream generation failed' })}\n\n`);
      return res.end();
    }
  }

  // Non-Streaming JSON Fallback
  try {
    let upstreamRes = await callBailu(activeModel, false);

    if (!upstreamRes.ok && (upstreamRes.status === 429 || upstreamRes.status === 403)) {
      const fallbackModel = activeModel === 'bailu-2.8-lite' ? DEFAULT_MODEL : 'bailu-2.8-lite';
      upstreamRes = await callBailu(fallbackModel, false);
    }

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text().catch(() => '');
      const message = cleanErrorMessage(upstreamRes.status, errText);
      const errPayload = { error: message };
      if (typeof res.status === 'function') {
        return res.status(upstreamRes.status).json(errPayload);
      }
      res.statusCode = upstreamRes.status;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(errPayload));
    }

    const data = await upstreamRes.json();
    const text = data?.choices?.[0]?.message?.content || '';

    const successPayload = {
      response: text,
      provider: `BAILU AI (${activeModel})`,
      model: activeModel,
      isDemo: false,
    };

    if (typeof res.status === 'function') {
      return res.status(200).json(successPayload);
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(successPayload));
  } catch (err: any) {
    const errPayload = { error: err.message || 'Failed to complete chat request' };
    if (typeof res.status === 'function') {
      return res.status(500).json(errPayload);
    }
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(errPayload));
  }
}
