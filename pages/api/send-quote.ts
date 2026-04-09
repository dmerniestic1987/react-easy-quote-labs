import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import type { LabItem } from '../../src/services/lab-calculator';

const DEFAULT_INBOX = 'nico.recepcion.vida.y.fortaleza@gmail.com';
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

type PatientPayload = {
  fullName: string;
  email?: string;
  phone?: string;
};

type Body = {
  items?: LabItem[];
  suggestedTotal?: string;
  patient?: PatientPayload;
  imageDataUrl?: string | null;
};

function parseDataUrl(dataUrl: string): { buffer: Buffer; mime: string } | null {
  const trimmed = dataUrl.trim();
  const sep = ';base64,';
  const i = trimmed.indexOf(sep);
  if (i === -1) return null;
  const header = trimmed.slice(0, i);
  if (!header.startsWith('data:')) return null;
  const mime = header.slice('data:'.length) || 'image/png';
  const b64 = trimmed.slice(i + sep.length);
  try {
    const buffer = Buffer.from(b64, 'base64');
    return { mime, buffer };
  } catch {
    return null;
  }
}

function buildTextBody(items: LabItem[], suggestedTotal: string, patient: PatientPayload, hasImage: boolean): string {
  const lines = items.map(
    (it) => `- [${it.code}] ${it.name} — $${new Intl.NumberFormat('es-AR').format(it.price)}`,
  );
  return [
    'Nueva cotización de laboratorio',
    '',
    'Estudios:',
    ...lines,
    '',
    `Total sugerido: $${suggestedTotal}`,
    '',
    'Datos del paciente:',
    `Nombre: ${patient.fullName}`,
    patient.email ? `Email: ${patient.email}` : '',
    patient.phone ? `Celular: ${patient.phone}` : '',
    '',
    hasImage ? 'Adjunto: imagen de receta (alto contraste).' : 'No se adjuntó imagen de receta.',
    '',
  ]
    .filter(Boolean)
    .join('\n');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body as Body;
  const items = Array.isArray(body.items) ? body.items : [];
  const suggestedTotal = typeof body.suggestedTotal === 'string' ? body.suggestedTotal : '';
  const patient = body.patient;

  if (!patient || typeof patient.fullName !== 'string' || !patient.fullName.trim()) {
    return res.status(400).json({ error: 'Nombre del paciente requerido' });
  }

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM;
  const to = process.env.QUOTE_INBOX || DEFAULT_INBOX;

  if (!host || !port || !user || !pass || !from) {
    console.error('send-quote: missing SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, or EMAIL_FROM');
    return res.status(500).json({ error: 'Servidor de correo no configurado' });
  }

  let attachment: { filename: string; content: Buffer; contentType: string } | undefined;
  let hasImage = false;
  if (body.imageDataUrl && typeof body.imageDataUrl === 'string' && body.imageDataUrl.length > 0) {
    const parsed = parseDataUrl(body.imageDataUrl);
    if (!parsed) {
      return res.status(400).json({ error: 'Imagen inválida' });
    }
    if (parsed.buffer.length > MAX_IMAGE_BYTES) {
      return res.status(400).json({ error: 'La imagen es demasiado grande' });
    }
    const ext = parsed.mime.includes('png') ? 'png' : parsed.mime.includes('jpeg') || parsed.mime.includes('jpg') ? 'jpg' : 'png';
    attachment = {
      filename: `receta.${ext}`,
      content: parsed.buffer,
      contentType: parsed.mime,
    };
    hasImage = true;
  }

  const text = buildTextBody(items, suggestedTotal, patient, hasImage);

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to,
      subject: `Cotización laboratorio — ${patient.fullName.trim()}`,
      text,
      attachments: attachment ? [attachment] : undefined,
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('send-quote:', e);
    return res.status(500).json({ error: 'No se pudo enviar el correo' });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
};
