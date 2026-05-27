import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  api,
  getRefreshToken,
  getToken,
  setRefreshToken as persistRefreshToken,
  setToken as persistToken,
} from '../api/client';
import { Client } from '../types';

interface AuthContextValue {
  client: Client | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    company_name?: string;
    company_nip?: string;
    plan?: 'STARTER' | 'GROWTH' | 'SCALE';
  }) => Promise<{ checkoutUrl: string | null }>;
  logout: () => void;
  refreshClient: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const REFRESH_LEAD_MS = 5 * 60 * 1000; // refresh 5 min before expiry

function getTokenExpiryMs(token: string): number | null {
  try {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded.exp ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
  }, []);

  const fetchMe = useCallback(async () => {
    const { data } = await api.get<{ client: Client }>('/api/auth/me');
    setClient(data.client);
  }, []);

  const scheduleRefresh = useCallback(
    (token: string) => {
      clearRefreshTimer();
      const expiry = getTokenExpiryMs(token);
      if (!expiry) return;
      const delay = Math.max(0, expiry - Date.now() - REFRESH_LEAD_MS);
      refreshTimer.current = setTimeout(async () => {
        try {
          const refreshToken = getRefreshToken();
          if (!refreshToken) return;
          const { data } = await api.post<{ token: string; refreshToken?: string }>('/api/auth/refresh', { refreshToken });
          persistToken(data.token);
          if (data.refreshToken) persistRefreshToken(data.refreshToken);
          scheduleRefresh(data.token);
        } catch {
          /* interceptor handles 401 */
        }
      }, delay);
    },
    [clearRefreshTimer],
  );

  const applyToken = useCallback(
    (token: string, refreshToken?: string | null) => {
      persistToken(token);
      if (refreshToken !== undefined) persistRefreshToken(refreshToken);
      scheduleRefresh(token);
    },
    [scheduleRefresh],
  );

  const logout = useCallback(() => {
    clearRefreshTimer();
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      api.post('/api/auth/logout', { refreshToken }).catch(() => {});
    }
    persistToken(null);
    persistRefreshToken(null);
    setClient(null);
  }, [clearRefreshTimer]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<{ token: string; refreshToken?: string }>('/api/auth/login', { email, password });
      applyToken(data.token, data.refreshToken || null);
      await fetchMe();
    },
    [applyToken, fetchMe],
  );

  const register = useCallback(
    async (form: {
      email: string;
      password: string;
      name: string;
      company_name?: string;
      company_nip?: string;
      plan?: 'STARTER' | 'GROWTH' | 'SCALE';
    }) => {
      const { data } = await api.post<{ token: string; refreshToken?: string; checkoutUrl?: string | null }>('/api/auth/register', form);
      applyToken(data.token, data.refreshToken || null);
      await fetchMe();
      return { checkoutUrl: data.checkoutUrl || null };
    },
    [applyToken, fetchMe],
  );

  useEffect(() => {
    const token = getToken();
    const refreshToken = getRefreshToken();
    if (!token) {
      setLoading(false);
      return;
    }
    if (!refreshToken) {
      // Transitional compatibility with older sessions that only had access token.
      persistToken(null);
      setLoading(false);
      return;
    }
    scheduleRefresh(token);
    fetchMe()
      .catch(() => logout())
      .finally(() => setLoading(false));
    return clearRefreshTimer;
  }, [fetchMe, logout, scheduleRefresh, clearRefreshTimer]);

  const value = useMemo(
    () => ({ client, loading, login, register, logout, refreshClient: fetchMe }),
    [client, loading, login, register, logout, fetchMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
