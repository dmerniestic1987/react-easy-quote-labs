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
  /** Computed by the server from the items. */
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
  client: OrderClient | null;
};

export type UploadedFile = { id: string; originalName: string; mimeType?: string; sizeBytes?: number };

// The API documentation and the real answers differ a little (ids come as strings, items as objects):
// everything is normalized here so the screens only see `Order`.
type RawOrder = {
  id: number | string;
  status?: string;
  totalAmount: number | string;
  createdAt: string;
  items?: Partial<OrderItem>[];
  client?: OrderClient | null;
};

function toOrder(raw: RawOrder): Order {
  return {
    id: Number(raw.id),
    status: raw.status ?? 'quoted',
    totalAmount: Number(raw.totalAmount),
    createdAt: raw.createdAt,
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
