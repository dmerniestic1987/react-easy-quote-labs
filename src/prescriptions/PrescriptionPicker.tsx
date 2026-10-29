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
import DeleteIcon from '@mui/icons-material/Delete';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { enhancePrescriptionImage } from '../services/prescription-image';
import ImageViewerDialog from './ImageViewerDialog';

export type PrescriptionAttachment = {
  id: number;
  /** Processed 4-bit PNG for photos, the untouched file for PDFs. */
  blob: Blob;
  filename: string;
  mimeType: string;
};

type Props = {
  variant: 'mobile' | 'desktop';
  /** Called with the accepted attachments every time they change. */
  onChange?: (attachments: PrescriptionAttachment[]) => void;
};

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
};

const ACCEPT_FILES = 'image/jpeg,image/png,application/pdf';
const MAX_FILE_BYTES = 30 * 1024 * 1024;
const MAX_PDF_BYTES = 8 * 1024 * 1024;

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

export default function PrescriptionPicker({ variant, onChange }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);
  const [viewerId, setViewerId] = useState<number | null>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);
  // Photos are processed one at a time: the work is heavy on entry-level phones.
  const queue = useRef<Promise<void>>(Promise.resolve());
  const itemsRef = useRef<Item[]>([]);

  const update = useCallback((id: number, patch: Partial<Item>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  useEffect(() => () => itemsRef.current.forEach(revoke), []);

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
        const base = { id, name: file.name || 'receta', originalSize: file.size };
        if (!kind) {
          setItems((c) => [...c, { ...base, kind: 'image', status: 'error', error: 'Formato no soportado. Usá JPG, PNG o PDF.' }]);
        } else if (file.size > (kind === 'pdf' ? MAX_PDF_BYTES : MAX_FILE_BYTES)) {
          setItems((c) => [...c, { ...base, kind, status: 'error', error: `El archivo es demasiado grande (${formatBytes(file.size)}).` }]);
        } else if (kind === 'pdf') {
          // PDFs are uploaded as they are: no review step.
          setItems((c) => [...c, { ...base, kind, status: 'accepted', processed: file }]);
        } else {
          setItems((c) => [...c, { ...base, kind, status: 'processing' }]);
          queue.current = queue.current.then(() => processImage(id, file));
        }
      });
    },
    [processImage],
  );

  const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = ''; // lets the user pick the same file again
  };

  const remove = (id: number) => {
    setItems((current) => {
      current.filter((item) => item.id === id).forEach(revoke);
      return current.filter((item) => item.id !== id);
    });
  };

  // Desktop: images copied from WhatsApp Web or an e-mail client can be pasted with Ctrl+V.
  useEffect(() => {
    if (variant !== 'desktop') return undefined;
    const onPaste = (event: ClipboardEvent) => {
      const files = Array.from(event.clipboardData?.files ?? []);
      if (files.length) {
        event.preventDefault();
        addFiles(files);
      }
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [variant, addFiles]);

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

  const busy = items.some((item) => item.status === 'processing');
  const viewer = items.find((item) => item.id === viewerId);

  return (
    <Stack spacing={2}>
      <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={handleInput} />
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

      {items.map((item) => {
        if (item.status === 'processing') return null;
        if (item.status === 'error') {
          return (
            <Alert key={item.id} severity="error" onClose={() => remove(item.id)}>
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
                <Button variant="contained" fullWidth onClick={() => update(item.id, { status: 'accepted' })}>
                  Aceptar
                </Button>
                <Button variant="outlined" fullWidth onClick={() => remove(item.id)}>
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
              <Typography variant="caption" color="text.secondary">
                {formatBytes(item.processed?.size ?? 0)}
              </Typography>
            </Box>
            <IconButton aria-label={`Quitar ${item.name}`} onClick={() => remove(item.id)}>
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
