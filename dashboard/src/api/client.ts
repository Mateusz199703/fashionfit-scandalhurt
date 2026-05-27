import axios from 'axios';
import { API_URL, TOKEN_KEY } from '../config';

export const api = axios.create({ baseURL: API_URL });

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// Attach the bearer token to every request.
api.interceptors.request.use((cfg) => {
  const token = getToken();
  if (token) {
    if (cfg.headers && typeof cfg.headers.set === 'function') {
      cfg.headers.set('Authorization', `Bearer ${token}`);
    } else {
      const headers = (cfg.headers || {}) as Record<string, string>;
      headers.Authorization = `Bearer ${token}`;
      cfg.headers = headers as typeof cfg.headers;
    }
  }
  return cfg;
});

// On 401, drop the token and bounce to login.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      setToken(null);
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export function apiErrorMessage(error: unknown, fallback = 'Coś poszło nie tak'): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error || error.message || fallback;
  }
  return fallback;
}
