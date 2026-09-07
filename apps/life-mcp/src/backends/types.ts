import type { AxiosInstance } from 'axios';
import type { LifeManagerAuth } from './life-manager-auth.js';

/**
 * Config for one backend service the MCP server fronts. v1 has a single backend
 * ("life" = life-api); a second ("finance" = finance-api) is added later by
 * pushing another BackendConfig in config.ts — nothing else changes.
 */
export interface BackendConfig {
  /** Stable key used by tools to select their backend, e.g. "life", "finance". */
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

/** A live backend: an authenticated axios instance plus the auth manager behind it. */
export interface Backend {
  name: string;
  http: AxiosInstance;
  auth: LifeManagerAuth;
}

export type BackendRegistry = Record<string, Backend>;
