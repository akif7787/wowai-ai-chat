import type { Context } from '@netlify/functions';
import { hashPassword, verifyPassword, createToken, verifyToken, extractTokenFromHeader } from '../../server/auth.ts';
import { store } from '../../server/store.ts';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

  const url = new URL(req.url);
  const pathname = url.pathname;
  const isSignup = pathname.includes('/signup');
  const isLogin = pathname.includes('/login');
  const isMe = pathname.includes('/me');

  // GET /api/auth/me
  if (req.method === 'GET' || isMe) {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return jsonResponse({ error: 'Authorization header missing or invalid' }, 401);
    }

    const payload = verifyToken(token);
    if (!payload) {
      return jsonResponse({ error: 'Invalid or expired session token' }, 401);
    }

    const user = store.findUserById(payload.userId);
    if (!user) {
      return jsonResponse({ error: 'User not found' }, 404);
    }

    return jsonResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        isAuthenticated: true,
      },
    }, 200);
  }

  // POST /api/auth/signup
  if (req.method === 'POST' && isSignup) {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    const { email, password, name } = body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return jsonResponse({ error: 'A valid email address is required' }, 400);
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return jsonResponse({ error: 'Password must be at least 6 characters long' }, 400);
    }

    const existing = store.findUserByEmail(email);
    if (existing) {
      return jsonResponse({ error: 'An account with this email already exists' }, 409);
    }

    const { hash, salt } = hashPassword(password);
    const user = store.createUser(email, hash, salt, name || email.split('@')[0]);
    const token = createToken({ userId: user.id, email: user.email });

    return jsonResponse({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        isAuthenticated: true,
      },
    }, 201);
  }

  // POST /api/auth/login
  if (req.method === 'POST' && isLogin) {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    const { email, password } = body;
    if (!email || !password) {
      return jsonResponse({ error: 'Email and password are required' }, 400);
    }

    const user = store.findUserByEmail(email);
    if (!user) {
      return jsonResponse({ error: 'Invalid email or password' }, 401);
    }

    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      return jsonResponse({ error: 'Invalid email or password' }, 401);
    }

    const token = createToken({ userId: user.id, email: user.email });
    return jsonResponse({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        isAuthenticated: true,
      },
    }, 200);
  }

  return jsonResponse({ error: 'Auth route not found' }, 404);
};
