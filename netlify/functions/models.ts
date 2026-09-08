import type { Context } from '@netlify/functions';

const BAILU_MODELS_ENDPOINT = 'https://bailucode.com/openapi/v1/models';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

export default async (req: Request, _context: Context): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const rawKey = process.env.BAILU_API_KEY;
    const hasKey = Boolean(rawKey && rawKey.trim() !== '' && rawKey !== 'your_bailu_api_key_here');
    const rawModel = process.env.BAILU_MODEL?.trim();
    const configuredModel = (rawModel && rawModel !== 'your_model_name_here' && rawModel !== 'bailu-turing')
      ? rawModel
      : 'bailu-auto';

    if (!hasKey) {
      const demoPayload = {
        configuredModel: 'demo-engine',
        availableModels: ['demo-engine'],
        provider: 'demo',
      };
      return new Response(JSON.stringify(demoPayload), {
        status: 200,
        headers: corsHeaders,
      });
    }

    let models: string[] = [];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const apiRes = await fetch(BAILU_MODELS_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${rawKey!.trim()}`,
          'User-Agent': 'Wowai/1.0',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (apiRes.ok) {
        const json = await apiRes.json();
        if (Array.isArray(json?.data)) {
          models = json.data.map((item: any) => item.id).filter(Boolean);
        }
      }
    } catch {
      // Upstream discovery timed out or failed; use healthy defaults
    }

    if (models.length === 0) {
      models = ['bailu-auto', 'bailu-2.8-lite', 'bailu-2.8'];
    }

    const payload = {
      configuredModel: models.includes(configuredModel) ? configuredModel : 'bailu-auto',
      availableModels: models,
      provider: 'bailu',
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (_err) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch model information' }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
};
