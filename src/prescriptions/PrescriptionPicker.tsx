import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
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
  showOriginal: boolean;
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
}

export default function PrescriptionPicker({ variant, onChange }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);
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
        const { blob } = await enhancePrescriptionImage(file);
        update(id, {
          status: 'review',
          processed: blob,
          processedUrl: URL.createObjectURL(blob),
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
        const base = { id, name: file.name || 'receta', originalSize: file.size, showOriginal: false };
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
          const shown = item.showOriginal ? item.originalUrl : item.processedUrl;
          return (
            <Stack key={item.id} spacing={1.5}>
              <Typography variant="subtitle2" color="text.secondary">
                {item.name} · {item.showOriginal ? 'Original' : 'Vista previa (escala de grises)'}
              </Typography>
              <Box
                component="img"
                src={shown}
                alt={item.showOriginal ? 'Foto original de la orden' : 'Vista previa de la orden procesada'}
                sx={{
                  width: '100%',
                  maxWidth: 720,
                  alignSelf: 'center',
                  height: 'auto',
                  display: 'block',
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'divider',
                  bgcolor: '#fff',
                }}
              />
              <Typography variant="caption" color="text.secondary">
                Original {formatBytes(item.originalSize)} → procesada {formatBytes(item.processed?.size ?? 0)}
              </Typography>
              <Button size="small" onClick={() => update(item.id, { showOriginal: !item.showOriginal })}>
                {item.showOriginal ? 'Ver procesada' : 'Ver original'}
              </Button>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" size="large" fullWidth onClick={() => remove(item.id)}>
                  Descartar
                </Button>
                <Button variant="contained" size="large" fullWidth onClick={() => update(item.id, { status: 'accepted' })}>
                  Aceptar
                </Button>
              </Stack>
            </Stack>
          );
        }
        return (
          <Paper key={item.id} variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {item.kind === 'pdf' ? (
              <PictureAsPdfIcon color="error" sx={{ fontSize: 40 }} />
            ) : (
              <Box
                component="img"
                src={item.processedUrl}
                alt=""
                sx={{ width: 40, height: 56, objectFit: 'cover', borderRadius: 0.5, bgcolor: '#fff' }}
              />
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
    </Stack>
  );
}
