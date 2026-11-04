import type { NextApiRequest, NextApiResponse } from 'next';
import type { SessionInfo, LoginUser } from '../../../src/api/types';
import { backendFetch, clearSessionCookie, getSessionToken, readJwtExpiryMillis } from '../../../src/server/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.setHeader('Cache-Control', 'no-store');

  const token = getSessionToken(req);
  if (!token) return res.status(401).json({ error: 'Sin sesión' });

  let upstream: Response;
  try {
    upstream = await backendFetch(token, '/auth/me');
  } catch (e) {
    console.error('auth/me:', e);
    return res.status(502).json({ error: 'No se pudo conectar con el servidor' });
  }

  if (!upstream.ok) {
    if (upstream.status === 401 || upstream.status === 403) {
      clearSessionCookie(res);
      return res.status(upstream.status).json({ error: 'Sesión inválida o expirada' });
    }
    return res.status(502).json({ error: 'No se pudo verificar la sesión' });
  }

  const session: SessionInfo = {
    user: (await upstream.json()) as LoginUser,
    expiresAt: readJwtExpiryMillis(token),
  };
  return res.status(200).json(session);
}
