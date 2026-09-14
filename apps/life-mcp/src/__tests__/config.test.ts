import { ConfigError, loadConfig } from '../config.js';

const base = {
  LM_API_BASE_URL: 'http://localhost:5000',
  LM_MCP_EMAIL: 'jay@example.com',
  LM_MCP_PASSWORD: 'secret',
};

describe('loadConfig', () => {
  it('builds the "life" backend from the LM_* vars, with no shared-auth backends by default', () => {
    const { life, sharedAuthBackends } = loadConfig(base);
    expect(life).toMatchObject({
      name: 'life',
      baseUrl: 'http://localhost:5000',
      email: 'jay@example.com',
      password: 'secret',
      userAgent: 'LifeManager-MCP/1.0',
    });
    expect(sharedAuthBackends).toHaveLength(0);
  });

  it('honours a custom LM_MCP_USER_AGENT', () => {
    const { life } = loadConfig({ ...base, LM_MCP_USER_AGENT: 'Custom/9' });
    expect(life.userAgent).toBe('Custom/9');
  });

  it('strips a trailing slash from the base URL', () => {
    const { life } = loadConfig({ ...base, LM_API_BASE_URL: 'http://localhost:5000/' });
    expect(life.baseUrl).toBe('http://localhost:5000');
  });

  it('throws ConfigError listing every missing var', () => {
    try {
      loadConfig({});
      throw new Error('expected loadConfig to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigError);
      const msg = (err as ConfigError).message;
      expect(msg).toContain('LM_API_BASE_URL');
      expect(msg).toContain('LM_MCP_EMAIL');
      expect(msg).toContain('LM_MCP_PASSWORD');
    }
  });

  it('rejects a non-URL base URL', () => {
    expect(() => loadConfig({ ...base, LM_API_BASE_URL: 'not-a-url' })).toThrow(ConfigError);
  });

  it('adds a "finance" shared-auth backend when FIN_API_BASE_URL is set, needing no separate credentials', () => {
    const { sharedAuthBackends } = loadConfig({ ...base, FIN_API_BASE_URL: 'http://localhost:5002' });
    expect(sharedAuthBackends).toEqual([{ name: 'finance', baseUrl: 'http://localhost:5002' }]);
  });

  it('strips a trailing slash from FIN_API_BASE_URL too', () => {
    const { sharedAuthBackends } = loadConfig({ ...base, FIN_API_BASE_URL: 'http://localhost:5002/' });
    expect(sharedAuthBackends[0].baseUrl).toBe('http://localhost:5002');
  });

  it('rejects a non-URL FIN_API_BASE_URL', () => {
    expect(() => loadConfig({ ...base, FIN_API_BASE_URL: 'not-a-url' })).toThrow(ConfigError);
  });
});
