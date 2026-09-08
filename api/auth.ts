import type { IncomingMessage, ServerResponse } from 'http';
import { hashPassword, verifyPassword, createToken, verifyToken, extractTokenFromHeader } from '../server/auth.ts';
import { store } from '../server/store.ts';

function sendJson(res: any, status: number, data: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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

export default async function authHandler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.statusCode = 204;
    return res.end();
  }

  const url = req.url || '';
  const isSignup = url.includes('/signup');
  const isLogin = url.includes('/login');
  const isMe = url.includes('/me');

  // GET /api/auth/me
  if (req.method === 'GET' || isMe) {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return sendJson(res, 401, { error: 'Authorization header missing or invalid' });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return sendJson(res, 401, { error: 'Invalid or expired session token' });
    }

    const user = store.findUserById(payload.userId);
    if (!user) {
      return sendJson(res, 404, { error: 'User not found' });
    }

    return sendJson(res, 200, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        isAuthenticated: true,
      },
    });
  }

  // POST /api/auth/signup
  if (req.method === 'POST' && isSignup) {
    const body = await parseBody(req);
    const { email, password, name } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return sendJson(res, 400, { error: 'A valid email address is required' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return sendJson(res, 400, { error: 'Password must be at least 6 characters long' });
    }

    const existing = store.findUserByEmail(email);
    if (existing) {
      return sendJson(res, 409, { error: 'An account with this email already exists' });
    }

    const { hash, salt } = hashPassword(password);
    const user = store.createUser(email, hash, salt, name || email.split('@')[0]);
    const token = createToken({ userId: user.id, email: user.email });

    return sendJson(res, 201, {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        isAuthenticated: true,
      },
    });
  }

  // POST /api/auth/login
  if (req.method === 'POST' && isLogin) {
    const body = await parseBody(req);
    const { email, password } = body;

    if (!email || !password) {
      return sendJson(res, 400, { error: 'Email and password are required' });
    }

    const user = store.findUserByEmail(email);
    if (!user) {
      return sendJson(res, 401, { error: 'Invalid email or password' });
    }

    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      return sendJson(res, 401, { error: 'Invalid email or password' });
    }

    const token = createToken({ userId: user.id, email: user.email });
    return sendJson(res, 200, {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        isAuthenticated: true,
      },
    });
  }

  return sendJson(res, 404, { error: 'Auth route not found' });
}
