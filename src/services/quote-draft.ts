import type { GridRowId, GridRowSelectionModel } from '@mui/x-data-grid';

/**
 * The quote in progress survives a page reload (for instance when Android discards the browser tab while the
 * camera app is open). It lives in sessionStorage: per tab, gone when the tab is closed, and per user.
 * Photos are not stored.
 */
const KEY_PREFIX = 'eq.quote-draft.v1.';

export type QuoteDraft = {
  step: number;
  selection: { type: 'include' | 'exclude'; ids: GridRowId[] };
  contact: { fullName: string; email: string; phone: string };
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
    typeof draft.contact?.fullName === 'string' &&
    typeof draft.contact.email === 'string' &&
    typeof draft.contact.phone === 'string'
  );
}

// Storage can be unavailable (private mode, blocked site data) or full: the draft is a convenience, never fail.
export function loadDraft(userId: string): QuoteDraft | null {
  try {
    const raw = window.sessionStorage.getItem(KEY_PREFIX + userId);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return isDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveDraft(userId: string, draft: QuoteDraft): void {
  try {
    window.sessionStorage.setItem(KEY_PREFIX + userId, JSON.stringify(draft));
  } catch {
    // ignore
  }
}

export function clearDraft(userId: string): void {
  try {
    window.sessionStorage.removeItem(KEY_PREFIX + userId);
  } catch {
    // ignore
  }
}

/** Removes the drafts of every user, so the next person using the tab never sees a patient's data. */
export function clearAllDrafts(): void {
  try {
    Object.keys(window.sessionStorage)
      .filter((key) => key.startsWith(KEY_PREFIX))
      .forEach((key) => window.sessionStorage.removeItem(key));
  } catch {
    // ignore
  }
}
