/**
 * Jest config for @life-manager/mcp.
 *
 * Source is authored as ESM (package.json "type": "module", tsconfig "module": "Node16",
 * relative imports carry a ".js" suffix). Tests run under CommonJS: ts-jest transpiles each
 * file with "module": "CommonJS", and the moduleNameMapper below strips the ".js" suffix from
 * relative import specifiers so they resolve to the ".ts" source. This works because no module
 * under test imports the MCP SDK (which is ESM-only) — the SDK is only touched by the four
 * glue files (src/tools/index.ts, src/resources/index.ts, src/tools/_register.ts, src/index.ts),
 * which are covered by the manual inspector run, not unit tests.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'CommonJS',
          moduleResolution: 'node',
          verbatimModuleSyntax: false,
          types: ['jest', 'node'],
        },
      },
    ],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  clearMocks: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/__tests__/**',
    '!src/index.ts',
    '!src/tools/index.ts',
    '!src/resources/index.ts',
    '!src/tools/_register.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};
