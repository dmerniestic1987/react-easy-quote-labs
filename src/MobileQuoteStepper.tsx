import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MobileStepper from '@mui/material/MobileStepper';
import Typography from '@mui/material/Typography';
import LabQuoteMobile from './LabQuoteMobile';
import PatientStep from './patients/PatientStep';
import PrescriptionPicker from './prescriptions/PrescriptionPicker';
import QuoteFlowDialogs from './quote/QuoteFlowDialogs';
import { STEP, STEP_COUNT, useQuoteFlow } from './quote/useQuoteFlow';
import QuoteSummary from './summary/QuoteSummary';

// Step titles. The first screen has none: its header already says what it is.
const STEP_TITLES = ['', 'Adjuntar receta médica (opcional)', 'Paciente (opcional)', 'Resumen'] as const;

export default function MobileQuoteStepper() {
  const flow = useQuoteFlow();
  const { activeStep, order } = flow;

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
      {STEP_TITLES[activeStep] && (
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          {STEP_TITLES[activeStep]}
        </Typography>
      )}

      <Box sx={{ flex: '1 1 auto', pb: 2 }}>
        {/* Always mounted: unmounting it on Back/Next would reset its page and search. It is hidden with a zero
            height instead of display:none because the Data Grid needs its parent to keep a width. */}
        <Box sx={activeStep === STEP.STUDIES ? undefined : { height: 0, overflow: 'hidden', visibility: 'hidden' }}>
          <LabQuoteMobile
            rowSelectionModel={flow.selection}
            onRowSelectionModelChange={flow.setSelection}
            selectedLabs={flow.quoteItems}
            suggestedTotalFormatted={flow.suggestedTotal}
            onRemove={flow.removeItem}
          />
        </Box>
        {/* Always mounted: unmounting it on Back/Next would lose the photos still in review. */}
        <Box sx={{ display: activeStep === STEP.PRESCRIPTIONS ? 'block' : 'none' }}>
          <PrescriptionPicker
            key={flow.pickerKey}
            variant="mobile"
            orderId={order?.id}
            existingFiles={flow.existingFiles}
            onUploadSummaryChange={flow.setUploads}
            onError={flow.setError}
          />
        </Box>
        {activeStep === STEP.PATIENT && (
          <PatientStep selected={flow.client} onSelect={flow.setClient} onError={flow.setError} />
        )}
        {activeStep === STEP.SUMMARY && order && <QuoteSummary orderId={order.id} total={flow.quotedAmount} />}
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
            variant={activeStep === STEP.SUMMARY ? 'outlined' : 'contained'}
            size="large"
            onClick={flow.next}
            disabled={flow.nextDisabled}
            sx={{ py: 1.25, px: 2, whiteSpace: 'nowrap' }}
          >
            {flow.nextLabel}
          </Button>
        }
        backButton={
          <Button
            variant="outlined"
            size="large"
            onClick={flow.back}
            disabled={activeStep === STEP.STUDIES || flow.busy}
            sx={{ py: 1.25, px: 2, whiteSpace: 'nowrap' }}
          >
            Atrás
          </Button>
        }
      />

      <QuoteFlowDialogs flow={flow} />
    </Box>
  );
}
