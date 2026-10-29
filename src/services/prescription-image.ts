import { enhanceDocument } from './document-enhance';
import { decodeImageFile, type RgbaImage } from './load-image';
import { encodeGray4Png } from './png-gray4';
import type { EnhanceResponse } from '../workers/document-enhance.worker';

/** Longest side of the stored copy. About 260 dpi on an A5 order: readable handwriting, small file. */
export const PRESCRIPTION_MAX_SIDE = 2200;

export type EnhancedImage = {
  /** 4-bit grayscale PNG. */
  blob: Blob;
  width: number;
  height: number;
};

function enhanceInWorker(image: RgbaImage): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/document-enhance.worker.ts', import.meta.url));
    worker.onmessage = (event: MessageEvent<EnhanceResponse>) => {
      worker.terminate();
      if ('error' in event.data) reject(new Error(event.data.error));
      else resolve(event.data.levels);
    };
    worker.onerror = (event) => {
      worker.terminate();
      reject(new Error(event.message || 'Worker failed'));
    };
    // The buffer is copied, not transferred, so the main-thread fallback below can still use it.
    worker.postMessage({ data: image.data, width: image.width, height: image.height });
  });
}

async function enhance(image: RgbaImage): Promise<Uint8Array> {
  if (typeof Worker === 'undefined') return enhanceDocument(image.data, image.width, image.height);
  try {
    return await enhanceInWorker(image);
  } catch {
    return enhanceDocument(image.data, image.width, image.height);
  }
}

/**
 * Turns a photo of a medical order (JPG or PNG, any size) into a clean, legible, small grayscale copy:
 * shadows removed, paper white, ink in 16 gray levels. Must run in the browser.
 */
export async function enhancePrescriptionImage(file: Blob): Promise<EnhancedImage> {
  const image = await decodeImageFile(file, PRESCRIPTION_MAX_SIDE);
  const levels = await enhance(image);
  const blob = await encodeGray4Png(levels, image.width, image.height);
  return { blob, width: image.width, height: image.height };
}
