import '@testing-library/jest-dom';

// Mock import.meta for Vite environment variables
(global as any).import = {
  meta: {
    env: {
      VITE_API_URL: 'http://localhost:5000',
      MODE: 'test',
      DEV: false,
      PROD: false,
      SSR: false,
    },
  },
};

// Also set it on globalThis for better compatibility
(globalThis as any).import = (global as any).import;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
