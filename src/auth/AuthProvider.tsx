import * as React from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch, onUnauthorized } from '../api/client';
import type { ChangePasswordRequest, LoginRequest, LoginUser, SessionInfo } from '../api/types';

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated'; notice?: string }
  | { status: 'authenticated'; user: LoginUser; expiresAt: number | null };

type AuthContextValue = {
  state: AuthState;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (request: ChangePasswordRequest) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_EXPIRED = 'Tu sesión expiró. Ingresá nuevamente.';

function toAuthenticated({ user, expiresAt }: SessionInfo): AuthState {
  return { status: 'authenticated', user, expiresAt };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  // Flow 1.2: verify the existing session when the app opens.
  useEffect(() => {
    let cancelled = false;
    apiFetch<SessionInfo>('/api/auth/me', { notifyUnauthorized: false })
      .then((session) => !cancelled && setState(toAuthenticated(session)))
      .catch(() => !cancelled && setState({ status: 'unauthenticated' }));
    return () => {
      cancelled = true;
    };
  }, []);

  // Any 401 from a protected call means the session is gone.
  useEffect(
    () =>
      onUnauthorized(() =>
        setState((current) =>
          current.status === 'authenticated' ? { status: 'unauthenticated', notice: SESSION_EXPIRED } : current,
        ),
      ),
    [],
  );

  const expiresAt = state.status === 'authenticated' ? state.expiresAt : null;
  useEffect(() => {
    if (expiresAt === null) return undefined;
    // setTimeout caps at ~24.8 days; sessions last hours, but clamp anyway.
    const delay = Math.min(Math.max(expiresAt - Date.now(), 0), 2 ** 31 - 1);
    const timer = setTimeout(() => setState({ status: 'unauthenticated', notice: SESSION_EXPIRED }), delay);
    return () => clearTimeout(timer);
  }, [expiresAt]);

  const login = useCallback(async (credentials: LoginRequest) => {
    const session = await apiFetch<SessionInfo>('/api/auth/login', {
      method: 'POST',
      json: credentials,
      notifyUnauthorized: false,
    });
    setState(toAuthenticated(session));
  }, []);

  const logout = useCallback(async () => {
    await apiFetch('/api/auth/logout', { method: 'POST', notifyUnauthorized: false }).catch(() => undefined);
    setState({ status: 'unauthenticated' });
  }, []);

  const changePassword = useCallback(async (request: ChangePasswordRequest) => {
    await apiFetch('/api/auth/password', { method: 'PUT', json: request });
    // The backend closed every session, including this one.
    setState({ status: 'unauthenticated', notice: 'Contraseña actualizada. Ingresá nuevamente.' });
  }, []);

  const value = useMemo(() => ({ state, login, logout, changePassword }), [state, login, logout, changePassword]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
