const DEFAULT_API_BASE_URL = 'http://localhost:9900';

export function getApiBaseUrl(): string {
  return (process.env.API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
}
