import statusHandler from './status.ts';
import modelsHandler from './models.ts';
import chatHandler from './chat.ts';

/**
 * Vercel Serverless Function Dispatcher: /api/*
 * Automatically delegates to the appropriate self-contained handler.
 */
export default async function handler(req: any, res: any) {
  const url = req.url || '';
  if (url.includes('/models')) {
    return modelsHandler(req, res);
  }
  if (url.includes('/chat')) {
    return chatHandler(req, res);
  }
  return statusHandler(req, res);
}
