import { logError } from '../api/errors';
import { downloadOrderFile } from '../api/orders';

/**
 * Files of a quote never change (each has its own id), so once downloaded they are kept in the browser's Cache
 * Storage: opening the same quote again does not download them again, which matters on a slow mobile connection.
 * They are health data, so the cache is emptied when the user logs out. Cache Storage only exists in a secure
 * context (HTTPS or localhost); elsewhere everything works, just without the cache.
 */
const CACHE_NAME = 'eq-files-v1';
const MAX_ENTRIES = 60;
const MAX_PARALLEL = 3;

const keyOf = (orderId: number, fileId: string) => `/__file-cache__/${orderId}/${fileId}`;
const cacheAvailable = () => typeof caches !== 'undefined' && typeof window !== 'undefined' && window.isSecureContext;

// At most MAX_PARALLEL downloads at once, so a quote with many images does not choke a slow connection.
let running = 0;
const waiting: Array<() => void> = [];
async function withSlot<T>(task: () => Promise<T>): Promise<T> {
  if (running >= MAX_PARALLEL) await new Promise<void>((resolve) => waiting.push(resolve));
  running++;
  try {
    return await task();
  } finally {
    running--;
    waiting.shift()?.();
  }
}

async function store(key: string, blob: Blob): Promise<void> {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(key, new Response(blob, { headers: { 'Content-Type': blob.type } }));
    const keys = await cache.keys();
    // Oldest first: drop the ones above the limit.
    await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_ENTRIES)).map((request) => cache.delete(request)));
  } catch (e) {
    logError('No se pudo guardar el archivo en la caché', e);
  }
}

/** The file of a quote, from the cache when it is there and from the server otherwise. */
export async function getFileBlob(orderId: number, fileId: string): Promise<Blob> {
  const key = keyOf(orderId, fileId);
  if (cacheAvailable()) {
    try {
      const hit = await (await caches.open(CACHE_NAME)).match(key);
      if (hit) return await hit.blob();
    } catch (e) {
      logError('No se pudo leer la caché de archivos', e);
    }
  }
  const blob = await withSlot(() => downloadOrderFile(orderId, fileId));
  if (cacheAvailable()) void store(key, blob);
  return blob;
}

export async function clearFileCache(): Promise<void> {
  try {
    if (typeof caches !== 'undefined') await caches.delete(CACHE_NAME);
  } catch {
    // ignore
  }
}
