import { apiFetch } from './client';

/** One line of a quote as the API expects it. */
export type OrderItemInput = {
  code?: string;
  name: string;
  /** Non-negative decimal string with up to 2 decimals, for example "13500.00". */
  unitPrice: string;
  itemCount: number;
};

export type OrderItem = {
  code: string | null;
  name: string;
  unitPrice: string;
  totalPrice: string;
  itemCount: number;
};

export type OrderClient = { id: string; firstName: string; lastName: string };

export type Order = {
  id: number;
  status: string;
  currency: string;
  /** Computed by the server from the items. */
  totalAmount: number;
  createdAt: string;
  executedAt: string | null;
  items: OrderItem[];
  client: OrderClient | null;
};

export type UploadedFile = {
  id: string;
  originalName: string;
  mimeType?: string;
  sizeBytes?: number;
  fileType?: 'prescription' | 'result' | 'other';
  createdAt?: string;
};

export type OrderStatus = 'quoted' | 'executed' | 'pending_results' | 'results_done';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  quoted: 'Cotizada',
  executed: 'Ejecutada',
  pending_results: 'Resultados pendientes',
  results_done: 'Resultados listos',
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
}

/** A row of the quotes list: the list has the patient, but not the studies. */
export type OrderSummary = {
  id: number;
  status: string;
  totalAmount: number;
  createdAt: string;
  executedAt: string | null;
  client: OrderClient | null;
};

export type OrderFilters = {
  status?: OrderStatus;
  id?: number;
  clientId?: string;
  /** ISO date-times. */
  dateFrom?: string;
  dateTo?: string;
};

export type OrderPage = { orders: OrderSummary[]; total: number; pageCount: number };

// The API documentation and the real answers differ a little (ids come as strings, items as objects):
// everything is normalized here so the screens only see `Order`.
type RawOrder = {
  id: number | string;
  status?: string;
  currency?: string;
  totalAmount: number | string;
  createdAt: string;
  executedAt?: string | null;
  items?: Partial<OrderItem>[];
  client?: OrderClient | null;
};

function toOrder(raw: RawOrder): Order {
  return {
    id: Number(raw.id),
    status: raw.status ?? 'quoted',
    currency: raw.currency ?? 'ARS',
    totalAmount: Number(raw.totalAmount),
    createdAt: raw.createdAt,
    executedAt: raw.executedAt ?? null,
    items: (raw.items ?? []).map((item) => ({
      code: item.code ?? null,
      name: item.name ?? '',
      unitPrice: item.unitPrice ?? '0.00',
      totalPrice: item.totalPrice ?? '0.00',
      itemCount: item.itemCount ?? 1,
    })),
    client: raw.client ?? null,
  };
}

const orderPath = (id: number) => `/api/backend/health-orders/${id}`;

/** Creates the quote. It has no patient yet: linking one is optional and happens in a later step. */
export async function createOrder(items: OrderItemInput[]): Promise<Order> {
  return toOrder(
    await apiFetch<RawOrder>('/api/backend/health-orders', {
      method: 'POST',
      json: { currency: 'ARS', quotationItems: items },
    }),
  );
}

/** Replaces the items of the quote and recomputes its total. */
export async function updateOrderItems(id: number, items: OrderItemInput[]): Promise<Order> {
  return toOrder(await apiFetch<RawOrder>(orderPath(id), { method: 'PUT', json: { orderItems: items } }));
}

export async function getOrder(id: number): Promise<Order> {
  return toOrder(await apiFetch<RawOrder>(orderPath(id)));
}

export async function assignClient(id: number, clientId: string): Promise<Order> {
  return toOrder(await apiFetch<RawOrder>(`${orderPath(id)}/client`, { method: 'PATCH', json: { clientId } }));
}

export async function uploadPrescription(id: number, file: Blob, filename: string): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append('file', file, filename);
  return apiFetch<UploadedFile>(`${orderPath(id)}/prescription`, { method: 'POST', formData });
}

export async function listOrderFiles(id: number): Promise<UploadedFile[]> {
  const files = await apiFetch<UploadedFile[] | { data: UploadedFile[] }>(`${orderPath(id)}/files`);
  return Array.isArray(files) ? files : files.data;
}

export async function deleteOrderFile(id: number, fileId: string): Promise<void> {
  await apiFetch(`${orderPath(id)}/files/${fileId}`, { method: 'DELETE' });
}

type RawOrderPage = {
  data: RawOrder[];
  meta: { itemCount: number; pageCount: number };
};

/**
 * Lists quotes, 1-based `page`. The API returns them oldest first and has no way to sort (it rejects unknown
 * parameters), so the order of the list is the order of the server.
 */
export async function listOrders(filters: OrderFilters, page: number, take: number): Promise<OrderPage> {
  const query = new URLSearchParams({ page: String(page), take: String(take) });
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  const raw = await apiFetch<RawOrderPage>(`/api/backend/health-orders?${query}`);
  return {
    total: raw.meta.itemCount,
    pageCount: raw.meta.pageCount,
    orders: raw.data.map((order) => ({
      id: Number(order.id),
      status: order.status ?? 'quoted',
      totalAmount: Number(order.totalAmount),
      createdAt: order.createdAt,
      executedAt: order.executedAt ?? null,
      client: order.client ?? null,
    })),
  };
}

/** The detail endpoint has the studies but not the patient: the patient comes from the list, filtered by id. */
export async function getOrderDetail(id: number): Promise<Order> {
  const [order, listed] = await Promise.all([getOrder(id), listOrders({ id }, 1, 1)]);
  return { ...order, client: listed.orders[0]?.client ?? null };
}

export async function downloadOrderFile(orderId: number, fileId: string): Promise<Blob> {
  return apiFetch<Blob>(`${orderPath(orderId)}/files/${fileId}`, { responseType: 'blob' });
}
