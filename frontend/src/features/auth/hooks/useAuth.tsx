import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/AuthService';
import { setAuthToken, clientApi } from '../../../services/api';

/** Context value exposed by the auth provider. */
interface AuthContextValue {
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Provider that manages the auth token lifecycle, including persistence,
 * refresh, and global 401 handling via `clientApi.onUnauthorized`.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('access_token');
    } catch {
      return null;
    }
  });

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  // handle 401 responses globally
  useEffect(() => {
    clientApi.onUnauthorized = () => {
      setToken(null);
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    };
    return () => {
      clientApi.onUnauthorized = undefined;
    };
  }, []);

  // automatically refresh auth token every 15 minutes
  useEffect(() => {
    if (!token) return;
    const handle = setInterval(async () => {
      try {
        const res = await authService.refresh(token);
        setToken(res.token);
      } catch {
        setToken(null);
      }
    }, 13 * 60 * 1000);
    return () => clearInterval(handle);
  }, [token]);

  /** Sign in with credentials and update the token. */
  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password);
    setToken(result.token);
  };

  /** Register a new account. */
  const register = async (
    name: string,
    email: string,
    password: string
  ) => {
    await authService.register(name, email, password);
  };

  /** Log out and clear any persisted token. */
  const logout = async () => {
    if (token) {
      try {
        await authService.logout(token);
      } catch {}
    }
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/** Hook to access the authentication context. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
