import type { Context } from '@netlify/functions';
import { verifyToken, extractTokenFromHeader } from '../../server/auth.ts';
import { store } from '../../server/store.ts';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export default async (req: Request, _context: Context): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Enforce verified authentication
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  const token = extractTokenFromHeader(authHeader);
  if (!token) {
    return jsonResponse({ error: 'Authentication required. Missing Authorization: Bearer <token>' }, 401);
  }

  const payload = verifyToken(token);
  if (!payload) {
    return jsonResponse({ error: 'Invalid or expired session token. Please log in again.' }, 401);
  }

  const userId = payload.userId;
  const url = new URL(req.url);
  const pathname = url.pathname;
  // Match convId from path (e.g., /.netlify/functions/conversations/chat_123 or /api/conversations/chat_123)
  const match = pathname.match(/conversations\/([a-zA-Z0-9_-]+)/);
  const convIdFromUrl = match ? match[1] : null;

  // GET
  if (req.method === 'GET') {
    if (convIdFromUrl) {
      const conv = store.getConversationById(convIdFromUrl, userId);
      if (!conv) {
        return jsonResponse({ error: 'Conversation not found or access denied' }, 404);
      }
      return jsonResponse({ conversation: conv }, 200);
    }
    const conversations = store.getConversationsForUser(userId);
    return jsonResponse({ conversations }, 200);
  }

  // POST (Create)
  if (req.method === 'POST') {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }
    const { title, messages, id } = body;
    const newConv = store.createConversation(userId, title, messages, id);
    return jsonResponse({ conversation: newConv }, 201);
  }

  // PUT / PATCH (Update)
  if (req.method === 'PUT' || req.method === 'PATCH') {
    if (!convIdFromUrl) {
      return jsonResponse({ error: 'Conversation ID required in URL' }, 400);
    }
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }
    const updated = store.updateConversation(convIdFromUrl, userId, {
      title: body.title,
      messages: body.messages,
    });
    if (!updated) {
      return jsonResponse({ error: 'Conversation not found or permission denied' }, 404);
    }
    return jsonResponse({ conversation: updated }, 200);
  }

  // DELETE
  if (req.method === 'DELETE') {
    if (convIdFromUrl) {
      const deleted = store.deleteConversation(convIdFromUrl, userId);
      if (!deleted) {
        return jsonResponse({ error: 'Conversation not found or permission denied' }, 404);
      }
      return jsonResponse({ success: true, id: convIdFromUrl }, 200);
    }
    const count = store.clearAllConversationsForUser(userId);
    return jsonResponse({ success: true, deletedCount: count }, 200);
  }

  return jsonResponse({ error: 'Method not allowed' }, 405);
};
