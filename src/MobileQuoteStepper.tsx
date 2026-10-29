import * as React from 'react';
import { useCallback, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MobileStepper from '@mui/material/MobileStepper';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { LabItem } from './services/lab-calculator';
import LabQuoteMobile from './LabQuoteMobile';
import PrescriptionPicker, { type PrescriptionAttachment } from './prescriptions/PrescriptionPicker';

const STEP_TITLES = [
  'Selección de estudios',
  'Adjuntar receta médica',
  'Datos del paciente',
] as const;

const STEP_COUNT = STEP_TITLES.length;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export default function MobileQuoteStepper() {
  const [activeStep, setActiveStep] = useState(0);
  const [quoteItems, setQuoteItems] = useState<LabItem[]>([]);
  const [suggestedTotalFormatted, setSuggestedTotalFormatted] = useState('');
  const [attachments, setAttachments] = useState<PrescriptionAttachment[]>([]);
  const [contact, setContact] = useState({
    fullName: '',
    email: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  const handleQuoteChange = useCallback((labs: LabItem[], totalFmt: string) => {
    setQuoteItems(labs);
    setSuggestedTotalFormatted(totalFmt);
  }, []);

  const handleNext = () => {
    setActiveStep((prev) => Math.min(prev + 1, STEP_COUNT - 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmitQuote = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSnackbar(null);
    try {
      const encodedAttachments = await Promise.all(
        attachments.map(async ({ blob, filename }) => ({ filename, dataUrl: await blobToDataUrl(blob) })),
      );
      const response = await fetch('/api/send-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: quoteItems,
          suggestedTotal: suggestedTotalFormatted,
          patient: {
            fullName: contact.fullName.trim(),
            email: contact.email.trim() || undefined,
            phone: contact.phone.trim() || undefined,
          },
          attachments: encodedAttachments,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setSnackbar({
          message: typeof data.error === 'string' ? data.error : 'No se pudo enviar la cotización',
          severity: 'error',
        });
        return;
      }
      setSnackbar({ message: 'Cotización enviada. Te contactaremos pronto.', severity: 'success' });
    } catch {
      setSnackbar({ message: 'Error de red. Probá de nuevo.', severity: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrimaryAction = () => {
    if (activeStep === STEP_COUNT - 1) {
      formRef.current?.requestSubmit();
    } else {
      handleNext();
    }
  };

  return (
    <Box
      sx={{
        px: 2,
        py: 2,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
      }}
    >
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
        {STEP_TITLES[activeStep]}
      </Typography>

      <Box sx={{ flex: '1 1 auto', pb: 2 }}>
        {activeStep === 0 && <LabQuoteMobile onQuoteChange={handleQuoteChange} />}
        {/* Always mounted: unmounting it on Back/Next would lose the photos still in review. */}
        <Box sx={{ display: activeStep === 1 ? 'block' : 'none' }}>
          <PrescriptionPicker variant="mobile" onChange={setAttachments} />
        </Box>
        {activeStep === 2 && (
          <Box component="form" ref={formRef} onSubmit={handleSubmitQuote}>
            <Stack spacing={2}>
              <TextField
                required
                label="Nombre completo"
                name="fullName"
                value={contact.fullName}
                onChange={(e) =>
                  setContact((c) => ({ ...c, fullName: e.target.value }))
                }
                fullWidth
                size="medium"
                slotProps={{ htmlInput: { autoComplete: 'name' } }}
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                value={contact.email}
                onChange={(e) =>
                  setContact((c) => ({ ...c, email: e.target.value }))
                }
                fullWidth
                slotProps={{ htmlInput: { autoComplete: 'email' } }}
              />
              <TextField
                label="Celular"
                name="phone"
                type="tel"
                value={contact.phone}
                onChange={(e) =>
                  setContact((c) => ({ ...c, phone: e.target.value }))
                }
                fullWidth
                slotProps={{ htmlInput: { autoComplete: 'tel' } }}
              />
            </Stack>
          </Box>
        )}
      </Box>

      <MobileStepper
        variant="dots"
        steps={STEP_COUNT}
        position="static"
        activeStep={activeStep}
        sx={{
          flexGrow: 0,
          width: '100%',
          bgcolor: 'background.paper',
          px: 0,
          py: 1.5,
          borderRadius: 1,
        }}
        nextButton={
          <Button
            variant="contained"
            size="large"
            onClick={handlePrimaryAction}
            disabled={activeStep === STEP_COUNT - 1 && isSubmitting}
            sx={{ py: 1.25, px: 2, whiteSpace: 'nowrap' }}
          >
            {activeStep === STEP_COUNT - 1
              ? isSubmitting
                ? 'Enviando…'
                : 'Enviar Cotización'
              : 'Continuar'}
          </Button>
        }
        backButton={
          <Button
            variant="outlined"
            size="large"
            onClick={handleBack}
            disabled={activeStep === 0 || isSubmitting}
            sx={{ py: 1.25, px: 2, whiteSpace: 'nowrap' }}
          >
            Atrás
          </Button>
        }
      />

      <Snackbar
        open={snackbar !== null}
        autoHideDuration={6000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(null)}
          severity={snackbar?.severity ?? 'success'}
          sx={{ width: '100%' }}
        >
          {snackbar?.message ?? ''}
        </Alert>
      </Snackbar>
    </Box>
  );
}
