/* eslint-env node */
/* eslint-disable no-undef */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  testPathIgnorePatterns: ['/node_modules/', 'tests/e2e/'],
  moduleNameMapper: {
    '^@/lib/logger$': '<rootDir>/tests/__mocks__/logger.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
    // Allow ESM-style relative imports without explicit .js extension when running tests
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.app.json',
        useESM: true,
      },
    ],
  },
  // Property-based testing configuration for analytics
  testMatch: [
    '**/__tests__/**/*.(test|spec).[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
    '**/tests/**/*.(test|spec).[jt]s?(x)',
  ],
  // Increase timeout for property-based tests
  testTimeout: 10000,
};
