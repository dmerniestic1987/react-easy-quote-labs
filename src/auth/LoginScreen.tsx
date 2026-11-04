import * as React from 'react';
import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { ApiError } from '../api/client';
import { useAuth } from './AuthProvider';

function describeLoginError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return error.retryAfterSeconds
        ? `Demasiados intentos. Probá de nuevo en ${Math.ceil(error.retryAfterSeconds / 60)} min.`
        : 'Demasiados intentos. Esperá unos minutos y probá de nuevo.';
    }
    return error.message;
  }
  return 'No se pudo iniciar sesión';
}

export default function LoginScreen({ notice }: { notice?: string }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockedUntil, setBlockedUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  // Keep the button disabled for the whole Retry-After window after a 429.
  useEffect(() => {
    if (blockedUntil <= Date.now()) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [blockedUntil]);
  const isBlocked = now < blockedUntil;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await login({ username: username.trim(), password });
    } catch (e) {
      setError(describeLoginError(e));
      if (e instanceof ApiError && e.status === 429 && e.retryAfterSeconds) {
        const until = Date.now() + e.retryAfterSeconds * 1000;
        setNow(Date.now());
        setBlockedUntil(until);
      }
      setPassword('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', p: { xs: 0, sm: 2 } }}>
      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: { sm: 420 },
          minHeight: { xs: '100dvh', sm: 'auto' },
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          borderRadius: { xs: 0, sm: 2 },
        }}
      >
        <Stack spacing={2}>
          <Typography variant="h5" component="h1" align="center">
            CEMEVYF - Labos
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary">
            Ingresá con tu usuario y contraseña
          </Typography>
          {notice && <Alert severity="info">{notice}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            required
            autoFocus
            label="Usuario"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
            slotProps={{ htmlInput: { autoComplete: 'username', autoCapitalize: 'none', autoCorrect: 'off', spellCheck: false } }}
          />
          <TextField
            required
            label="Contraseña"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            slotProps={{
              htmlInput: { autoComplete: 'current-password' },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting || isBlocked || !username.trim() || !password}>
            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
