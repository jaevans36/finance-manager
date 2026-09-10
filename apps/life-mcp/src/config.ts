import { z } from 'zod';
import type { BackendConfig } from './backends/types.js';

const DEFAULT_USER_AGENT = 'LifeManager-MCP/1.0';

const EnvSchema = z.object({
  LM_API_BASE_URL: z.string().url({ message: 'LM_API_BASE_URL must be a valid URL' }),
  LM_MCP_EMAIL: z.string().min(1, 'LM_MCP_EMAIL is required'),
  LM_MCP_PASSWORD: z.string().min(1, 'LM_MCP_PASSWORD is required'),
  LM_MCP_USER_AGENT: z.string().min(1).default(DEFAULT_USER_AGENT),
});

export interface AppConfig {
  backends: BackendConfig[];
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

/**
 * Validate the process environment and build the backend list.
 *
 * v1: one backend ("life") from the LM_* vars. To add finance-api later, read an
 * optional FIN_API_BASE_URL / FIN_MCP_EMAIL / FIN_MCP_PASSWORD trio here and push a
 * second BackendConfig when all three are present — no other file changes.
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
  const backends: BackendConfig[] = [
    {
      name: 'life',
      baseUrl: data.LM_API_BASE_URL.replace(/\/+$/, ''),
      email: data.LM_MCP_EMAIL,
      password: data.LM_MCP_PASSWORD,
      userAgent: data.LM_MCP_USER_AGENT,
    },
  ];

  return { backends };
}
