import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Step from '@mui/material/Step';
import StepButton from '@mui/material/StepButton';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Typography from '@mui/material/Typography';
import LabHeader from './LabHeader';
import LabTableDesktop from './LabTableDesktop';
import PatientStep from './patients/PatientStep';
import PrescriptionPicker from './prescriptions/PrescriptionPicker';
import QuoteFlowDialogs from './quote/QuoteFlowDialogs';
import { STEP, useQuoteFlow } from './quote/useQuoteFlow';
import SelectedStudies from './SelectedStudies';
import QuoteSummary from './summary/QuoteSummary';
import TotalQuote from './TotalQuote';

const STEPS = [
  { label: 'Estudios', optional: false },
  { label: 'Recetas', optional: true },
  { label: 'Paciente', optional: true },
  { label: 'Resumen', optional: false },
] as const;

/** The same four-step quote flow as the phone, laid out for a wide screen. The logic lives in `useQuoteFlow`. */
export default function DesktopQuoteStepper() {
  const flow = useQuoteFlow();
  const { activeStep, order } = flow;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <LabHeader title={'CEMEVYF - Labos'} subTitle={'Cotizaciones - Labo Octubre 2026 1.35'} />

      <Stepper activeStep={activeStep} sx={{ my: 3 }}>
        {STEPS.map(({ label, optional }, index) => {
          const hint = optional ? <Typography variant="caption">Opcional</Typography> : undefined;
          return (
            <Step key={label} completed={index < activeStep}>
              {index < activeStep ? (
                // Finished steps are buttons to go back; going forward only happens with "Continuar".
                <StepButton onClick={() => flow.goToStep(index)} disabled={flow.busy} optional={hint}>
                  {label}
                </StepButton>
              ) : (
                <StepLabel optional={hint}>{label}</StepLabel>
              )}
            </Step>
          );
        })}
      </Stepper>

      <Box sx={{ minHeight: 420 }}>
        {/* Always mounted: unmounting it on Back/Next would reset its page and search. It is hidden with a zero
            height instead of display:none because the Data Grid needs its parent to keep a width. */}
        <Box sx={activeStep === STEP.STUDIES ? undefined : { height: 0, overflow: 'hidden', visibility: 'hidden' }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 7 }}>
              <LabTableDesktop rowSelectionModel={flow.selection} setRowSelectionModel={flow.setSelection} />
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Stack spacing={2}>
                <SelectedStudies
                  selectedLabItems={flow.quoteItems}
                  onRemove={flow.removeItem}
                  maxHeight={420}
                  showPrices
                />
                <TotalQuote description={'Total sugerido'} totalQuote={flow.suggestedTotal} />
              </Stack>
            </Grid>
          </Grid>
        </Box>

        {/* Always mounted: unmounting it on Back/Next would lose the files still in review. */}
        <Box sx={{ display: activeStep === STEP.PRESCRIPTIONS ? 'block' : 'none', maxWidth: 720, mx: 'auto' }}>
          <PrescriptionPicker
            key={flow.pickerKey}
            variant="desktop"
            active={activeStep === STEP.PRESCRIPTIONS}
            orderId={order?.id}
            existingFiles={flow.existingFiles}
            onUploadSummaryChange={flow.setUploads}
            onError={flow.setError}
          />
        </Box>

        {activeStep === STEP.PATIENT && (
          <Box sx={{ maxWidth: 640, mx: 'auto' }}>
            <PatientStep selected={flow.client} onSelect={flow.setClient} onError={flow.setError} />
          </Box>
        )}

        {activeStep === STEP.SUMMARY && order && (
          <Box sx={{ maxWidth: 480, mx: 'auto' }}>
            <QuoteSummary orderId={order.id} total={flow.quotedAmount} mode="copy" />
          </Box>
        )}
      </Box>

      <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" size="large" onClick={flow.back} disabled={activeStep === STEP.STUDIES || flow.busy}>
          Atrás
        </Button>
        <Button
          variant={activeStep === STEP.SUMMARY ? 'outlined' : 'contained'}
          size="large"
          onClick={flow.next}
          disabled={flow.nextDisabled}
        >
          {flow.nextLabel}
        </Button>
      </Stack>

      <QuoteFlowDialogs flow={flow} />
    </Container>
  );
}
