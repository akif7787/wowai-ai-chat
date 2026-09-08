/**
 * Vercel Serverless Function: GET /api/models
 * Discovers available BAILU models or returns fallback model list.
 * Self-contained and zero-dependency.
 */
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
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

    if (!hasKey) {
      const demoPayload = {
        configuredModel: 'demo-engine',
        availableModels: ['demo-engine'],
        provider: 'demo',
      };
      if (typeof res.status === 'function' && typeof res.json === 'function') {
        return res.status(200).json(demoPayload);
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(demoPayload));
    }

    // Discover models from BAILU OpenAPI with a safe 5s timeout
    let models: string[] = [];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const apiRes = await fetch('https://api.bailucode.com/v1/models', {
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

    if (typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(200).json(payload);
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(payload));
  } catch (err: any) {
    const errPayload = { error: 'Failed to fetch model information' };
    if (typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(500).json(errPayload);
    }
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(errPayload));
  }
}
