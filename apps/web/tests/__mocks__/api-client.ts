/**
 * Mock api-client for the Jest test environment.
 *
 * The real api-client uses `import.meta.env` which is not supported by Jest's
 * CommonJS runtime. This mock is loaded automatically via moduleNameMapper in
 * jest.config.cjs so that every test receives a safe stub without needing an
 * explicit `jest.mock()` call.
 *
 * Tests that need custom mock behaviour can still override with:
 *   jest.mock('../../src/services/api-client', () => ({ ... }));
 * The factory will take precedence over moduleNameMapper.
 */

export const apiClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  defaults: {
    headers: {
      common: {} as Record<string, string>,
    },
  },
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() },
  },
};

/**
 * Stub for getFullApiUrl — returns a predictable test URL.
 */
export const getFullApiUrl = (path: string): string =>
  `http://localhost:5000${path}`;
