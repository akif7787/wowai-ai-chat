import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { ChatService, ChatRequestPayload } from './services/ai/chat.ts';
import { discoverBailuModels, DEFAULT_BAILU_MODEL } from './services/ai/bailu.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory rate limiter to protect server from rapid floods
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 40;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  record.count += 1;
  return true;
}

// Clean up stale rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));

  // Status endpoint
  app.get('/api/status', (req, res) => {
    try {
      const status = ChatService.getStatus();
      res.json(status);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve AI provider status' });
    }
  });

  // Model inspection endpoint
  app.get('/api/models', async (req, res) => {
    try {
      const bailuKey = process.env.BAILU_API_KEY;
      if (bailuKey && bailuKey.trim() !== '' && bailuKey !== 'your_bailu_api_key_here') {
        const models = await discoverBailuModels(bailuKey.trim());
        const configured = (process.env.BAILU_MODEL && process.env.BAILU_MODEL !== 'bailu-turing' && process.env.BAILU_MODEL !== 'your_model_name_here')
          ? process.env.BAILU_MODEL
          : (models.includes('bailu-auto') ? 'bailu-auto' : models[0] || DEFAULT_BAILU_MODEL);
        return res.json({
          configuredModel: configured,
          availableModels: models,
          provider: 'bailu',
        });
      }
      return res.json({
        configuredModel: 'demo-engine',
        availableModels: ['demo-engine'],
        provider: 'demo',
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch model information' });
    }
  });

  // Chat endpoint (supports both Server-Sent Events streaming and single JSON response)
  app.post('/api/chat', async (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    // Basic rate limit check
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({
        error: 'Too many requests. Please wait a moment and try again.',
      });
    }

    const payload: ChatRequestPayload = req.body;

    // Validate request payload
    let normalizedMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

    if (Array.isArray(payload?.messages) && payload.messages.length > 0) {
      for (const m of payload.messages) {
        if (!m || typeof m.content !== 'string' || !m.content.trim()) continue;
        if (m.content.length > 15000) {
          return res.status(400).json({ error: 'Individual message content exceeds character limit.' });
        }
        const role = m.role === 'assistant' || m.role === 'system' ? m.role : 'user';
        normalizedMessages.push({ role, content: m.content.trim() });
      }
    } else if (payload?.message && typeof payload.message === 'string' && payload.message.trim()) {
      if (payload.message.length > 15000) {
        return res.status(400).json({ error: 'Message content exceeds character limit.' });
      }
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
      return res.status(400).json({ error: 'A valid message or conversation history is required.' });
    }

    const wantsStream = req.headers.accept?.includes('text/event-stream') || req.query.stream === 'true';
    const abortController = new AbortController();

    // Abort upstream fetch if client disconnects early
    res.on('close', () => {
      if (!res.writableEnded) {
        abortController.abort();
      }
    });

    if (wantsStream) {
      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      try {
        await ChatService.handleStreamChat(
          {
            messages: normalizedMessages,
            language: payload.language,
          },
          {
            onChunk: (chunk: string) => {
              res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
            },
            onError: (err: Error) => {
              console.error('[Stream Error]', err.message);
              if (!res.writableEnded) {
                res.write(`data: ${JSON.stringify({ error: err.message || 'Failed to generate response' })}\n\n`);
                res.end();
              }
            },
            onDone: () => {
              if (!res.writableEnded) {
                res.write('data: [DONE]\n\n');
                res.end();
              }
            },
          },
          abortController.signal
        );
      } catch (err: any) {
        console.error('[Chat route streaming error]', err.message);
        if (!res.headersSent) {
          res.status(500).json({ error: err.message || 'An unexpected error occurred during generation.' });
        } else if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ error: err.message || 'An error occurred.' })}\n\n`);
          res.end();
        }
      }
    } else {
      // Non-streaming fallback
      try {
        let fullText = '';
        await ChatService.handleStreamChat(
          {
            messages: normalizedMessages,
            language: payload.language,
          },
          {
            onChunk: (chunk: string) => {
              fullText += chunk;
            },
          },
          abortController.signal
        );
        const status = ChatService.getStatus();
        res.json({
          response: fullText,
          provider: status.provider,
          model: status.model,
          isDemo: status.isDemo,
        });
      } catch (err: any) {
        console.error('[Chat route json error]', err.message);
        res.status(500).json({ error: err.message || 'Something went wrong while generating response.' });
      }
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Wowai Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
