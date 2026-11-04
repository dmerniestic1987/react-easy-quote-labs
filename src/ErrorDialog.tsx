import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';

export type ErrorDialogState = {
  title: string;
  message: string;
  /** Adds a "Reintentar" button that runs the failed action again. */
  onRetry?: () => void;
};

type Props = { error: ErrorDialogState | null; onClose: () => void };

export default function ErrorDialog({ error, onClose }: Props) {
  return (
    <Dialog open={error !== null} onClose={onClose} aria-labelledby="error-dialog-title" fullWidth maxWidth="xs">
      <DialogTitle id="error-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ErrorOutlinedIcon color="error" />
        {error?.title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>{error?.message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
        {error?.onRetry && (
          <Button
            variant="contained"
            onClick={() => {
              const retry = error.onRetry;
              onClose();
              retry?.();
            }}
          >
            Reintentar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
