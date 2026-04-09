/** Four output tones for posterization (black → white). */
const GRAY_LEVELS = [0, 85, 170, 255] as const;

/**
 * Convierte una imagen (data URL) a escala de grises y la reduce a exactamente
 * 4 tonos mediante posterización, usando solo Canvas (sin dependencias pesadas).
 */
export async function processRecipeImageDataUrl(dataUrl: string): Promise<string> {
  if (typeof document === 'undefined') {
    throw new Error('processRecipeImageDataUrl must run in the browser');
  }

  const img = new Image();
  img.decoding = 'async';
  img.src = dataUrl;

  try {
    await img.decode();
  } catch {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
    });
  }

  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (!w || !h) {
    throw new Error('Invalid image dimensions');
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('2D context unavailable');
  }

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, w, h);
  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    const bucket = Math.min(3, Math.floor((gray * 4) / 256));
    const v = GRAY_LEVELS[bucket];
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    // alpha unchanged
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}
