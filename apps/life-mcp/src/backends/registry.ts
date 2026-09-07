import type { AppConfig } from '../config.js';
import { createBackend } from './create-backend.js';
import type { BackendRegistry } from './types.js';

/** Instantiate every configured backend, keyed by name. */
export function buildBackends(config: AppConfig): BackendRegistry {
  const registry: BackendRegistry = {};
  for (const cfg of config.backends) {
    registry[cfg.name] = createBackend(cfg);
  }
  return registry;
}
