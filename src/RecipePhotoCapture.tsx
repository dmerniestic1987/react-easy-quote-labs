import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Webcam from 'react-webcam';
import { processRecipeImageDataUrl } from './services/recipe-photo-process';

export type RecipePhotoCaptureProps = {
  onAccept?: (processedDataUrl: string, originalDataUrl: string | null) => void;
};

function describeUserMediaError(err: string | DOMException): string {
  const name = typeof err === 'string' ? '' : err instanceof DOMException ? err.name : '';
  const msg = typeof err === 'string' ? err : err instanceof DOMException ? err.message : '';

  if (
    name === 'NotAllowedError' ||
    name === 'PermissionDeniedError' ||
    /not allowed|permission denied|permiso|denegad/i.test(msg)
  ) {
    return 'El navegador bloqueó la cámara. Permití el acceso en la configuración del sitio (icono del candado o de la barra de direcciones → Cámara) y volvé a intentar.';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || /no camera|no device|not found/i.test(msg)) {
    return 'No se detectó ninguna cámara en este dispositivo.';
  }
  if (
    name === 'NotReadableError' ||
    name === 'TrackStartError' ||
    /could not start|in use|not readable/i.test(msg)
  ) {
    return 'La cámara no está disponible (quizá otra aplicación la está usando). Cerrala y probá de nuevo.';
  }
  if (name === 'SecurityError' || name === 'NotSupportedError' || /secure context|insecure/i.test(msg)) {
    return 'La cámara solo funciona en una conexión segura (HTTPS o localhost). Si abrís el sitio desde el celular con una IP tipo http://192.168…, el navegador la bloquea; usá HTTPS o un túnel (por ejemplo ngrok).';
  }
  if (msg && !/^not allowed$/i.test(msg.trim())) {
    return msg;
  }
  return 'No se pudo acceder a la cámara. Revisá permisos del navegador y que el sitio use HTTPS si estás en el móvil.';
}

export default function RecipePhotoCapture({ onAccept }: RecipePhotoCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [mounted, setMounted] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [originalDataUrl, setOriginalDataUrl] = useState<string | null>(null);
  const [processedDataUrl, setProcessedDataUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  /** Algunos móviles fallan con resolución ideal alta; se rebaja solo a facingMode. */
  const [constraintMode, setConstraintMode] = useState<'full' | 'minimal'>('full');
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedHint, setSavedHint] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const videoConstraints: MediaTrackConstraints =
    constraintMode === 'full'
      ? { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } }
      : { facingMode };

  const resetCaptureState = useCallback(() => {
    setOriginalDataUrl(null);
    setProcessedDataUrl(null);
    setSavedHint(false);
  }, []);

  const handleOpenCamera = () => {
    setCameraError(null);
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      const devTip =
        process.env.NODE_ENV === 'development'
          ? ' Para probar desde el celular en tu Wi‑Fi: pará el servidor, ejecutá npm run dev:https en esta carpeta, entrá con https:// y la IP de tu PC y el puerto (ej. https://192.168.0.5:3000) y aceptá la advertencia del certificado en el navegador del teléfono.'
          : ' En producción el sitio tiene que servirse con HTTPS (TLS).';
      setCameraError(
        'Los navegadores solo permiten la cámara en contexto seguro (HTTPS o localhost). Con http:// y una IP de red local desde el celular no está permitido.' +
          devTip,
      );
      return;
    }
    if (typeof navigator !== 'undefined' && !navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        'Este navegador no expone la cámara (o falta permiso del sistema). Probá con Chrome o Safari actualizado.',
      );
      return;
    }
    setConstraintMode('full');
    setFacingMode('environment');
    setCameraOpen(true);
    resetCaptureState();
  };

  const handleCloseCamera = () => {
    setCameraOpen(false);
    setCameraError(null);
  };

  const handleCapture = async () => {
    const raw = webcamRef.current?.getScreenshot();
    if (!raw) {
      setCameraError('No se pudo capturar la imagen. Probá de nuevo.');
      return;
    }
    setCameraOpen(false);
    setOriginalDataUrl(raw);
    setIsProcessing(true);
    setCameraError(null);
    try {
      const processed = await processRecipeImageDataUrl(raw);
      setProcessedDataUrl(processed);
    } catch {
      setCameraError('No se pudo procesar la imagen.');
      setOriginalDataUrl(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    resetCaptureState();
    setCameraError(null);
    setCameraOpen(true);
  };

  const handleAccept = () => {
    if (processedDataUrl) {
      onAccept?.(processedDataUrl, originalDataUrl);
    }
    resetCaptureState();
    handleCloseCamera();
    setSavedHint(true);
  };

  const handleUserMediaError = (err: string | DOMException) => {
    if (facingMode === 'environment' && constraintMode === 'full') {
      setFacingMode('user');
      setCameraError(null);
      return;
    }
    if (facingMode === 'user' && constraintMode === 'full') {
      setConstraintMode('minimal');
      setFacingMode('environment');
      setCameraError(null);
      return;
    }
    if (facingMode === 'environment' && constraintMode === 'minimal') {
      setFacingMode('user');
      setCameraError(null);
      return;
    }
    setCameraError(describeUserMediaError(err));
    setCameraOpen(false);
  };

  const showIdleIntro = !cameraOpen && !processedDataUrl && !isProcessing;
  const showPreview = Boolean(processedDataUrl);

  return (
    <Stack spacing={2}>
      <Typography variant="body1" color="text.secondary">
        Si tenés una receta o los estudios solicitados por tu médico, podés adjuntar una foto clara.
        Este paso es opcional por ahora.
      </Typography>

      {savedHint && (
        <Typography variant="body2" color="success.main">
          Foto guardada. Podés sacar otra si lo necesitás.
        </Typography>
      )}

      {cameraError && (
        <Typography variant="body2" color="error">
          {cameraError}
        </Typography>
      )}

      {isProcessing && (
        <Typography variant="body2" color="text.secondary">
          Procesando imagen…
        </Typography>
      )}

      {showIdleIntro && (
        <Button
          variant="outlined"
          size="large"
          fullWidth
          sx={{ py: 1.75, minHeight: 52 }}
          onClick={handleOpenCamera}
          disabled={!mounted}
        >
          Sacar Foto 📸
        </Button>
      )}

      {mounted && cameraOpen && (
        <Stack spacing={2}>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              borderRadius: 1,
              overflow: 'hidden',
              bgcolor: 'grey.900',
              lineHeight: 0,
            }}
          >
            <Webcam
              key={`${constraintMode}-${facingMode}`}
              ref={webcamRef}
              audio={false}
              mirrored={false}
              screenshotFormat="image/png"
              forceScreenshotSourceSize
              videoConstraints={videoConstraints}
              onUserMedia={() => setCameraError(null)}
              onUserMediaError={handleUserMediaError}
              style={{ width: '75%', height: 'auto', display: 'block', margin: '0 auto' }}
            />
          </Box>
          <Button variant="contained" size="large" fullWidth onClick={handleCapture}>
            Capturar
          </Button>
          <Button variant="text" size="medium" fullWidth onClick={handleCloseCamera}>
            Cancelar
          </Button>
        </Stack>
      )}

      {showPreview && processedDataUrl && (
        <Stack spacing={2}>
          <Typography variant="subtitle2" color="text.secondary">
            Vista previa (alto contraste)
          </Typography>
          <Box
            component="img"
            src={processedDataUrl}
            alt="Vista previa de la receta procesada"
            sx={{
              width: '80%',
              height: 'auto',
              display: 'block',
              margin: '0 auto',
              borderRadius: 1,
              border: 1,
              borderColor: 'divider',
            }}
          />
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" size="medium" fullWidth onClick={handleRetake}>
              Volver a tomar
            </Button>
            <Button variant="contained" size="medium" fullWidth onClick={handleAccept}>
              Aceptar
            </Button>
          </Stack>
        </Stack>
      )}
    </Stack>
  );
}
