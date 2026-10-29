import type { NextApiRequest, NextApiResponse } from 'next';
import type { components } from '../../../src/api/schema';
import type { SessionInfo } from '../../../src/api/types';
import { backendFetch, rejectCrossOrigin, setSessionCookie } from '../../../src/server/session';

type LoginResponse = components['schemas']['LoginResponseDto'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (rejectCrossOrigin(req, res)) return;

  const { username, password } = req.body ?? {};
  if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  let upstream: Response;
  try {
    upstream = await backendFetch(null, '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), password }),
    });
  } catch (e) {
    console.error('auth/login:', e);
    return res.status(502).json({ error: 'No se pudo conectar con el servidor' });
  }

  if (!upstream.ok) {
    const retryAfter = upstream.headers.get('retry-after');
    if (retryAfter) res.setHeader('Retry-After', retryAfter);
    return res.status(upstream.status === 401 || upstream.status === 429 ? upstream.status : 502).json({
      error: upstream.status === 401 ? 'Usuario o contraseña incorrectos' : 'No se pudo iniciar sesión',
    });
  }

  const data = (await upstream.json()) as LoginResponse;
  setSessionCookie(res, data.accessToken, data.expiresIn);
  const session: SessionInfo = { user: data.user, expiresAt: Date.now() + data.expiresIn * 1000 };
  return res.status(200).json(session);
}
