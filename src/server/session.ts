import type { IncomingMessage } from 'http';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getApiBaseUrl } from './config';

export const SESSION_COOKIE = 'eq_session';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function getSessionToken(req: Pick<IncomingMessage, 'headers'> & { cookies?: Partial<Record<string, string>> }): string | null {
  return req.cookies?.[SESSION_COOKIE] || null;
}

function serializeCookie(value: string, maxAgeSeconds: number): string {
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`,
    'HttpOnly',
    'SameSite=Strict',
  ];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  return parts.join('; ');
}

export function setSessionCookie(res: NextApiResponse, token: string, maxAgeSeconds: number): void {
  res.setHeader('Set-Cookie', serializeCookie(token, maxAgeSeconds));
}

export function clearSessionCookie(res: NextApiResponse): void {
  res.setHeader('Set-Cookie', serializeCookie('', 0));
}

/**
 * Reads the `exp` claim (seconds) of a JWT WITHOUT verifying it. It is only used to tell the UI
 * when the session ends; the backend remains the only authority on whether a token is valid.
 */
export function readJwtExpiryMillis(token: string): number | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/** CSRF defense on top of SameSite=Strict: state-changing requests must come from our own origin. */
export function rejectCrossOrigin(req: NextApiRequest, res: NextApiResponse): boolean {
  if (SAFE_METHODS.has(req.method ?? 'GET')) return false;
  const host = req.headers.host;
  try {
    if (req.headers.origin && host && new URL(req.headers.origin).host === host) return false;
  } catch {
    // malformed Origin header: fall through to the rejection below
  }
  res.status(403).json({ error: 'Origen no permitido' });
  return true;
}

export function backendFetch(token: string | null, path: string, init: RequestInit & { duplex?: 'half' } = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${getApiBaseUrl()}${path}`, { ...init, headers });
}

/** Responds 401 and returns false unless the request carries a session the backend accepts. */
export async function requireSession(req: NextApiRequest, res: NextApiResponse): Promise<boolean> {
  const token = getSessionToken(req);
  if (token) {
    try {
      const me = await backendFetch(token, '/auth/me');
      if (me.ok) return true;
    } catch {
      res.status(502).json({ error: 'No se pudo conectar con el servidor' });
      return false;
    }
  }
  clearSessionCookie(res);
  res.status(401).json({ error: 'Sesión inválida o expirada' });
  return false;
}
