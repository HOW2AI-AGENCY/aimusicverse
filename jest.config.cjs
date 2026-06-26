/* global module */
/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: [
    "**/__tests__/**/*.test.ts",
    "**/__tests__/**/*.test.tsx",
    "**/tests/unit/**/*.test.ts",
    "**/tests/unit/**/*.test.tsx",
  ],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.app.json",
        diagnostics: { ignoreDiagnostics: [1343] },
        astTransformers: {
          before: [
            {
              path: "ts-jest-mock-import-meta",
              options: {
                metaObjectReplacement: {
                  env: {
                    VITE_SUPABASE_URL: "http://localhost:54321",
                    VITE_SUPABASE_ANON_KEY: "test-key",
                    MODE: "test",
                    DEV: true,
                    PROD: false,
                  },
                },
              },
            },
          ],
        },
      },
    ],
  },
  collectCoverageFrom: [
    "src/hooks/**/*.{ts,tsx}",
    "src/components/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.{ts,tsx}",
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};

module.exports = config;
