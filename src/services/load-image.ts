export type RgbaImage = {
  /** RGBA bytes as returned by `getImageData`. */
  data: Uint8ClampedArray;
  width: number;
  height: number;
};

type Drawable = { source: CanvasImageSource; width: number; height: number; release: () => void };

/** Decodes the file applying its EXIF orientation, so photos taken in portrait are not rotated. */
async function decode(file: Blob): Promise<Drawable> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
  } catch {
    // Browsers without createImageBitmap options: an <img> applies the EXIF orientation by itself.
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    try {
      await img.decode();
    } catch {
      URL.revokeObjectURL(url);
      throw new Error('No se pudo leer la imagen. Probá con un archivo JPG o PNG.');
    }
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) };
  }
}

/**
 * Decodes an image file and scales it down so its longest side is at most `maxSide` pixels.
 * Working at that size keeps memory low on entry-level phones even when the camera takes 50-108 MP photos.
 */
export async function decodeImageFile(file: Blob, maxSide: number): Promise<RgbaImage> {
  const drawable = await decode(file);
  try {
    if (!drawable.width || !drawable.height) throw new Error('Invalid image dimensions');
    const scale = Math.min(1, maxSide / Math.max(drawable.width, drawable.height));
    const width = Math.max(1, Math.round(drawable.width * scale));
    const height = Math.max(1, Math.round(drawable.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('2D context unavailable');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(drawable.source, 0, 0, width, height);
    return { data: ctx.getImageData(0, 0, width, height).data, width, height };
  } finally {
    drawable.release();
  }
}
