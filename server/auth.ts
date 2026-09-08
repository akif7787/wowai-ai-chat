import crypto from 'crypto';

/**
 * Server-side Authentication & Cryptographic Security
 * - Passwords hashed using scrypt with unique cryptographic salt per user
 * - Constant-time comparison to protect against timing attacks
 * - Cryptographically signed session tokens (HMAC-SHA256)
 * - Zero secrets exposed to client
 */

const FALLBACK_SECRET = 'wowai_fallback_jwt_secret_' + (process.env.BAILU_API_KEY ? crypto.createHash('sha256').update(process.env.BAILU_API_KEY).digest('hex') : 'default_insecure_local_dev_secret');
const AUTH_SECRET = process.env.AUTH_SECRET || process.env.JWT_SECRET || FALLBACK_SECRET;

export interface TokenPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  try {
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch {
    return false;
  }
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

export function createToken(payload: { userId: string; email: string }, expiresInHours: number = 24 * 30): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const body: TokenPayload = {
    userId: payload.userId,
    email: payload.email.toLowerCase().trim(),
    iat: now,
    exp: now + expiresInHours * 3600,
  };
  const encodedBody = base64UrlEncode(JSON.stringify(body));
  const data = `${header}.${encodedBody}`;
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${data}.${signature}`;
}

export function verifyToken(token: string): TokenPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  const data = `${header}.${body}`;
  const expectedSig = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  try {
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const decoded = JSON.parse(base64UrlDecode(body)) as TokenPayload;
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return decoded;
  } catch {
    return null;
  }
}

export function extractTokenFromHeader(headerValue?: string | null): string | null {
  if (!headerValue) return null;
  const parts = headerValue.trim().split(/\s+/);
  if (parts.length === 2 && /^bearer$/i.test(parts[0])) {
    return parts[1];
  }
  return null;
}
