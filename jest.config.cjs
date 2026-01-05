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
  // Coverage thresholds - focus on hook testing
  collectCoverageFrom: [
    'src/hooks/**/*.{ts,tsx}',
    '!src/hooks/**/*.test.{ts,tsx}',
    '!src/hooks/**/*.spec.{ts,tsx}',
    '!src/hooks/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
    './src/hooks/': {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
};
