import { apiFetch } from './client';

export type DocumentType = 'dni' | 'pass' | 'cuil' | 'cuit' | 'other';

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  dni: 'DNI',
  pass: 'Pasaporte',
  cuil: 'CUIL',
  cuit: 'CUIT',
  other: 'Otro',
};

export type Client = {
  id: string;
  firstName: string;
  lastName: string;
  personIdType: DocumentType | null;
  personId: string | null;
  email: string | null;
  phoneNumber: string | null;
};

export type NewClient = {
  firstName: string;
  lastName: string;
  personIdType: DocumentType;
  personId: string;
  email?: string;
  phoneNumber?: string;
};

const PAGE_SIZE = 20;
const MAX_QUERIES = 6;

type ClientPage = { data: Client[]; meta: { hasNextPage: boolean; itemCount: number } };

async function fetchClients(params: Record<string, string>): Promise<ClientPage> {
  const query = new URLSearchParams({ take: String(PAGE_SIZE), ...params });
  const page = await apiFetch<ClientPage | Client[]>(`/api/backend/clients?${query}`);
  return Array.isArray(page) ? { data: page, meta: { hasNextPage: false, itemCount: page.length } } : page;
}

/**
 * The API filters by first name and last name separately (partial, case insensitive). To search a single text
 * ("lopez", "maria lopez", "lopez maria") this builds every sensible combination.
 */
export function buildNameQueries(text: string): Record<string, string>[] {
  const tokens = text.trim().split(/\s+/).filter(Boolean).slice(0, 4);
  if (tokens.length === 0) return [];
  if (tokens.length === 1) return [{ firstName: tokens[0] }, { lastName: tokens[0] }];
  const queries: Record<string, string>[] = [];
  for (let i = 1; i < tokens.length; i++) {
    const left = tokens.slice(0, i).join(' ');
    const right = tokens.slice(i).join(' ');
    queries.push({ firstName: left, lastName: right }, { firstName: right, lastName: left });
  }
  return queries.slice(0, MAX_QUERIES);
}

export type ClientSearchResult = { clients: Client[]; hasMore: boolean };

function merge(pages: ClientPage[]): ClientSearchResult {
  const byId = new Map<string, Client>();
  pages.forEach((page) => page.data.forEach((client) => byId.set(client.id, client)));
  const clients = Array.from(byId.values()).sort(
    (a, b) => a.lastName.localeCompare(b.lastName, 'es') || a.firstName.localeCompare(b.firstName, 'es'),
  );
  return { clients, hasMore: pages.some((page) => page.meta.hasNextPage) };
}

export async function searchClientsByName(text: string): Promise<ClientSearchResult> {
  return merge(await Promise.all(buildNameQueries(text).map(fetchClients)));
}

export async function searchClientsByDocument(type: DocumentType, number: string): Promise<ClientSearchResult> {
  return merge([await fetchClients({ personIdType: type, personId: number.trim() })]);
}

export async function createClient(client: NewClient): Promise<string> {
  const body = {
    ...client,
    email: client.email?.trim() || undefined,
    phoneNumber: client.phoneNumber?.trim() || undefined,
  };
  return (await apiFetch<{ id: string }>('/api/backend/clients', { method: 'POST', json: body })).id;
}
