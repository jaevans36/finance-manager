import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { LifeManagerAuth } from './life-manager-auth.js';
import type { Backend, BackendConfig } from './types.js';

type RetryableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

/**
 * Build a live backend: an axios instance that attaches a fresh bearer token to every
 * request and, on a single 401, re-logs-in and replays the request once.
 *
 * No module-level state — each call returns an isolated { http, auth } pair, which is
 * what lets a second backend (finance-api) be added purely by config.
 */
export function createBackend(cfg: BackendConfig): Backend {
  const auth = new LifeManagerAuth(cfg);

  const http: AxiosInstance = axios.create({
    baseURL: cfg.baseUrl,
    timeout: 15_000,
    headers: { 'User-Agent': cfg.userAgent },
  });

  http.interceptors.request.use(async (config) => {
    const token = await auth.getToken();
    config.headers.set('Authorization', `Bearer ${token}`);
    return config;
  });

  http.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (!axios.isAxiosError(error) || error.response?.status !== 401) {
        return Promise.reject(error);
      }
      const original = error.config as RetryableConfig | undefined;
      if (!original || original._retried) {
        return Promise.reject(error);
      }
      original._retried = true;
      const token = await auth.forceRelogin();
      original.headers.set('Authorization', `Bearer ${token}`);
      return http.request(original);
    },
  );

  return { name: cfg.name, http, auth };
}
