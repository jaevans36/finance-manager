import axios from 'axios';
import type { BackendConfig } from './types.js';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

/** Re-login this many ms before the JWT `exp`. */
const EXPIRY_SKEW_MS = 5 * 60_000;
/** Fallback lifetime when the JWT has no usable `exp` (life-api dev config sets exp +10y). */
const FALLBACK_LIFETIME_MS = 55 * 60_000;

function decodeExpMs(token: string): number {
  try {
    const payload = token.split('.')[1];
    if (!payload) return 0;
    const json = Buffer.from(payload, 'base64url').toString('utf8');
    const exp = (JSON.parse(json) as { exp?: number }).exp;
    if (typeof exp !== 'number' || !Number.isFinite(exp)) return 0;
    return exp * 1000;
  } catch {
    return 0;
  }
}

/**
 * Holds a life-api JWT for one backend account and keeps it fresh.
 *
 * life-api has no refresh endpoint and issues no refresh token, so "refresh" here
 * means "log in again". The token is fetched lazily on first use, cached in memory,
 * renewed proactively ~5 min before `exp`, and renewed reactively when a caller
 * reports a 401 (see create-backend.ts).
 */
export class LifeManagerAuth {
  private token: string | null = null;
  private expiresAt = 0;
  private inFlight: Promise<string> | null = null;

  constructor(private readonly cfg: BackendConfig) {}

  /** A valid JWT, logging in if the cache is empty or close to expiry. */
  async getToken(): Promise<string> {
    if (this.token && Date.now() < this.expiresAt - EXPIRY_SKEW_MS) {
      return this.token;
    }
    return this.login();
  }

  /** Discard the cached token and log in again (used on a 401). */
  async forceRelogin(): Promise<string> {
    this.token = null;
    this.expiresAt = 0;
    return this.login();
  }

  private login(): Promise<string> {
    if (this.inFlight) return this.inFlight;

    this.inFlight = (async () => {
      let res;
      try {
        res = await axios.post(
          `${this.cfg.baseUrl}/api/v1/auth/login`,
          { emailOrUsername: this.cfg.email, password: this.cfg.password },
          { headers: { 'User-Agent': this.cfg.userAgent }, timeout: 15_000 },
        );
      } catch (err) {
        if (axios.isAxiosError(err)) {
          if (err.response) {
            throw new AuthError(
              `Life Manager login failed (HTTP ${err.response.status}) for "${this.cfg.email}". Check LM_MCP_EMAIL / LM_MCP_PASSWORD.`,
            );
          }
          throw new AuthError(
            `Could not reach the Life Manager API at ${this.cfg.baseUrl} (${err.code ?? 'no response'}). Check LM_API_BASE_URL and that life-api is running.`,
          );
        }
        throw new AuthError(`Life Manager login failed: ${String(err)}`);
      }

      const token = (res.data as { token?: unknown }).token;
      if (typeof token !== 'string' || token === '') {
        throw new AuthError('Life Manager login returned no token.');
      }

      this.token = token;
      const expMs = decodeExpMs(token);
      this.expiresAt = expMs > Date.now() ? expMs : Date.now() + FALLBACK_LIFETIME_MS;
      return token;
    })().finally(() => {
      this.inFlight = null;
    });

    return this.inFlight;
  }
}
