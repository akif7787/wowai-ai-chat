import type { Context } from '@netlify/functions';

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

    const statusPayload = {
      provider: hasKey ? `BAILU AI (${configuredModel})` : 'Demo Mode (Smart Simulation)',
      id: hasKey ? 'bailu' : 'demo',
      isDemo: !hasKey,
      connected: hasKey,
      model: hasKey ? configuredModel : 'demo-engine',
      status: 'ready',
    };

    return new Response(JSON.stringify(statusPayload), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (_err) {
    return new Response(
      JSON.stringify({ error: 'Failed to retrieve AI provider status' }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
};
