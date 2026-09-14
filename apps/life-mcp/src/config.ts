import { z } from 'zod';
import type { BackendConfig, SharedAuthBackendConfig } from './backends/types.js';

const DEFAULT_USER_AGENT = 'LifeManager-MCP/1.0';

const EnvSchema = z.object({
  LM_API_BASE_URL: z.string().url({ message: 'LM_API_BASE_URL must be a valid URL' }),
  LM_MCP_EMAIL: z.string().min(1, 'LM_MCP_EMAIL is required'),
  LM_MCP_PASSWORD: z.string().min(1, 'LM_MCP_PASSWORD is required'),
  LM_MCP_USER_AGENT: z.string().min(1).default(DEFAULT_USER_AGENT),
  FIN_API_BASE_URL: z.string().url({ message: 'FIN_API_BASE_URL must be a valid URL' }).optional(),
});

export interface AppConfig {
  /** life-api — the only backend with its own login. */
  life: BackendConfig;
  /** Backends that reuse life's auth instead of logging in themselves (e.g. "finance"). */
  sharedAuthBackends: SharedAuthBackendConfig[];
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

/**
 * Validate the process environment and build the backend config.
 *
 * finance-api has no login of its own (see SharedAuthBackendConfig) — it validates
 * the same JWT life-api issues, so enabling it needs only FIN_API_BASE_URL, not a
 * separate email/password. Omit FIN_API_BASE_URL and finance_* tools simply aren't
 * registered (see registerTools in tools/_register.ts).
 *
 * Throws ConfigError (with every failing var listed) rather than exiting, so callers
 * and tests control the exit path.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new ConfigError(`Invalid environment:\n${issues}`);
  }

  const data = parsed.data;
  const life: BackendConfig = {
    name: 'life',
    baseUrl: data.LM_API_BASE_URL.replace(/\/+$/, ''),
    email: data.LM_MCP_EMAIL,
    password: data.LM_MCP_PASSWORD,
    userAgent: data.LM_MCP_USER_AGENT,
  };

  const sharedAuthBackends: SharedAuthBackendConfig[] = [];
  if (data.FIN_API_BASE_URL) {
    sharedAuthBackends.push({ name: 'finance', baseUrl: data.FIN_API_BASE_URL.replace(/\/+$/, '') });
  }

  return { life, sharedAuthBackends };
}
