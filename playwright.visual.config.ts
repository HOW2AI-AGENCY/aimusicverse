/**
 * Playwright config dedicated to visual regression tests (Home mobile+desktop).
 * Runs separately from the main e2e suite so baselines don't collide with it.
 *
 * Usage:
 *   npx playwright test -c playwright.visual.config.ts                 # verify
 *   npx playwright test -c playwright.visual.config.ts -u              # update baselines
 */
import { defineConfig, devices } from "@playwright/test";

const HOST = process.env.E2E_DEV_HOST || "127.0.0.1";
const PORT = process.env.E2E_DEV_PORT || "5173";
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || `http://${HOST}:${PORT}`;

export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["html", { outputFolder: "playwright-visual-report", open: "never" }], ["list"]],
  expect: {
    toHaveScreenshot: {
      // Small threshold — flag any meaningful layout drift.
      maxDiffPixelRatio: 0.002,
      animations: "disabled",
    },
  },
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
