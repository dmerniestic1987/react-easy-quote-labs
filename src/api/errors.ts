import { ApiError } from './client';

export type UserFacingError = { title: string; message: string };

/**
 * Logs an error to the console as a plain object. The Next.js dev overlay opens a full screen error for every
 * `console.error` that receives an `Error` instance, even when the app handles it (a popup is already shown).
 */
export function logError(context: string, error: unknown): void {
  const details =
    error instanceof ApiError
      ? { status: error.status, endpoint: error.endpoint, message: error.message, retryAfterSeconds: error.retryAfterSeconds }
      : { message: error instanceof Error ? error.message : String(error) };
  console.error(`[cotizaciones] ${context}`, { ...details, stack: error instanceof Error ? error.stack : undefined });
}

/**
 * Turns any error into a message for the secretary and logs the technical detail to the console.
 * `action` says what was being done, for example "crear la cotización".
 */
export function describeError(error: unknown, action: string): UserFacingError {
  logError(`No se pudo ${action}`, error);
  const title = `No se pudo ${action}`;
  if (!(error instanceof ApiError)) return { title, message: 'Ocurrió un error inesperado. Probá de nuevo.' };
  if (error.status === 0) {
    return { title, message: 'No hay conexión con el servidor. Revisá tu internet y probá de nuevo.' };
  }
  if (error.status >= 500) {
    return {
      title,
      message: `El servidor tuvo un problema (error ${error.status}). Probá de nuevo en unos minutos.`,
    };
  }
  if (error.status === 403) return { title, message: 'Tu usuario no tiene permiso para hacer esto.' };
  if (error.status === 404) return { title, message: `No se encontró lo solicitado. ${error.message}` };
  return { title, message: error.message };
}
