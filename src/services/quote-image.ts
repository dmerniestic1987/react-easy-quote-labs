export type QuoteImageData = {
  number: number;
  createdAt: string;
  items: { code: string | null; name: string; itemCount: number }[];
  total: number;
};

export const QUOTE_TITLE = 'CEMEVYF Atención Médica - Cotizaciones de salud';

const WIDTH = 1080;
const PADDING = 72;
const ACCENT = '#06A1C0';
const INK = '#111418';
const MUTED = '#5b6470';

const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 2 });

export function formatMoney(amount: number): string {
  return money.format(amount);
}

export function formatQuoteDate(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  text.split(/\s+/).forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  return lines;
}

/** Draws the quote when `draw` is true; always returns the height it needs. */
function layout(ctx: CanvasRenderingContext2D, data: QuoteImageData, font: string, draw: boolean, height: number): number {
  const inner = WIDTH - PADDING * 2;
  let y = 0;
  if (draw) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, WIDTH, height);
    ctx.fillStyle = ACCENT;
    ctx.fillRect(0, 0, WIDTH, 20);
  }
  ctx.textBaseline = 'top';
  y = 20 + 64;

  ctx.font = `700 54px ${font}`;
  wrap(ctx, QUOTE_TITLE, inner).forEach((line) => {
    if (draw) {
      ctx.fillStyle = INK;
      ctx.fillText(line, PADDING, y);
    }
    y += 68;
  });

  y += 12;
  ctx.font = `400 36px ${font}`;
  if (draw) {
    ctx.fillStyle = MUTED;
    ctx.fillText(`Cotización N° ${data.number}`, PADDING, y);
  }
  y += 50;
  if (draw) {
    ctx.fillStyle = MUTED;
    ctx.fillText(`Fecha: ${formatQuoteDate(data.createdAt)}`, PADDING, y);
  }
  y += 70;

  if (draw) {
    ctx.fillStyle = '#d9dee4';
    ctx.fillRect(PADDING, y, inner, 3);
  }
  y += 40;

  ctx.font = `700 40px ${font}`;
  if (draw) {
    ctx.fillStyle = INK;
    ctx.fillText('Estudios cotizados', PADDING, y);
  }
  y += 70;

  data.items.forEach((item) => {
    ctx.font = `500 38px ${font}`;
    const label = item.itemCount > 1 ? `${item.name}  ×${item.itemCount}` : item.name;
    wrap(ctx, label, inner - 40).forEach((line) => {
      if (draw) {
        ctx.fillStyle = INK;
        ctx.fillText(line, PADDING + 40, y);
      }
      y += 50;
    });
    if (draw) {
      ctx.fillStyle = ACCENT;
      ctx.fillRect(PADDING, y - 50 * Math.max(1, wrap(ctx, label, inner - 40).length) + 14, 10, 10);
    }
    if (item.code) {
      ctx.font = `400 30px ${font}`;
      if (draw) {
        ctx.fillStyle = MUTED;
        ctx.fillText(item.code, PADDING + 40, y - 6);
      }
      y += 40;
    }
    y += 22;
  });

  y += 20;
  const boxHeight = 150;
  if (draw) {
    ctx.fillStyle = '#e6f6f9';
    ctx.beginPath();
    ctx.roundRect(PADDING, y, inner, boxHeight, 24);
    ctx.fill();
    ctx.fillStyle = ACCENT;
    ctx.fillRect(PADDING, y + 24, 8, boxHeight - 48);
    ctx.fillStyle = INK;
    ctx.font = `700 40px ${font}`;
    ctx.textBaseline = 'middle';
    ctx.fillText('Total', PADDING + 44, y + boxHeight / 2);
    ctx.font = `700 76px ${font}`;
    ctx.fillStyle = ACCENT;
    ctx.textAlign = 'right';
    ctx.fillText(formatMoney(data.total), PADDING + inner - 36, y + boxHeight / 2 + 4);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
  }
  y += boxHeight + 64;
  return y;
}

/** Renders the quote as a PNG, ready to share on WhatsApp or Instagram. `fontFamily` is a CSS font-family value. */
export async function renderQuoteImage(data: QuoteImageData, fontFamily: string): Promise<Blob> {
  // The page fonts are loaded lazily: make sure the ones used here are ready before measuring text.
  await Promise.all(
    ['400 36px', '500 38px', '700 54px'].map((spec) => document.fonts.load(`${spec} ${fontFamily}`).catch(() => [])),
  );
  const measure = document.createElement('canvas').getContext('2d');
  if (!measure) throw new Error('2D context unavailable');
  const height = layout(measure, data, fontFamily, false, 0);

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable');
  layout(ctx, data, fontFamily, true, height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG encoding failed'))), 'image/png'),
  );
}
