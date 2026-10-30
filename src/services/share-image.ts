import { logError } from '../api/errors';

export type ShareResult = 'shared' | 'downloaded' | 'cancelled';

/** The system share sheet (WhatsApp, Instagram...) needs a secure context (HTTPS) and a browser that supports it. */
export function canShareFiles(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function' && window.isSecureContext;
}

function download(file: File): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Shares the image with the system share sheet; when that is not available, downloads it. */
export async function shareImage(blob: Blob, filename: string, title: string): Promise<ShareResult> {
  const file = new File([blob], filename, { type: blob.type || 'image/png' });
  if (canShareFiles() && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
      logError('navigator.share falló, se descarga la imagen', e);
    }
  }
  download(file);
  return 'downloaded';
}

/** Copying an image needs a secure context (HTTPS or localhost) and the async clipboard API. */
export function canCopyImage(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof ClipboardItem !== 'undefined' &&
    typeof navigator.clipboard?.write === 'function' &&
    window.isSecureContext
  );
}

/** Copies the image so it can be pasted into WhatsApp Web or an e-mail; when it cannot, downloads it. */
export async function copyImage(blob: Blob, filename: string): Promise<'copied' | 'downloaded'> {
  if (canCopyImage()) {
    try {
      await navigator.clipboard.write([new ClipboardItem({ [blob.type || 'image/png']: blob })]);
      return 'copied';
    } catch (e) {
      logError('No se pudo copiar la imagen al portapapeles, se descarga', e);
    }
  }
  download(new File([blob], filename, { type: blob.type || 'image/png' }));
  return 'downloaded';
}
