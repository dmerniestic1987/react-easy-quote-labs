import type { ParsedUrlQuery } from 'querystring';
import { ORDER_STATUS_LABELS, type OrderFilters, type OrderStatus } from '../api/orders';

/** Filters as the screen edits them; the quotes list keeps them in the URL, so they survive a reload. */
export type QuoteFilterValues = {
  status: OrderStatus | '';
  /** Quote number, digits only. */
  id: string;
  /** Local dates, yyyy-mm-dd. */
  from: string;
  to: string;
  client: { id: string; label: string } | null;
};

export const EMPTY_FILTERS: QuoteFilterValues = { status: '', id: '', from: '', to: '', client: null };
export const PAGE_SIZES = [10, 25, 50];

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? '';
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseFilters(query: ParsedUrlQuery): QuoteFilterValues {
  const status = first(query.status);
  const clientId = first(query.clientId);
  return {
    status: status in ORDER_STATUS_LABELS ? (status as OrderStatus) : '',
    id: /^\d+$/.test(first(query.id)) ? first(query.id) : '',
    from: DATE.test(first(query.from)) ? first(query.from) : '',
    to: DATE.test(first(query.to)) ? first(query.to) : '',
    client: clientId ? { id: clientId, label: first(query.clientName) || 'Paciente seleccionado' } : null,
  };
}

export function parsePaging(query: ParsedUrlQuery): { page: number; size: number } {
  const size = Number(first(query.size));
  return { page: Math.max(1, Number(first(query.page)) || 1), size: PAGE_SIZES.includes(size) ? size : PAGE_SIZES[0] };
}

export function buildQuery(filters: QuoteFilterValues, page: number, size: number): Record<string, string> {
  const query: Record<string, string> = {};
  if (filters.status) query.status = filters.status;
  if (filters.id) query.id = filters.id;
  if (filters.from) query.from = filters.from;
  if (filters.to) query.to = filters.to;
  if (filters.client) {
    query.clientId = filters.client.id;
    query.clientName = filters.client.label;
  }
  if (page > 1) query.page = String(page);
  if (size !== PAGE_SIZES[0]) query.size = String(size);
  return query;
}

/** Filters in the form the API expects: day boundaries in the local time zone, as ISO date-times. */
export function toApiFilters(filters: QuoteFilterValues): OrderFilters {
  const start = (date: string) => {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
  };
  const end = (date: string) => {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
  };
  return {
    status: filters.status || undefined,
    id: filters.id ? Number(filters.id) : undefined,
    clientId: filters.client?.id,
    dateFrom: filters.from ? start(filters.from) : undefined,
    dateTo: filters.to ? end(filters.to) : undefined,
  };
}

export function hasFilters(filters: QuoteFilterValues): boolean {
  return Boolean(filters.status || filters.id || filters.from || filters.to || filters.client);
}
