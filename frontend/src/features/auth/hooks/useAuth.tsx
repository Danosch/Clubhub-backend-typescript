import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/AuthService';
import { clientApi } from '../../../services/api';

type AuthStatus = 'checking' | 'authenticated' | 'anonymous';

/** Authentication state and actions available to components. */
interface AuthContextValue {
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Verifies the cookie session on startup and manages authentication actions.
 *
 * @param children Components that need authentication state.
 * @returns The authentication context provider.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [status, setStatus] = useState<AuthStatus>('checking');

  useEffect(() => {
    let active = true;

    clientApi.onUnauthorized = () => {
      if (active) setStatus('anonymous');
    };

    // Remove a token left by the old bearer-token frontend.
    try {
      localStorage.removeItem('access_token');
    } catch {
      // Storage may be unavailable; authentication does not depend on it.
    }

    void authService
      .checkSession()
      .then(() => {
        if (active) setStatus('authenticated');
      })
      .catch(() => {
        if (active) setStatus('anonymous');
      });

    return () => {
      active = false;
      clientApi.onUnauthorized = undefined;
    };
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const handle = window.setInterval(() => {
      void authService.refresh().catch((error: unknown) => {
        // A 401 also triggers the API client's callback and clears auth state.
        console.warn('Session refresh failed:', error);
      });
    }, 13 * 60 * 1000);

    return () => window.clearInterval(handle);
  }, [status]);

  /**
   * Signs in and marks the cookie session as active.
   *
   * @param email User's email address.
   * @param password User's password.
   */
  const login = async (email: string, password: string): Promise<void> => {
    await authService.login(email, password);
    setStatus('authenticated');
  };

  /**
   * Registers a user without signing them in.
   *
   * @param name Display name.
   * @param email User's email address.
   * @param password User's password.
   */
  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<void> => {
    await authService.register(name, email, password);
  };

  /** Revokes the session before marking the user as signed out. */
  const logout = async (): Promise<void> => {
    await authService.logout();
    setStatus('anonymous');
  };

  return (
    <AuthContext.Provider value={{ status, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Reads authentication state from the provider.
 *
 * @returns The current authentication state and actions.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}