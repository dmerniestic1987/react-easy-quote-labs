import * as React from 'react';
import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { ApiError } from '../api/client';
import { useAuth } from './AuthProvider';

const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_BYTES = 72;

/** Returns an error message for an invalid new password, or null when it satisfies the API rules. */
export function validateNewPassword(newPassword: string, currentPassword: string): string | null {
  if (newPassword.length < MIN_PASSWORD_LENGTH) return `Debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`;
  // The API limit is in bytes, not characters: accents and emojis take more than one byte.
  if (new TextEncoder().encode(newPassword).length > MAX_PASSWORD_BYTES) {
    return `Debe ocupar como máximo ${MAX_PASSWORD_BYTES} bytes (los acentos y emojis cuentan más de uno)`;
  }
  if (newPassword === currentPassword) return 'Debe ser distinta de la actual';
  return null;
}

type Props = { open: boolean; onClose: () => void };

export default function ChangePasswordDialog({ open, onClose }: Props) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const newPasswordError = newPassword ? validateNewPassword(newPassword, currentPassword) : null;
  const confirmationError = confirmation && confirmation !== newPassword ? 'Las contraseñas no coinciden' : null;
  const canSubmit =
    !!currentPassword && !!newPassword && !newPasswordError && confirmation === newPassword && !isSubmitting;

  const handleClose = () => {
    if (isSubmitting) return;
    setCurrentPassword('');
    setNewPassword('');
    setConfirmation('');
    setCurrentError(null);
    setFormError(null);
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setCurrentError(null);
    setFormError(null);
    try {
      // On success the session ends and AuthGate swaps this whole tree for the login screen.
      await changePassword({ currentPassword, newPassword });
    } catch (e) {
      if (e instanceof ApiError && e.status === 400) setCurrentError(e.message);
      else setFormError(e instanceof ApiError ? e.message : 'No se pudo cambiar la contraseña');
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullScreen={fullScreen} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit}>
        <DialogTitle>Cambiar contraseña</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="info">Al cambiarla se cerrarán todas tus sesiones y tendrás que ingresar de nuevo.</Alert>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              required
              type="password"
              label="Contraseña actual"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              error={!!currentError}
              helperText={currentError}
              slotProps={{ htmlInput: { autoComplete: 'current-password' } }}
            />
            <TextField
              required
              type="password"
              label="Nueva contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={!!newPasswordError}
              helperText={newPasswordError ?? `Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
              slotProps={{ htmlInput: { autoComplete: 'new-password' } }}
            />
            <TextField
              required
              type="password"
              label="Repetir nueva contraseña"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              error={!!confirmationError}
              helperText={confirmationError}
              slotProps={{ htmlInput: { autoComplete: 'new-password' } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={!canSubmit}>
            {isSubmitting ? 'Guardando...' : 'Cambiar contraseña'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
