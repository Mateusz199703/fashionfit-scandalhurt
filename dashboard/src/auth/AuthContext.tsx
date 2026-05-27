import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, getToken, setToken as persistToken } from '../api/client';
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
          const { data } = await api.post<{ token: string }>('/api/auth/refresh');
          persistToken(data.token);
          scheduleRefresh(data.token);
        } catch {
          /* interceptor handles 401 */
        }
      }, delay);
    },
    [clearRefreshTimer],
  );

  const applyToken = useCallback(
    (token: string) => {
      persistToken(token);
      scheduleRefresh(token);
    },
    [scheduleRefresh],
  );

  const logout = useCallback(() => {
    clearRefreshTimer();
    persistToken(null);
    setClient(null);
  }, [clearRefreshTimer]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<{ token: string }>('/api/auth/login', { email, password });
      applyToken(data.token);
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
      const { data } = await api.post<{ token: string; checkoutUrl?: string | null }>('/api/auth/register', form);
      applyToken(data.token);
      await fetchMe();
      return { checkoutUrl: data.checkoutUrl || null };
    },
    [applyToken, fetchMe],
  );

  useEffect(() => {
    const token = getToken();
    if (!token) {
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
