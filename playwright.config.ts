import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright Configuration for Browser Testing
 *
 * Tests storage, CDN, and critical user flows across multiple browsers
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests/e2e",

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,

  /* Resolve base URL once so every project + the dev server agree on host/port. */
  /* Priority: PLAYWRIGHT_BASE_URL → E2E_DEV_HOST/PORT → localhost:5173 */
  /* (Exported as a const below so webServer.url stays in sync.) */

  /* Reporter to use — HTML report is always emitted so CI can publish it as an artifact. */
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["list"],
    ["json", { outputFile: "test-results/results.json" }],
    ...(process.env.CI ? [["github"] as ["github"]] : []),
  ],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL:
      process.env.PLAYWRIGHT_BASE_URL ||
      `http://${process.env.E2E_DEV_HOST || "127.0.0.1"}:${process.env.E2E_DEV_PORT || "5173"}`,

    /* Collect trace when retrying the failed test */
    trace: "on-first-retry",

    /* Screenshot on failure */
    screenshot: "only-on-failure",

    /* Video on failure */
    video: "retain-on-failure",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
      },
    },

    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 1920, height: 1080 },
      },
    },

    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1920, height: 1080 },
      },
    },

    /* Test against mobile viewports */
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },

    /* Test against branded browsers */
    {
      name: "Microsoft Edge",
      use: {
        ...devices["Desktop Edge"],
        channel: "msedge",
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: "Google Chrome",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: `npm run dev -- --host ${process.env.E2E_DEV_HOST || "127.0.0.1"} --port ${process.env.E2E_DEV_PORT || "5173"} --strictPort`,
    url:
      process.env.PLAYWRIGHT_BASE_URL ||
      `http://${process.env.E2E_DEV_HOST || "127.0.0.1"}:${process.env.E2E_DEV_PORT || "5173"}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
