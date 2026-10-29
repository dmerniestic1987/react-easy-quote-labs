import * as React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from './AuthProvider';
import LoginScreen from './LoginScreen';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();

  if (state.status === 'loading') {
    return (
      <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress aria-label="Verificando sesión" />
      </Box>
    );
  }
  if (state.status === 'unauthenticated') return <LoginScreen notice={state.notice} />;
  return <>{children}</>;
}
