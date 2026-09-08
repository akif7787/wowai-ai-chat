import { verifyToken, extractTokenFromHeader } from '../server/auth.ts';
import { store } from '../server/store.ts';

function sendJson(res: any, status: number, data: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.statusCode = status;
  res.end(JSON.stringify(data));
}

async function parseBody(req: any): Promise<any> {
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

export default async function conversationsHandler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.statusCode = 204;
    return res.end();
  }

  // Verify Bearer token on all conversation operations
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = extractTokenFromHeader(authHeader);
  if (!token) {
    return sendJson(res, 401, { error: 'Authentication required. Please provide Authorization: Bearer <token>' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return sendJson(res, 401, { error: 'Invalid or expired session token. Please log in again.' });
  }

  const userId = payload.userId;
  const url = req.url || '';
  // Extract ID if URL is like /api/conversations/:id
  const match = url.match(/\/conversations\/([a-zA-Z0-9_-]+)/);
  const convIdFromUrl = match ? match[1] : null;

  // GET /api/conversations (list for this user) OR GET /api/conversations/:id
  if (req.method === 'GET') {
    if (convIdFromUrl) {
      const conv = store.getConversationById(convIdFromUrl, userId);
      if (!conv) {
        return sendJson(res, 404, { error: 'Conversation not found or access denied' });
      }
      return sendJson(res, 200, { conversation: conv });
    }

    const conversations = store.getConversationsForUser(userId);
    return sendJson(res, 200, { conversations });
  }

  // POST /api/conversations (create new chat for this user)
  if (req.method === 'POST') {
    const body = await parseBody(req);
    const { title, messages, id } = body;
    const newConv = store.createConversation(userId, title, messages, id);
    return sendJson(res, 201, { conversation: newConv });
  }

  // PUT / PATCH /api/conversations/:id (update chat for this user)
  if (req.method === 'PUT' || req.method === 'PATCH') {
    const convId = convIdFromUrl;
    if (!convId) {
      return sendJson(res, 400, { error: 'Conversation ID required in URL' });
    }

    const body = await parseBody(req);
    const updated = store.updateConversation(convId, userId, {
      title: body.title,
      messages: body.messages,
    });

    if (!updated) {
      return sendJson(res, 404, { error: 'Conversation not found or you do not have permission to modify it' });
    }

    return sendJson(res, 200, { conversation: updated });
  }

  // DELETE /api/conversations/:id OR DELETE /api/conversations (clear all)
  if (req.method === 'DELETE') {
    if (convIdFromUrl) {
      const deleted = store.deleteConversation(convIdFromUrl, userId);
      if (!deleted) {
        return sendJson(res, 404, { error: 'Conversation not found or you do not have permission to delete it' });
      }
      return sendJson(res, 200, { success: true, id: convIdFromUrl });
    }

    // Clear all
    const count = store.clearAllConversationsForUser(userId);
    return sendJson(res, 200, { success: true, deletedCount: count });
  }

  return sendJson(res, 405, { error: 'Method not allowed' });
}
