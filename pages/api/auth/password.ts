import type { NextApiRequest, NextApiResponse } from 'next';
import { backendFetch, clearSessionCookie, getSessionToken, rejectCrossOrigin } from '../../../src/server/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', 'PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (rejectCrossOrigin(req, res)) return;

  const token = getSessionToken(req);
  if (!token) return res.status(401).json({ error: 'Sin sesión' });

  const { currentPassword, newPassword } = req.body ?? {};
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  let upstream: Response;
  try {
    upstream = await backendFetch(token, '/auth/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  } catch (e) {
    console.error('auth/password:', e);
    return res.status(502).json({ error: 'No se pudo conectar con el servidor' });
  }

  if (upstream.status === 204) {
    // The backend closes every session of the user, including this one.
    clearSessionCookie(res);
    return res.status(204).end();
  }
  if (upstream.status === 401) clearSessionCookie(res);
  const messages: Record<number, string> = {
    400: 'La contraseña actual no es correcta',
    401: 'Sesión inválida o expirada',
    403: 'No tenés permisos para cambiar la contraseña',
  };
  return res
    .status(messages[upstream.status] ? upstream.status : 502)
    .json({ error: messages[upstream.status] ?? 'No se pudo cambiar la contraseña' });
}
