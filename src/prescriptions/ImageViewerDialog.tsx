import * as React from 'react';
import { useRef, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  processedUrl: string;
  /** Only photos have an original to compare with. */
  originalUrl?: string;
};

const ZOOMED_WIDTH = '250%';

/** Full-size view: fits the width first, tap to zoom in, pinch also works on touch screens. */
export default function ImageViewerDialog({ open, onClose, title, processedUrl, originalUrl }: Props) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [showOriginal, setShowOriginal] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  const toggleZoom = () => {
    const el = scroller.current;
    if (!el) return;
    // Keep the point at the center of the view in the center after the size changes.
    const cx = (el.scrollLeft + el.clientWidth / 2) / el.scrollWidth;
    const cy = (el.scrollTop + el.clientHeight / 2) / el.scrollHeight;
    setZoomed((z) => !z);
    requestAnimationFrame(() => {
      el.scrollLeft = cx * el.scrollWidth - el.clientWidth / 2;
      el.scrollTop = cy * el.scrollHeight - el.clientHeight / 2;
    });
  };

  const handleClose = () => {
    setZoomed(false);
    setShowOriginal(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullScreen={fullScreen} fullWidth maxWidth="lg">
      <AppBar position="relative" color="default" elevation={0}>
        <Toolbar variant="dense" sx={{ gap: 1 }}>
          <Typography variant="subtitle2" noWrap sx={{ flex: 1 }}>
            {title} · {showOriginal ? 'Original' : 'Procesada'}
          </Typography>
          {originalUrl && (
            <Button size="small" onClick={() => setShowOriginal((v) => !v)}>
              {showOriginal ? 'Ver procesada' : 'Ver original'}
            </Button>
          )}
          <IconButton aria-label={zoomed ? 'Reducir' : 'Ampliar'} onClick={toggleZoom}>
            {zoomed ? <ZoomOutIcon /> : <ZoomInIcon />}
          </IconButton>
          <IconButton edge="end" aria-label="Cerrar" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box
        ref={scroller}
        sx={{
          flex: 1,
          overflow: 'auto',
          bgcolor: '#111',
          touchAction: 'pan-x pan-y pinch-zoom',
          minHeight: { sm: '70vh' },
          maxHeight: { sm: '85vh' },
        }}
      >
        <Box
          component="img"
          src={showOriginal && originalUrl ? originalUrl : processedUrl}
          alt={`${title} (${showOriginal ? 'original' : 'procesada'})`}
          onClick={toggleZoom}
          sx={{
            display: 'block',
            width: zoomed ? ZOOMED_WIDTH : '100%',
            maxWidth: 'none',
            height: 'auto',
            bgcolor: '#fff',
            cursor: zoomed ? 'zoom-out' : 'zoom-in',
          }}
        />
      </Box>
    </Dialog>
  );
}
