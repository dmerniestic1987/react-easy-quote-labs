export class ApiError extends Error {
  constructor(
    /** HTTP status, or 0 when the server could not be reached. */
    public readonly status: number,
    message: string,
    public readonly retryAfterSeconds?: number,
    /** Method and path of the failed call, for logs. */
    public readonly endpoint?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** The backend answers `{ message: string | string[] }` (validation errors are lists); our own routes `{ error }`. */
function readErrorMessage(body: unknown): string {
  const b = (body ?? {}) as { message?: unknown; error?: unknown };
  if (Array.isArray(b.message)) return b.message.join('. ');
  if (typeof b.message === 'string') return b.message;
  if (typeof b.error === 'string') return b.error;
  return 'Error inesperado';
}

type UnauthorizedListener = () => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();

/** Subscribes to "the session is no longer valid" events. Returns the unsubscribe function. */
export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
}

type ApiFetchOptions = Omit<RequestInit, 'body'> & {
  json?: unknown;
  /** Multipart body (file uploads). The browser sets the Content-Type with its boundary. */
  formData?: FormData;
  /** Set to false for calls where a 401 is an expected answer (login, initial session check). */
  notifyUnauthorized?: boolean;
};

export async function apiFetch<T = void>(
  path: string,
  { json, formData, notifyUnauthorized = true, headers, ...init }: ApiFetchOptions = {},
): Promise<T> {
  const requestHeaders = new Headers(headers);
  if (json !== undefined) requestHeaders.set('Content-Type', 'application/json');

  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: requestHeaders,
      body: formData ?? (json === undefined ? undefined : JSON.stringify(json)),
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor', undefined, `${init.method ?? 'GET'} ${path}`);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const retryAfter = Number(response.headers.get('retry-after'));
    if (response.status === 401 && notifyUnauthorized) unauthorizedListeners.forEach((l) => l());
    throw new ApiError(
      response.status,
      readErrorMessage(body),
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
      `${init.method ?? 'GET'} ${path}`,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
