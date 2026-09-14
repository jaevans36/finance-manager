import type { AppConfig } from '../../config.js';
import { buildBackends } from '../registry.js';

const life = {
  name: 'life',
  baseUrl: 'http://localhost:5000',
  email: 'jay@example.com',
  password: 'secret',
  userAgent: 'LifeManager-MCP/1.0',
};

describe('buildBackends', () => {
  it('builds only "life" when there are no shared-auth backends configured', () => {
    const config: AppConfig = { life, sharedAuthBackends: [] };
    const backends = buildBackends(config);
    expect(Object.keys(backends)).toEqual(['life']);
  });

  it('builds a "finance" backend sharing the "life" auth manager', () => {
    const config: AppConfig = {
      life,
      sharedAuthBackends: [{ name: 'finance', baseUrl: 'http://localhost:5002' }],
    };
    const backends = buildBackends(config);
    expect(Object.keys(backends)).toEqual(['life', 'finance']);
    expect(backends.finance.auth).toBe(backends.life.auth);
    expect(backends.finance.http.defaults.baseURL).toBe('http://localhost:5002');
  });
});
