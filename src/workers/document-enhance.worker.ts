import { enhanceDocument } from '../services/document-enhance';

export type EnhanceRequest = { data: Uint8ClampedArray; width: number; height: number };
export type EnhanceResponse = { levels: Uint8Array } | { error: string };

self.onmessage = (event: MessageEvent<EnhanceRequest>) => {
  const { data, width, height } = event.data;
  try {
    const levels = enhanceDocument(data, width, height);
    self.postMessage({ levels } satisfies EnhanceResponse, { transfer: [levels.buffer] });
  } catch (e) {
    self.postMessage({ error: e instanceof Error ? e.message : String(e) } satisfies EnhanceResponse);
  }
};
