import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';
import { describeError } from '../api/errors';
import { getOrder } from '../api/orders';
import { QUOTE_TITLE, renderQuoteImage } from '../services/quote-image';
import { canCopyImage, canShareFiles, copyImage, shareImage } from '../services/share-image';
import { roboto } from '../theme';

type Props = {
  orderId: number;
  /** Price quoted to the patient: the one the interface calculated (a multiple of 100). */
  total: number;
  /** Mobile shares with the system sheet; desktop has no share button and copies the image instead. */
  mode?: 'share' | 'copy';
};

/**
 * Last step: the quote with its number and date from the server and the price calculated by the interface. The same image shown here is the one that gets shared, so what the
 * secretary sees is exactly what the patient receives.
 */
export default function QuoteSummary({ orderId, total, mode = 'share' }: Props) {
  const [image, setImage] = useState<{ blob: Blob; url: string; number: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;
    (async () => {
      try {
        const order = await getOrder(orderId);
        const blob = await renderQuoteImage(
          {
            number: order.id,
            createdAt: order.createdAt,
            items: order.items.map(({ code, name, itemCount }) => ({ code, name, itemCount })),
            total,
          },
          roboto.style.fontFamily,
        );
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setImage({ blob, url, number: order.id });
        setError(null);
      } catch (e) {
        if (!cancelled) setError(describeError(e, 'cargar el resumen').message);
      }
    })();
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [orderId, total, attempt]);

  const act = useCallback(async () => {
    if (!image) return;
    const filename = `cotizacion-${image.number}.png`;
    try {
      if (mode === 'copy') {
        const result = await copyImage(image.blob, filename);
        setNotice(
          result === 'copied'
            ? 'Imagen copiada. Pegala con Ctrl+V en WhatsApp Web o en un mail.'
            : 'No se pudo copiar en este navegador: se descargó la imagen.',
        );
      } else {
        const result = await shareImage(image.blob, filename, QUOTE_TITLE);
        setNotice(result === 'downloaded' ? 'La imagen se descargó. Podés enviarla desde tu galería.' : null);
      }
    } catch (e) {
      setNotice(describeError(e, mode === 'copy' ? 'copiar la cotización' : 'compartir la cotización').message);
    }
  }, [image, mode]);

  if (error) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">{error}</Alert>
        <Button variant="outlined" onClick={() => setAttempt((n) => n + 1)}>
          Reintentar
        </Button>
      </Stack>
    );
  }
  if (!image) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress aria-label="Cargando resumen" />
      </Box>
    );
  }
  return (
    <Stack spacing={2}>
      <Box
        component="img"
        src={image.url}
        alt={`Cotización ${image.number}`}
        sx={{ width: '100%', height: 'auto', display: 'block', borderRadius: 1, border: 1, borderColor: 'divider', bgcolor: '#fff' }}
      />
      <Button
        variant="contained"
        size="large"
        fullWidth
        startIcon={mode === 'copy' ? <ContentCopyIcon /> : <ShareIcon />}
        onClick={act}
        sx={{ py: 1.5 }}
      >
        {mode === 'copy' ? 'Copiar imagen' : 'Compartir'}
      </Button>
      {mode === 'share' && !canShareFiles() && (
        <Typography variant="caption" color="text.secondary">
          Este navegador no puede abrir WhatsApp o Instagram directamente: el botón descarga la imagen. Compartir
          requiere una conexión segura (HTTPS).
        </Typography>
      )}
      {mode === 'copy' && !canCopyImage() && (
        <Typography variant="caption" color="text.secondary">
          Copiar requiere HTTPS o localhost: en este navegador el botón descarga la imagen.
        </Typography>
      )}
      {notice && <Alert severity="info">{notice}</Alert>}
    </Stack>
  );
}
