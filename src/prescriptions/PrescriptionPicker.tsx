import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { ApiError } from '../api/client';
import { describeError, type UserFacingError } from '../api/errors';
import { deleteOrderFile, uploadPrescription, type UploadedFile } from '../api/orders';
import { enhancePrescriptionImage } from '../services/prescription-image';
import ImageViewerDialog from './ImageViewerDialog';

export type PrescriptionAttachment = {
  id: number;
  /** Processed 4-bit PNG for photos, the untouched file for PDFs. */
  blob: Blob;
  filename: string;
  mimeType: string;
};

/** Photos still being processed or waiting for the user's approval are `pending`. */
export type UploadSummary = { uploading: number; failed: number; uploaded: number; pending: number };

type Props = {
  variant: 'mobile' | 'desktop';
  /** Desktop listens for Ctrl+V only while this is true, so pasting in another step does not add files here. */
  active?: boolean;
  /** Called with the accepted attachments every time they change. */
  onChange?: (attachments: PrescriptionAttachment[]) => void;
  /** When set, every accepted file is uploaded to this quote right away. */
  orderId?: number;
  /** Files the server already has for the quote (for instance after a page reload). */
  existingFiles?: UploadedFile[];
  onUploadSummaryChange?: (summary: UploadSummary) => void;
  /** Used for errors that have no place in the list, such as a failed delete. */
  onError?: (error: UserFacingError) => void;
};

type Upload = 'none' | 'uploading' | 'uploaded' | 'failed';

type Item = {
  id: number;
  name: string;
  kind: 'image' | 'pdf';
  originalSize: number;
  status: 'processing' | 'review' | 'accepted' | 'error';
  error?: string;
  originalUrl?: string;
  processed?: Blob;
  processedUrl?: string;
  thumbUrl?: string;
  upload: Upload;
  uploadError?: string;
  /** Id of the file on the server once uploaded. */
  remoteId?: string;
  removing?: boolean;
};

const ACCEPT_FILES = 'image/jpeg,image/png,application/pdf';
const MAX_FILE_BYTES = 30 * 1024 * 1024;
const MAX_PDF_BYTES = 8 * 1024 * 1024;
const RETRY_DELAY_MS = 1500;
const TRANSIENT_STATUSES = new Set([0, 502, 503, 504]);

function detectKind(file: File): Item['kind'] | null {
  if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) return 'pdf';
  if (file.type === 'image/jpeg' || file.type === 'image/png' || /\.(jpe?g|png)$/i.test(file.name)) return 'image';
  return null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function pngName(name: string): string {
  return `${name.replace(/\.[^.]+$/, '') || 'receta'}.png`;
}

function revoke(item: Item): void {
  if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
  if (item.processedUrl) URL.revokeObjectURL(item.processedUrl);
  if (item.thumbUrl) URL.revokeObjectURL(item.thumbUrl);
}

/** One more try after a short pause for network failures and gateway errors: the connection can be flaky. */
async function uploadWithRetry(orderId: number, blob: Blob, filename: string): Promise<UploadedFile> {
  try {
    return await uploadPrescription(orderId, blob, filename);
  } catch (e) {
    if (!(e instanceof ApiError) || !TRANSIENT_STATUSES.has(e.status)) throw e;
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return uploadPrescription(orderId, blob, filename);
  }
}

export default function PrescriptionPicker({
  variant,
  active = true,
  onChange,
  orderId,
  existingFiles,
  onUploadSummaryChange,
  onError,
}: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);
  const [viewerId, setViewerId] = useState<number | null>(null);
  // Files that exist on the server but not in this list (a page reload lost it), and the ones deleted since.
  const [deletedRemote, setDeletedRemote] = useState<Set<string>>(new Set());
  const [removingRemote, setRemovingRemote] = useState<string | null>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);
  // Photos are processed one at a time, and uploaded one at a time: the work is heavy on entry-level phones and
  // the connection can be slow.
  const queue = useRef<Promise<void>>(Promise.resolve());
  const uploadQueue = useRef<Promise<void>>(Promise.resolve());
  const itemsRef = useRef<Item[]>([]);
  const orderIdRef = useRef(orderId);

  useEffect(() => {
    orderIdRef.current = orderId;
  }, [orderId]);

  const update = useCallback((id: number, patch: Partial<Item>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  useEffect(() => () => itemsRef.current.forEach(revoke), []);

  const doUpload = useCallback(
    async (id: number) => {
      const item = itemsRef.current.find((candidate) => candidate.id === id);
      const targetOrder = orderIdRef.current;
      if (!item?.processed || targetOrder === undefined) return;
      try {
        const filename = item.kind === 'pdf' ? item.name : pngName(item.name);
        const uploaded = await uploadWithRetry(targetOrder, item.processed, filename);
        update(id, { upload: 'uploaded', remoteId: uploaded.id, uploadError: undefined });
      } catch (e) {
        const { message } = describeError(e, `subir ${item.name}`);
        update(id, { upload: 'failed', uploadError: message });
      }
    },
    [update],
  );

  const enqueueUpload = useCallback(
    (id: number) => {
      if (orderIdRef.current === undefined) return;
      update(id, { upload: 'uploading', uploadError: undefined });
      uploadQueue.current = uploadQueue.current.then(() => doUpload(id));
    },
    [update, doUpload],
  );

  const processImage = useCallback(
    async (id: number, file: File) => {
      try {
        const { blob, thumbnail } = await enhancePrescriptionImage(file);
        update(id, {
          status: 'review',
          processed: blob,
          processedUrl: URL.createObjectURL(blob),
          thumbUrl: URL.createObjectURL(thumbnail),
          originalUrl: URL.createObjectURL(file),
        });
      } catch (e) {
        update(id, {
          status: 'error',
          error: e instanceof Error ? e.message : 'No se pudo procesar la imagen',
        });
      }
    },
    [update],
  );

  const addFiles = useCallback(
    (files: File[]) => {
      files.forEach((file) => {
        const id = nextId.current++;
        const kind = detectKind(file);
        const base = { id, name: file.name || 'receta', originalSize: file.size, upload: 'none' as Upload };
        if (!kind) {
          setItems((c) => [...c, { ...base, kind: 'image', status: 'error', error: 'Formato no soportado. Usá JPG, PNG o PDF.' }]);
        } else if (file.size > (kind === 'pdf' ? MAX_PDF_BYTES : MAX_FILE_BYTES)) {
          setItems((c) => [...c, { ...base, kind, status: 'error', error: `El archivo es demasiado grande (${formatBytes(file.size)}).` }]);
        } else if (kind === 'pdf') {
          // PDFs are uploaded as they are: no review step.
          setItems((c) => [...c, { ...base, kind, status: 'accepted', processed: file }]);
          itemsRef.current = [...itemsRef.current, { ...base, kind, status: 'accepted', processed: file }];
          enqueueUpload(id);
        } else {
          setItems((c) => [...c, { ...base, kind, status: 'processing' }]);
          queue.current = queue.current.then(() => processImage(id, file));
        }
      });
    },
    [processImage, enqueueUpload],
  );

  const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = ''; // lets the user pick the same file again
  };

  const accept = (id: number) => {
    update(id, { status: 'accepted' });
    enqueueUpload(id);
  };

  const discard = (id: number) => {
    setItems((current) => {
      current.filter((item) => item.id === id).forEach(revoke);
      return current.filter((item) => item.id !== id);
    });
  };

  /** Removes a file; one already on the server is deleted there first. */
  const remove = async (item: Item) => {
    if (!item.remoteId || orderId === undefined) {
      discard(item.id);
      return;
    }
    update(item.id, { removing: true });
    try {
      await deleteOrderFile(orderId, item.remoteId);
      discard(item.id);
    } catch (e) {
      update(item.id, { removing: false });
      onError?.(describeError(e, `quitar ${item.name}`));
    }
  };

  const removeRemote = async (file: UploadedFile) => {
    if (orderId === undefined) return;
    setRemovingRemote(file.id);
    try {
      await deleteOrderFile(orderId, file.id);
      setDeletedRemote((current) => new Set(current).add(file.id));
    } catch (e) {
      onError?.(describeError(e, `quitar ${file.originalName}`));
    } finally {
      setRemovingRemote(null);
    }
  };

  // Desktop: images copied from WhatsApp Web or an e-mail client can be pasted with Ctrl+V.
  useEffect(() => {
    if (variant !== 'desktop' || !active) return undefined;
    const onPaste = (event: ClipboardEvent) => {
      const files = Array.from(event.clipboardData?.files ?? []);
      if (files.length) {
        event.preventDefault();
        addFiles(files);
      }
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [variant, active, addFiles]);

  const accepted = useMemo<PrescriptionAttachment[]>(
    () =>
      items
        .filter((item) => item.status === 'accepted' && item.processed)
        .map((item) => ({
          id: item.id,
          blob: item.processed as Blob,
          filename: item.kind === 'pdf' ? item.name : pngName(item.name),
          mimeType: item.kind === 'pdf' ? 'application/pdf' : 'image/png',
        })),
    [items],
  );
  useEffect(() => {
    onChange?.(accepted);
  }, [accepted, onChange]);

  // Files the server has that this list does not show yet.
  const remoteOnly = useMemo(
    () =>
      (existingFiles ?? []).filter(
        (file) => !deletedRemote.has(file.id) && !items.some((item) => item.remoteId === file.id),
      ),
    [existingFiles, deletedRemote, items],
  );

  const uploading = items.filter((item) => item.upload === 'uploading').length;
  const failed = items.filter((item) => item.upload === 'failed').length;
  const uploadedCount = items.filter((item) => item.upload === 'uploaded').length + remoteOnly.length;
  const pending = items.filter((item) => item.status === 'processing' || item.status === 'review').length;
  useEffect(() => {
    onUploadSummaryChange?.({ uploading, failed, uploaded: uploadedCount, pending });
  }, [uploading, failed, uploadedCount, pending, onUploadSummaryChange]);

  const busy = items.some((item) => item.status === 'processing');
  const viewer = items.find((item) => item.id === viewerId);

  return (
    <Stack spacing={2}>
      {variant === 'mobile' && (
        <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={handleInput} />
      )}
      <input ref={fileInput} type="file" accept={ACCEPT_FILES} multiple hidden onChange={handleInput} />

      {variant === 'mobile' ? (
        <Stack spacing={1.5}>
          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={<PhotoCameraIcon />}
            sx={{ py: 1.75, minHeight: 52 }}
            onClick={() => cameraInput.current?.click()}
          >
            Sacar foto
          </Button>
          <Button
            variant="outlined"
            size="large"
            fullWidth
            startIcon={<PhotoLibraryIcon />}
            sx={{ py: 1.75, minHeight: 52 }}
            onClick={() => fileInput.current?.click()}
          >
            Elegir de galería o archivos
          </Button>
        </Stack>
      ) : (
        <Paper
          variant="outlined"
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(Array.from(e.dataTransfer.files));
          }}
          sx={{
            p: 3,
            textAlign: 'center',
            borderStyle: 'dashed',
            borderWidth: 2,
            borderColor: dragging ? 'primary.main' : 'divider',
            bgcolor: dragging ? 'action.hover' : 'transparent',
          }}
        >
          <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
            <UploadFileIcon color="action" fontSize="large" />
            <Typography variant="body1">Arrastrá acá las órdenes médicas (JPG, PNG o PDF)</Typography>
            <Typography variant="body2" color="text.secondary">
              También podés pegar una imagen con Ctrl+V
            </Typography>
            <Button variant="contained" onClick={() => fileInput.current?.click()}>
              Elegir archivo
            </Button>
          </Stack>
        </Paper>
      )}

      {busy && (
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            Procesando imagen…
          </Typography>
        </Stack>
      )}

      {remoteOnly.map((file) => (
        <Paper key={file.id} variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {file.mimeType === 'application/pdf' ? (
            <PictureAsPdfIcon color="error" sx={{ fontSize: 40 }} />
          ) : (
            <ImageIcon color="action" sx={{ fontSize: 40 }} />
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap>
              {file.originalName}
            </Typography>
            <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CheckCircleIcon sx={{ fontSize: 14 }} /> Subido
              {file.sizeBytes ? ` · ${formatBytes(file.sizeBytes)}` : ''}
            </Typography>
          </Box>
          <IconButton
            aria-label={`Quitar ${file.originalName}`}
            disabled={removingRemote === file.id}
            onClick={() => removeRemote(file)}
          >
            <DeleteIcon />
          </IconButton>
        </Paper>
      ))}

      {items.map((item) => {
        if (item.status === 'processing') return null;
        if (item.status === 'error') {
          return (
            <Alert key={item.id} severity="error" onClose={() => discard(item.id)}>
              {item.name}: {item.error}
            </Alert>
          );
        }
        if (item.status === 'review') {
          return (
            <Paper key={item.id} variant="outlined" sx={{ p: 1.5, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <ButtonBase
                aria-label={`Ampliar vista previa de ${item.name}`}
                onClick={() => setViewerId(item.id)}
                sx={{ flexShrink: 0, width: 120, height: 168, bgcolor: '#fff', borderRadius: 1, border: 1, borderColor: 'divider', overflow: 'hidden' }}
              >
                <Box component="img" src={item.thumbUrl} alt="" sx={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
              </ButtonBase>
              <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                  {item.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatBytes(item.originalSize)} → {formatBytes(item.processed?.size ?? 0)} (escala de grises)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Tocá la miniatura para verla más grande.
                </Typography>
                <Button variant="contained" fullWidth onClick={() => accept(item.id)}>
                  Aceptar
                </Button>
                <Button variant="outlined" fullWidth onClick={() => discard(item.id)}>
                  Descartar
                </Button>
              </Stack>
            </Paper>
          );
        }
        return (
          <Paper key={item.id} variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {item.kind === 'pdf' ? (
              <PictureAsPdfIcon color="error" sx={{ fontSize: 40 }} />
            ) : (
              <ButtonBase
                aria-label={`Ampliar ${item.name}`}
                onClick={() => setViewerId(item.id)}
                sx={{ width: 40, height: 56, flexShrink: 0, bgcolor: '#fff', borderRadius: 0.5, overflow: 'hidden' }}
              >
                <Box component="img" src={item.thumbUrl} alt="" sx={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
              </ButtonBase>
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" noWrap>
                {item.kind === 'pdf' ? item.name : pngName(item.name)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {formatBytes(item.processed?.size ?? 0)}
                {item.upload === 'uploading' && (
                  <>
                    {' · '}
                    <CircularProgress size={12} /> Subiendo…
                  </>
                )}
                {item.upload === 'uploaded' && (
                  <Box component="span" sx={{ color: 'success.main', display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    {' · '}
                    <CheckCircleIcon sx={{ fontSize: 14 }} /> Subido
                  </Box>
                )}
              </Typography>
              {item.upload === 'failed' && (
                <Typography variant="caption" color="error">
                  No se pudo subir: {item.uploadError}
                </Typography>
              )}
            </Box>
            {item.upload === 'failed' && (
              <Button size="small" onClick={() => enqueueUpload(item.id)}>
                Reintentar
              </Button>
            )}
            <IconButton
              aria-label={`Quitar ${item.name}`}
              disabled={item.upload === 'uploading' || item.removing}
              onClick={() => remove(item)}
            >
              <DeleteIcon />
            </IconButton>
          </Paper>
        );
      })}
      {viewer && viewer.processedUrl && (
        <ImageViewerDialog
          open
          onClose={() => setViewerId(null)}
          title={viewer.name}
          processedUrl={viewer.processedUrl}
          originalUrl={viewer.originalUrl}
        />
      )}
    </Stack>
  );
}
