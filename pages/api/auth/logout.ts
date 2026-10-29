import type { NextApiRequest, NextApiResponse } from 'next';
import { clearSessionCookie, rejectCrossOrigin } from '../../../src/server/session';

// The API has no logout endpoint: the JWT simply stops being sent. It stays valid on the server until it expires.
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (rejectCrossOrigin(req, res)) return;
  clearSessionCookie(res);
  return res.status(204).end();
}
