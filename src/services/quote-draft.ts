import type { GridRowId, GridRowSelectionModel } from '@mui/x-data-grid';
import type { Client } from '../api/clients';

/**
 * The quote in progress survives a page reload (for instance when Android discards the browser tab while the
 * camera app is open). It lives in sessionStorage: per tab, gone when the tab is closed, and per user.
 * Photos are not stored: the ones already uploaded are recovered from the server.
 */
const KEY_PREFIX = 'eq.quote-draft.';
const KEY_VERSION = 'v2.';

export type QuoteDraft = {
  step: number;
  selection: { type: 'include' | 'exclude'; ids: GridRowId[] };
  /** The quote created in the API, and the selection it was created from. */
  order: { id: number; signature: string } | null;
  /** Patient chosen in step 3 and whether the API already knows about it. */
  client: Client | null;
  assignedClientId: string | null;
};

export function serializeSelection(model: GridRowSelectionModel): QuoteDraft['selection'] {
  return { type: model.type, ids: Array.from(model.ids) };
}

export function deserializeSelection(selection: QuoteDraft['selection']): GridRowSelectionModel {
  return { type: selection.type, ids: new Set(selection.ids) };
}

function isDraft(value: unknown): value is QuoteDraft {
  const draft = value as QuoteDraft | null;
  return (
    !!draft &&
    Number.isInteger(draft.step) &&
    (draft.selection?.type === 'include' || draft.selection?.type === 'exclude') &&
    Array.isArray(draft.selection.ids) &&
    (draft.order === null || (Number.isInteger(draft.order?.id) && typeof draft.order.signature === 'string')) &&
    (draft.client === null || typeof draft.client?.id === 'string')
  );
}

// Storage can be unavailable (private mode, blocked site data) or full: the draft is a convenience, never fail.
export function loadDraft(userId: string): QuoteDraft | null {
  try {
    const raw = window.sessionStorage.getItem(KEY_PREFIX + KEY_VERSION + userId);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return isDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveDraft(userId: string, draft: QuoteDraft): void {
  try {
    window.sessionStorage.setItem(KEY_PREFIX + KEY_VERSION + userId, JSON.stringify(draft));
  } catch {
    // ignore
  }
}

export function clearDraft(userId: string): void {
  try {
    window.sessionStorage.removeItem(KEY_PREFIX + KEY_VERSION + userId);
  } catch {
    // ignore
  }
}

/** Removes the drafts of every user (and of older versions), so the next person never sees a patient's data. */
export function clearAllDrafts(): void {
  try {
    Object.keys(window.sessionStorage)
      .filter((key) => key.startsWith(KEY_PREFIX))
      .forEach((key) => window.sessionStorage.removeItem(key));
  } catch {
    // ignore
  }
}
