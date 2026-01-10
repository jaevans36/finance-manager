import '@testing-library/jest-dom';

// Mock import.meta for Vite environment variables
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: {
        VITE_API_URL: 'http://localhost:5000',
        MODE: 'test',
        DEV: false,
        PROD: false,
        SSR: false,
      },
    },
  },
  writable: true,
});
