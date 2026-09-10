import { ConfigError, loadConfig } from '../config.js';

const base = {
  LM_API_BASE_URL: 'http://localhost:5000',
  LM_MCP_EMAIL: 'jay@example.com',
  LM_MCP_PASSWORD: 'secret',
};

describe('loadConfig', () => {
  it('builds a single "life" backend from the LM_* vars', () => {
    const { backends } = loadConfig(base);
    expect(backends).toHaveLength(1);
    expect(backends[0]).toMatchObject({
      name: 'life',
      baseUrl: 'http://localhost:5000',
      email: 'jay@example.com',
      password: 'secret',
      userAgent: 'LifeManager-MCP/1.0',
    });
  });

  it('honours a custom LM_MCP_USER_AGENT', () => {
    const { backends } = loadConfig({ ...base, LM_MCP_USER_AGENT: 'Custom/9' });
    expect(backends[0].userAgent).toBe('Custom/9');
  });

  it('strips a trailing slash from the base URL', () => {
    const { backends } = loadConfig({ ...base, LM_API_BASE_URL: 'http://localhost:5000/' });
    expect(backends[0].baseUrl).toBe('http://localhost:5000');
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
});
