import * as React from 'react';
import { useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MobileStepper from '@mui/material/MobileStepper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LabQuoteMobile from './LabQuoteMobile';

const STEP_TITLES = [
  'Selección de estudios',
  'Adjuntar receta médica',
  'Datos del paciente',
] as const;

const STEP_COUNT = STEP_TITLES.length;

function RecipePhotoCapture() {
  return (
    <Stack spacing={2}>
      <Typography variant="body1" color="text.secondary">
        Si tenés una receta o los estudios solicitados por tu médico, podés adjuntar una foto clara. Este paso es opcional por ahora.
      </Typography>
      <Button
        variant="outlined"
        size="large"
        fullWidth
        sx={{ py: 1.75, minHeight: 52 }}
        onClick={() => console.log('Sacar foto — pendiente de integración con cámara')}
      >
        Sacar Foto 📸
      </Button>
    </Stack>
  );
}

export default function MobileQuoteStepper() {
  const [activeStep, setActiveStep] = useState(0);
  const [contact, setContact] = useState({
    fullName: '',
    email: '',
    phone: '',
  });
  const formRef = useRef<HTMLFormElement>(null);

  const handleNext = () => {
    setActiveStep((prev) => Math.min(prev + 1, STEP_COUNT - 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmitQuote = (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Cotización — datos de contacto:', contact);
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
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
        {STEP_TITLES[activeStep]}
      </Typography>

      <Box sx={{ flex: '1 1 auto', pb: 2 }}>
        {activeStep === 0 && <LabQuoteMobile />}
        {activeStep === 1 && <RecipePhotoCapture />}
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
                inputProps={{ autoComplete: 'name' }}
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
                inputProps={{ autoComplete: 'email' }}
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
                inputProps={{ autoComplete: 'tel' }}
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
            sx={{ py: 1.25, px: 2, whiteSpace: 'nowrap' }}
          >
            {activeStep === STEP_COUNT - 1 ? 'Enviar Cotización' : 'Continuar'}
          </Button>
        }
        backButton={
          <Button
            variant="outlined"
            size="large"
            onClick={handleBack}
            disabled={activeStep === 0}
            sx={{ py: 1.25, px: 2, whiteSpace: 'nowrap' }}
          >
            Atrás
          </Button>
        }
      />
    </Box>
  );
}
