export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
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
  /** Set to false for calls where a 401 is an expected answer (login, initial session check). */
  notifyUnauthorized?: boolean;
};

export async function apiFetch<T = void>(
  path: string,
  { json, notifyUnauthorized = true, headers, ...init }: ApiFetchOptions = {},
): Promise<T> {
  const requestHeaders = new Headers(headers);
  if (json !== undefined) requestHeaders.set('Content-Type', 'application/json');

  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: requestHeaders,
      body: json === undefined ? undefined : JSON.stringify(json),
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const retryAfter = Number(response.headers.get('retry-after'));
    if (response.status === 401 && notifyUnauthorized) unauthorizedListeners.forEach((l) => l());
    throw new ApiError(
      response.status,
      typeof body.error === 'string' ? body.error : 'Error inesperado',
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
