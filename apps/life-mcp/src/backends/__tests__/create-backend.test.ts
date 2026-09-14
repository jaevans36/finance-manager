import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { createBackend, createBackendWithSharedAuth } from '../create-backend.js';
import { LifeManagerAuth } from '../life-manager-auth.js';
import type { BackendConfig } from '../types.js';

const cfg: BackendConfig = {
  name: 'life',
  baseUrl: 'http://api.test',
  email: 'jay@example.com',
  password: 'secret',
  userAgent: 'LifeManager-MCP/1.0',
};

function jwt(): string {
  const h = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${h}.${p}.sig`;
}

let loginMock: MockAdapter;

beforeEach(() => {
  loginMock = new MockAdapter(axios); // intercepts the bare axios.post login call
  loginMock.onPost('http://api.test/api/v1/auth/login').reply(200, { token: jwt() });
});

afterEach(() => {
  loginMock.restore();
});

describe('createBackend', () => {
  it('attaches a bearer token and the User-Agent to every request', async () => {
    const { http } = createBackend(cfg);
    const apiMock = new MockAdapter(http);
    apiMock.onGet('/api/v1/tasks').reply((config) => {
      expect(config.headers?.Authorization).toMatch(/^Bearer /);
      expect(config.headers?.['User-Agent']).toBe('LifeManager-MCP/1.0');
      return [200, []];
    });

    await http.get('/api/v1/tasks');
    apiMock.restore();
  });

  it('re-logs-in and replays the request once on a 401', async () => {
    const { http } = createBackend(cfg);
    const apiMock = new MockAdapter(http);
    apiMock.onGet('/api/v1/tasks').replyOnce(401);
    apiMock.onGet('/api/v1/tasks').replyOnce(200, [{ id: 't1' }]);

    const res = await http.get('/api/v1/tasks');
    expect(res.data).toEqual([{ id: 't1' }]);
    // one initial login + one forced relogin from the 401 handler
    expect(loginMock.history.post).toHaveLength(2);
    apiMock.restore();
  });

  it('gives up after a second consecutive 401 (no retry loop)', async () => {
    const { http } = createBackend(cfg);
    const apiMock = new MockAdapter(http);
    apiMock.onGet('/api/v1/tasks').reply(401);

    await expect(http.get('/api/v1/tasks')).rejects.toMatchObject({
      response: { status: 401 },
    });
    apiMock.restore();
  });

  it('passes non-401 errors straight through without a relogin', async () => {
    const { http } = createBackend(cfg);
    const apiMock = new MockAdapter(http);
    apiMock.onGet('/api/v1/tasks').reply(500, { error: { message: 'boom' } });

    await expect(http.get('/api/v1/tasks')).rejects.toMatchObject({ response: { status: 500 } });
    expect(loginMock.history.post).toHaveLength(1); // only the initial login
    apiMock.restore();
  });
});

describe('createBackendWithSharedAuth', () => {
  it('reuses the given auth manager rather than logging in itself', async () => {
    const auth = new LifeManagerAuth(cfg);
    const backend = createBackendWithSharedAuth('finance', 'http://finance.test', 'LifeManager-MCP/1.0', auth);
    expect(backend.name).toBe('finance');
    expect(backend.auth).toBe(auth);

    const apiMock = new MockAdapter(backend.http);
    apiMock.onGet('/api/v1/finance/accounts').reply((config) => {
      expect(config.headers?.Authorization).toMatch(/^Bearer /);
      return [200, []];
    });

    await backend.http.get('/api/v1/finance/accounts');
    // the one login came from the shared auth manager, not from a finance-api login endpoint
    expect(loginMock.history.post).toHaveLength(1);
    apiMock.restore();
  });

  it('re-logs-in via the shared auth manager and replays the request once on a 401', async () => {
    const auth = new LifeManagerAuth(cfg);
    const backend = createBackendWithSharedAuth('finance', 'http://finance.test', 'LifeManager-MCP/1.0', auth);
    const apiMock = new MockAdapter(backend.http);
    apiMock.onGet('/api/v1/finance/accounts').replyOnce(401);
    apiMock.onGet('/api/v1/finance/accounts').replyOnce(200, [{ id: 'a1' }]);

    const res = await backend.http.get('/api/v1/finance/accounts');
    expect(res.data).toEqual([{ id: 'a1' }]);
    expect(loginMock.history.post).toHaveLength(2);
    apiMock.restore();
  });
});
