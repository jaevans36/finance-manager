import type { AxiosInstance } from 'axios';
import type { LifeManagerAuth } from './life-manager-auth.js';

/**
 * Config for a backend service that logs in for itself. Only life-api qualifies —
 * it's the only service with a POST /api/v1/auth/login. Other services (finance-api)
 * that trust life-api's JWT reuse its auth instead — see SharedAuthBackendConfig.
 */
export interface BackendConfig {
  /** Stable key used by tools to select their backend, e.g. "life". */
  name: string;
  /** Base URL of the target API, e.g. http://localhost:5000 */
  baseUrl: string;
  /** Login identifier (email or username) for the account the server acts as. */
  email: string;
  /** Password for that account. */
  password: string;
  /** User-Agent header sent on every request (visible in the API audit log). */
  userAgent: string;
}

/**
 * Config for a backend that has no login of its own and instead reuses another
 * backend's auth manager — e.g. "finance" (finance-api validates the same JWT
 * life-api issues; same Jwt:Secret, ValidateIssuer/Audience both false).
 */
export interface SharedAuthBackendConfig {
  /** Stable key used by tools to select their backend, e.g. "finance". */
  name: string;
  /** Base URL of the target API, e.g. http://localhost:5002 */
  baseUrl: string;
}

/** A live backend: an authenticated axios instance plus the auth manager behind it. */
export interface Backend {
  name: string;
  http: AxiosInstance;
  auth: LifeManagerAuth;
}

export type BackendRegistry = Record<string, Backend>;
