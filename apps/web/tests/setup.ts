import '@testing-library/jest-dom';

// Set environment variables for test environment
// (api-client is auto-mocked via moduleNameMapper in jest.config.cjs,
//  but other code that reads process.env will use these values)
process.env.VITE_API_URL = 'http://localhost:5000';
process.env.NODE_ENV = 'test';

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
