import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import type { NextApiRequest, NextApiResponse } from 'next';
import { backendFetch, clearSessionCookie, getSessionToken, rejectCrossOrigin } from '../../../src/server/session';

// Generic authenticated proxy to the REST API. The body is streamed in both directions so multipart
// uploads (prescriptions) and file downloads work without buffering them in memory.
export const config = {
  api: { bodyParser: false, externalResolver: true },
};

const REQUEST_HEADERS = ['content-type', 'content-length', 'accept'];
const RESPONSE_HEADERS = ['content-type', 'content-length', 'content-disposition', 'cache-control'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const segments = Array.isArray(req.query.path) ? req.query.path : [req.query.path ?? ''];
  // Auth endpoints have dedicated routes: proxying them would hand the JWT to the browser.
  if (segments[0] === 'auth' || segments.some((s) => s === '..' || s === '.')) {
    return res.status(404).json({ error: 'Not found' });
  }
  if (rejectCrossOrigin(req, res)) return;

  const token = getSessionToken(req);
  if (!token) return res.status(401).json({ error: 'Sin sesión' });

  const search = req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const path = `/${segments.map(encodeURIComponent).join('/')}${search}`;

  const headers = new Headers();
  for (const name of REQUEST_HEADERS) {
    const value = req.headers[name];
    if (typeof value === 'string') headers.set(name, value);
  }
  const hasBody = !['GET', 'HEAD'].includes(req.method ?? 'GET');

  let upstream: Response;
  try {
    upstream = await backendFetch(token, path, {
      method: req.method,
      headers,
      body: hasBody ? (Readable.toWeb(req) as ReadableStream) : undefined,
      duplex: 'half',
    });
  } catch (e) {
    console.error('backend proxy:', e);
    return res.status(502).json({ error: 'No se pudo conectar con el servidor' });
  }

  if (upstream.status === 401) clearSessionCookie(res);
  res.status(upstream.status);
  for (const name of RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) res.setHeader(name, value);
  }
  if (!upstream.body) return res.end();
  await pipeline(Readable.fromWeb(upstream.body as import('stream/web').ReadableStream), res);
}
