/**
 * Vercel Serverless Function: GET /api/status
 * Returns current AI provider configuration and system readiness.
 * Self-contained and zero-dependency to guarantee fast, fault-tolerant execution on Vercel.
 */
export default async function handler(req: any, res: any) {
  // CORS & Preflight handling
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
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

    if (typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(200).json(statusPayload);
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(statusPayload));
  } catch (err: any) {
    const errPayload = { error: 'Failed to retrieve AI provider status' };
    if (typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(500).json(errPayload);
    }
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(errPayload));
  }
}
