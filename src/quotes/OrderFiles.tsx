import * as React from 'react';
import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { describeError, describeErrorInline, logError } from '../api/errors';
import { listOrderFiles, type UploadedFile } from '../api/orders';
import ImageViewerDialog from '../prescriptions/ImageViewerDialog';
import { getFileBlob } from '../services/file-cache';
import { formatQuoteDate } from '../services/quote-image';

const GROUPS: { type: NonNullable<UploadedFile['fileType']>; title: string }[] = [
  { type: 'prescription', title: 'Recetas' },
  { type: 'result', title: 'Resultados' },
  { type: 'other', title: 'Otros archivos' },
];

function formatBytes(bytes?: number): string {
  if (bytes === undefined) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type ThumbState = { key: string; url?: string; failed?: boolean };

/** Loads one image on its own: a failure here does not affect the other files. */
function ImageFile({ orderId, file }: { orderId: number; file: UploadedFile }) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<ThumbState | null>(null);
  const [open, setOpen] = useState(false);
  const key = `${file.id}:${attempt}`;

  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;
    getFileBlob(orderId, file.id)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setState({ key, url });
      })
      .catch((e) => {
        logError(`No se pudo cargar el archivo ${file.originalName}`, e);
        if (!cancelled) setState({ key, failed: true });
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [orderId, file.id, file.originalName, key]);

  const current = state?.key === key ? state : null;
  return (
    <Paper variant="outlined" sx={{ width: 168, p: 1 }}>
      <ButtonBase
        disabled={!current?.url}
        onClick={() => setOpen(true)}
        aria-label={`Ampliar ${file.originalName}`}
        sx={{ width: '100%', height: 200, bgcolor: '#fff', borderRadius: 0.5, overflow: 'hidden', display: 'grid', placeItems: 'center' }}
      >
        {current?.url && (
          <Box component="img" src={current.url} alt={file.originalName} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        )}
        {!current && <CircularProgress size={28} aria-label={`Cargando ${file.originalName}`} />}
        {current?.failed && <BrokenImageIcon color="disabled" sx={{ fontSize: 48 }} />}
      </ButtonBase>
      {current?.failed && (
        <Button size="small" fullWidth onClick={() => setAttempt((n) => n + 1)}>
          No se pudo cargar. Reintentar
        </Button>
      )}
      <Typography variant="caption" noWrap sx={{ display: 'block', mt: 0.5 }} title={file.originalName}>
        {file.originalName}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {formatBytes(file.sizeBytes)}
      </Typography>
      {open && current?.url && (
        <ImageViewerDialog open onClose={() => setOpen(false)} title={file.originalName} processedUrl={current.url} />
      )}
    </Paper>
  );
}

function PdfFile({ orderId, file }: { orderId: number; file: UploadedFile }) {
  const [opening, setOpening] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const open = async () => {
    setOpening(true);
    setProblem(null);
    // The tab has to open inside the click, before the download, or the browser blocks it as a pop-up.
    const tab = window.open('', '_blank');
    try {
      const blob = await getFileBlob(orderId, file.id);
      const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      if (tab) tab.location.href = url;
      else window.location.assign(url);
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      tab?.close();
      setProblem(describeError(e, `abrir ${file.originalName}`).message);
    } finally {
      setOpening(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <PictureAsPdfIcon color="error" sx={{ fontSize: 40 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" noWrap>
          {file.originalName}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatBytes(file.sizeBytes)}
        </Typography>
        {problem && (
          <Typography variant="caption" color="error" sx={{ display: 'block' }}>
            {problem}
          </Typography>
        )}
      </Box>
      <Button size="small" variant="outlined" onClick={open} disabled={opening}>
        {opening ? 'Abriendo…' : 'Abrir'}
      </Button>
    </Paper>
  );
}

type ListState = { key: string; files?: UploadedFile[]; error?: string };

/**
 * Looks for the files saved for the quote as soon as the detail opens. It is best effort: if it fails, the rest
 * of the detail is still there and this section offers to try again.
 */
export default function OrderFiles({ orderId }: { orderId: number }) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<ListState | null>(null);
  const key = `${orderId}:${attempt}`;

  useEffect(() => {
    let cancelled = false;
    listOrderFiles(orderId)
      .then((files) => {
        if (!cancelled) setState({ key, files });
      })
      .catch((e) => {
        if (!cancelled) setState({ key, error: describeErrorInline(e, 'buscar los archivos de la cotización') });
      });
    return () => {
      cancelled = true;
    };
  }, [orderId, key]);

  const current = state?.key === key ? state : null;

  return (
    <Box component="section" aria-label="Archivos adjuntos">
      <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
        Archivos adjuntos
      </Typography>
      {!current && (
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            Buscando archivos…
          </Typography>
        </Stack>
      )}
      {current?.error && (
        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small" onClick={() => setAttempt((n) => n + 1)}>
              Reintentar
            </Button>
          }
        >
          {current.error}
        </Alert>
      )}
      {current?.files && current.files.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          Esta cotización no tiene archivos adjuntos.
        </Typography>
      )}
      {current?.files && current.files.length > 0 && (
        <Stack spacing={3}>
          {GROUPS.map(({ type, title }) => {
            const group = current.files?.filter((file) => (file.fileType ?? 'other') === type) ?? [];
            if (group.length === 0) return null;
            const images = group.filter((file) => file.mimeType?.startsWith('image/'));
            const others = group.filter((file) => !file.mimeType?.startsWith('image/'));
            return (
              <Box key={type}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  {title} ({group.length})
                  {group[0].createdAt ? ` · ${formatQuoteDate(group[0].createdAt)}` : ''}
                </Typography>
                {images.length > 0 && (
                  <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 1.5, mb: others.length ? 1.5 : 0 }}>
                    {images.map((file) => (
                      <ImageFile key={file.id} orderId={orderId} file={file} />
                    ))}
                  </Stack>
                )}
                <Stack spacing={1}>
                  {others.map((file) =>
                    file.mimeType === 'application/pdf' ? (
                      <PdfFile key={file.id} orderId={orderId} file={file} />
                    ) : (
                      <Paper key={file.id} variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <DescriptionIcon color="action" sx={{ fontSize: 40 }} />
                        <Typography variant="body2" noWrap>
                          {file.originalName}
                        </Typography>
                      </Paper>
                    ),
                  )}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
