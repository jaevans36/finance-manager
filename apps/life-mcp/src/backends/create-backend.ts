import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { LifeManagerAuth } from './life-manager-auth.js';
import type { Backend, BackendConfig } from './types.js';

type RetryableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

/**
 * Build the axios instance for one backend: attaches a fresh bearer token to every
 * request and, on a single 401, re-logs-in (via the given auth manager) and replays
 * the request once.
 */
function buildHttpClient(baseUrl: string, userAgent: string, auth: LifeManagerAuth): AxiosInstance {
  const http = axios.create({
    baseURL: baseUrl,
    timeout: 15_000,
    headers: { 'User-Agent': userAgent },
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

  return http;
}

/**
 * Build a backend that logs in for itself (life-api — the only service with a
 * login endpoint). No module-level state — each call returns an isolated
 * { http, auth } pair.
 */
export function createBackend(cfg: BackendConfig): Backend {
  const auth = new LifeManagerAuth(cfg);
  return { name: cfg.name, http: buildHttpClient(cfg.baseUrl, cfg.userAgent, auth), auth };
}

/**
 * Build a backend that reuses another backend's auth manager rather than logging in
 * itself. finance-api has no /api/v1/auth/login of its own — it validates the same
 * JWT life-api issues (same Jwt:Secret, ValidateIssuer/Audience both false — see
 * apps/finance-api/Program.cs), so a token obtained from the "life" backend is
 * already valid for finance-api's endpoints. This is what lets "finance" be added
 * with just a base URL, no separate credentials.
 */
export function createBackendWithSharedAuth(name: string, baseUrl: string, userAgent: string, auth: LifeManagerAuth): Backend {
  return { name, http: buildHttpClient(baseUrl, userAgent, auth), auth };
}
