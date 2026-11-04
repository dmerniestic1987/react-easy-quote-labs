import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Snackbar from '@mui/material/Snackbar';
import ErrorDialog from '../ErrorDialog';
import type { QuoteFlow } from './useQuoteFlow';

/** Error popup, "continue anyway?" confirmation and notice shared by every interface of the quote flow. */
export default function QuoteFlowDialogs({ flow }: { flow: QuoteFlow }) {
  return (
    <>
      <ErrorDialog error={flow.error} onClose={flow.closeError} />

      <Dialog open={flow.confirmSkip !== null} onClose={flow.closeConfirmSkip} fullWidth maxWidth="xs">
        <DialogTitle>¿Continuar igual?</DialogTitle>
        <DialogContent>
          <DialogContentText>{flow.confirmSkip}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={flow.closeConfirmSkip}>Volver</Button>
          <Button variant="contained" onClick={flow.confirmSkipAndContinue}>
            Continuar sin ellos
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={flow.notice !== null}
        autoHideDuration={6000}
        onClose={flow.closeNotice}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={flow.closeNotice} severity="success" sx={{ width: '100%' }}>
          {flow.notice ?? ''}
        </Alert>
      </Snackbar>
    </>
  );
}
