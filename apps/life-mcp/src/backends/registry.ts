import type { AppConfig } from '../config.js';
import { createBackend, createBackendWithSharedAuth } from './create-backend.js';
import type { BackendRegistry } from './types.js';

/**
 * Instantiate every configured backend, keyed by name. "life" logs in for itself;
 * any sharedAuthBackends (e.g. "finance") reuse life's auth manager rather than
 * logging in separately — see SharedAuthBackendConfig for why.
 */
export function buildBackends(config: AppConfig): BackendRegistry {
  const registry: BackendRegistry = {};
  const life = createBackend(config.life);
  registry[life.name] = life;

  for (const cfg of config.sharedAuthBackends) {
    registry[cfg.name] = createBackendWithSharedAuth(cfg.name, cfg.baseUrl, config.life.userAgent, life.auth);
  }

  return registry;
}
