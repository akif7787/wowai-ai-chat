import express from 'express';
import statusHandler from './api/status.ts';
import modelsHandler from './api/models.ts';
import chatHandler from './api/chat.ts';

/**
 * Creates and configures the Express application for local dev server and container runs,
 * directly delegating to the production-ready self-contained serverless handlers.
 */
export function createExpressApp() {
  const app = express();

  app.use(express.json({ limit: '1mb' }));

  app.all(['/api/status', '/status'], (req, res) => statusHandler(req, res));
  app.all(['/api/models', '/models'], (req, res) => modelsHandler(req, res));
  app.all(['/api/chat', '/chat'], (req, res) => chatHandler(req, res));

  return app;
}

export const app = createExpressApp();
