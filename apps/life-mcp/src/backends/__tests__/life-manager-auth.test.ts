import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { AuthError, LifeManagerAuth } from '../life-manager-auth.js';
import type { BackendConfig } from '../types.js';

const cfg: BackendConfig = {
  name: 'life',
  baseUrl: 'http://api.test',
  email: 'jay@example.com',
  password: 'secret',
  userAgent: 'LifeManager-MCP/1.0',
};

function jwt(expSecondsFromNow?: number): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload =
    expSecondsFromNow === undefined
      ? Buffer.from(JSON.stringify({ sub: 'u1' })).toString('base64url')
      : Buffer.from(
          JSON.stringify({ sub: 'u1', exp: Math.floor(Date.now() / 1000) + expSecondsFromNow }),
        ).toString('base64url');
  return `${header}.${payload}.sig`;
}

let mock: MockAdapter;

beforeEach(() => {
  mock = new MockAdapter(axios);
});

afterEach(() => {
  mock.restore();
});

describe('LifeManagerAuth', () => {
  it('logs in with emailOrUsername + password and returns the token', async () => {
    const token = jwt(3600);
    mock.onPost('http://api.test/api/v1/auth/login').reply((config) => {
      expect(JSON.parse(config.data)).toEqual({ emailOrUsername: 'jay@example.com', password: 'secret' });
      return [200, { token }];
    });

    const auth = new LifeManagerAuth(cfg);
    await expect(auth.getToken()).resolves.toBe(token);
    expect(mock.history.post).toHaveLength(1);
  });

  it('serves a cached token without a second request', async () => {
    mock.onPost(/login$/).reply(200, { token: jwt(3600) });
    const auth = new LifeManagerAuth(cfg);
    await auth.getToken();
    await auth.getToken();
    expect(mock.history.post).toHaveLength(1);
  });

  it('re-logs-in when the cached token is within the expiry skew', async () => {
    const first = jwt(120); // 2 min — inside the 5-min skew
    const second = jwt(3600);
    mock.onPost(/login$/).replyOnce(200, { token: first });
    mock.onPost(/login$/).replyOnce(200, { token: second });

    const auth = new LifeManagerAuth(cfg);
    await expect(auth.getToken()).resolves.toBe(first);
    await expect(auth.getToken()).resolves.toBe(second);
    expect(mock.history.post).toHaveLength(2);
  });

  it('caches a token with no exp using the fallback lifetime (no relogin loop)', async () => {
    mock.onPost(/login$/).reply(200, { token: jwt(undefined) });
    const auth = new LifeManagerAuth(cfg);
    await auth.getToken();
    await auth.getToken();
    await auth.getToken();
    expect(mock.history.post).toHaveLength(1);
  });

  it('caches a token whose exp is already in the past using the fallback lifetime', async () => {
    mock.onPost(/login$/).reply(200, { token: jwt(-3600) });
    const auth = new LifeManagerAuth(cfg);
    await auth.getToken();
    await auth.getToken();
    expect(mock.history.post).toHaveLength(1);
  });

  it('forceRelogin always performs a fresh login', async () => {
    mock.onPost(/login$/).replyOnce(200, { token: jwt(3600) });
    mock.onPost(/login$/).replyOnce(200, { token: jwt(3600) });
    const auth = new LifeManagerAuth(cfg);
    await auth.getToken();
    await auth.forceRelogin();
    expect(mock.history.post).toHaveLength(2);
  });

  it('deduplicates concurrent cold-start logins into one request', async () => {
    mock.onPost(/login$/).reply(200, { token: jwt(3600) });
    const auth = new LifeManagerAuth(cfg);
    await Promise.all([auth.getToken(), auth.getToken(), auth.getToken(), auth.getToken(), auth.getToken()]);
    expect(mock.history.post).toHaveLength(1);
  });

  it('throws AuthError carrying the HTTP status on a 401', async () => {
    mock.onPost(/login$/).reply(401, { error: { message: 'bad creds' } });
    await expect(new LifeManagerAuth(cfg).getToken()).rejects.toThrow(AuthError);
    await expect(new LifeManagerAuth(cfg).getToken()).rejects.toThrow(/401/);
  });

  it('throws AuthError mentioning the connection on a network failure', async () => {
    mock.onPost(/login$/).networkError();
    await expect(new LifeManagerAuth(cfg).getToken()).rejects.toThrow(
      /Could not reach the Life Manager API/,
    );
  });
});
