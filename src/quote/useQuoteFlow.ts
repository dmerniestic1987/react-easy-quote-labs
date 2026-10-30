import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GridRowSelectionModel } from '@mui/x-data-grid';
import type { Client } from '../api/clients';
import { describeError, logError } from '../api/errors';
import {
  assignClient,
  createOrder,
  listOrderFiles,
  updateOrderItems,
  type OrderItemInput,
  type UploadedFile,
} from '../api/orders';
import { useAuth } from '../auth/AuthProvider';
import type { ErrorDialogState } from '../ErrorDialog';
import type { UploadSummary } from '../prescriptions/PrescriptionPicker';
import type { LabItem } from '../services/lab-calculator';
import { clearDraft, deserializeSelection, loadDraft, saveDraft, serializeSelection } from '../services/quote-draft';
import {
  EMPTY_SELECTION,
  formatSuggestedTotal,
  getSelectedLabs,
  removeFromSelection,
  selectionSignature,
  suggestedTotalAmount,
} from '../services/quote-selection';

export const STEP = { STUDIES: 0, PRESCRIPTIONS: 1, PATIENT: 2, SUMMARY: 3 } as const;
export const STEP_COUNT = 4;

const NO_UPLOADS: UploadSummary = { uploading: 0, failed: 0, uploaded: 0, pending: 0 };

function toOrderItem(lab: LabItem): OrderItemInput {
  return { code: lab.code, name: lab.name, unitPrice: lab.price.toFixed(2), itemCount: 1 };
}

/**
 * The whole quote flow, shared by the mobile and the desktop interface: which step is open, what is selected,
 * the quote created in the API, the files, the patient, and the calls made when moving between steps.
 * The interfaces only decide how all of that looks.
 */
export function useQuoteFlow() {
  const { state: auth } = useAuth();
  const userId = auth.status === 'authenticated' ? auth.user.id : null;
  // This hook only runs in the browser after the session check, so reading storage here is safe.
  const [draft] = useState(() => (userId ? loadDraft(userId) : null));

  // A restored step needs the quote it belongs to.
  const [activeStep, setActiveStep] = useState(() =>
    draft?.order ? Math.min(Math.max(draft.step, 0), STEP_COUNT - 1) : 0,
  );
  // The grid selection is the single source of truth: the studies are derived from it.
  const [selection, setSelection] = useState<GridRowSelectionModel>(() =>
    draft ? deserializeSelection(draft.selection) : EMPTY_SELECTION,
  );
  // The quote created in the API (kept in memory and in the draft) and the selection it was created from.
  const [order, setOrder] = useState(() => draft?.order ?? null);
  const [client, setClient] = useState<Client | null>(() => draft?.client ?? null);
  const [assignedClientId, setAssignedClientId] = useState<string | null>(() => draft?.assignedClientId ?? null);
  const [existingFiles, setExistingFiles] = useState<UploadedFile[] | undefined>(undefined);
  const [uploads, setUploads] = useState<UploadSummary>(NO_UPLOADS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorDialogState | null>(null);
  const [confirmSkip, setConfirmSkip] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(() =>
    draft?.order || (draft && draft.selection.ids.length > 0) ? 'Recuperamos tu cotización en curso.' : null,
  );
  // Changing it remounts the file list, which starts a new quote with an empty one.
  const [pickerKey, setPickerKey] = useState(0);

  const quoteItems = useMemo(() => getSelectedLabs(selection), [selection]);
  const suggestedTotal = useMemo(() => formatSuggestedTotal(quoteItems), [quoteItems]);
  const quotedAmount = useMemo(() => suggestedTotalAmount(quoteItems), [quoteItems]);

  const removeItem = useCallback((item: LabItem) => {
    setSelection((current) => removeFromSelection(current, item.id));
  }, []);

  // Keep the quote in progress so a reload (e.g. Android discarding the tab while the camera is open) loses nothing.
  useEffect(() => {
    if (userId) {
      saveDraft(userId, {
        step: activeStep,
        selection: serializeSelection(selection),
        order,
        client,
        assignedClientId,
      });
    }
  }, [userId, activeStep, selection, order, client, assignedClientId]);

  // After a reload, recover which files the server already has for the quote.
  const restoredOrderId = draft?.order?.id;
  useEffect(() => {
    if (restoredOrderId === undefined) return;
    listOrderFiles(restoredOrderId)
      .then(setExistingFiles)
      .catch((e) => logError('No se pudieron recuperar los archivos de la cotización', e));
  }, [restoredOrderId]);

  const fail = (e: unknown, action: string, retry?: () => void) => {
    setError({ ...describeError(e, action), onRetry: retry });
  };

  /** Step 1 -> 2: creates the quote in the API, or updates its studies if it already exists. */
  const saveStudies = async () => {
    const signature = selectionSignature(quoteItems);
    if (order?.signature === signature) {
      setActiveStep(STEP.PRESCRIPTIONS);
      return;
    }
    setBusy(true);
    try {
      const saved = order
        ? await updateOrderItems(order.id, quoteItems.map(toOrderItem))
        : await createOrder(quoteItems.map(toOrderItem));
      setOrder({ id: saved.id, signature });
      setActiveStep(STEP.PRESCRIPTIONS);
    } catch (e) {
      fail(e, order ? 'actualizar la cotización' : 'crear la cotización', () => void saveStudies());
    } finally {
      setBusy(false);
    }
  };

  /** Step 2 -> 3: files are uploaded as they are accepted, so this only checks nothing is left behind. */
  const leavePrescriptions = () => {
    const problems: string[] = [];
    if (uploads.pending > 0) problems.push(`${uploads.pending} foto(s) sin aceptar`);
    if (uploads.failed > 0) problems.push(`${uploads.failed} archivo(s) que no se subieron`);
    if (problems.length > 0) {
      setConfirmSkip(`Hay ${problems.join(' y ')}. Si continuás, no se guardarán en la cotización.`);
      return;
    }
    setActiveStep(STEP.PATIENT);
  };

  /** Step 3 -> 4: links the patient; without one nothing is called. */
  const savePatient = async () => {
    if (!order || !client || client.id === assignedClientId) {
      setActiveStep(STEP.SUMMARY);
      return;
    }
    setBusy(true);
    try {
      await assignClient(order.id, client.id);
      setAssignedClientId(client.id);
      setActiveStep(STEP.SUMMARY);
    } catch (e) {
      fail(e, 'vincular el paciente', () => void savePatient());
    } finally {
      setBusy(false);
    }
  };

  const startNewQuote = () => {
    if (userId) clearDraft(userId);
    setSelection(EMPTY_SELECTION);
    setOrder(null);
    setClient(null);
    setAssignedClientId(null);
    setExistingFiles(undefined);
    setUploads(NO_UPLOADS);
    setPickerKey((key) => key + 1);
    setNotice(null);
    setActiveStep(STEP.STUDIES);
  };

  const next = () => {
    if (activeStep === STEP.STUDIES) void saveStudies();
    else if (activeStep === STEP.PRESCRIPTIONS) leavePrescriptions();
    else if (activeStep === STEP.PATIENT) void savePatient();
    else startNewQuote();
  };

  /** Only backwards: going forward requires going through the step, which saves what it has to. */
  const goToStep = (target: number) => {
    if (!busy && target < activeStep) setActiveStep(target);
  };
  const back = () => goToStep(activeStep - 1);

  const uploading = uploads.uploading > 0;
  const hasFiles = uploads.uploaded + uploads.uploading + uploads.failed + uploads.pending > 0;
  const nextLabel = (() => {
    if (busy) return 'Guardando…';
    if (activeStep === STEP.STUDIES) return 'Continuar';
    if (activeStep === STEP.PRESCRIPTIONS) return uploading ? 'Subiendo…' : hasFiles ? 'Continuar' : 'Omitir';
    if (activeStep === STEP.PATIENT) return client ? 'Continuar' : 'Omitir';
    return 'Nueva cotización';
  })();
  const nextDisabled =
    busy ||
    (activeStep === STEP.STUDIES && quoteItems.length === 0) ||
    (activeStep === STEP.PRESCRIPTIONS && uploading);

  return {
    activeStep,
    busy,
    selection,
    setSelection,
    quoteItems,
    suggestedTotal,
    quotedAmount,
    removeItem,
    order,
    client,
    setClient,
    existingFiles,
    pickerKey,
    setUploads,
    error,
    setError,
    closeError: () => setError(null),
    confirmSkip,
    closeConfirmSkip: () => setConfirmSkip(null),
    confirmSkipAndContinue: () => {
      setConfirmSkip(null);
      setActiveStep(STEP.PATIENT);
    },
    notice,
    closeNotice: () => setNotice(null),
    next,
    back,
    goToStep,
    nextLabel,
    nextDisabled,
  };
}

export type QuoteFlow = ReturnType<typeof useQuoteFlow>;
