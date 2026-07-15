/**
 * Visual regression tests for key routes beyond Home/Library.
 * Full-page snapshots to catch layout/spinner/empty-state regressions.
 *
 * Run: npm run test:visual
 * Update: npm run test:visual:update
 */

import { test, expect } from "@playwright/test";

const ROUTES = [
  { path: "/generate", name: "generate-form" },
  { path: "/settings", name: "settings" },
] as const;

const MOBILE_VIEWPORT = { width: 375, height: 812 };
const DESKTOP_VIEWPORT = { width: 1280, height: 1800 };

for (const route of ROUTES) {
  test.describe(`${route.name}`, () => {
    test.use({ viewport: DESKTOP_VIEWPORT });

    test(`desktop @ ${route.path}`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => !!document.querySelector("main"), { timeout: 15000 });
      await page.waitForTimeout(500); // fonts + lazy load

      await expect.soft(page).toHaveScreenshot(`${route.name}-desktop.png`, {
        animations: "disabled",
        maxDiffPixelRatio: 0.02,
      });
    });
  });

  test.describe(`${route.name} mobile`, () => {
    test.use({ viewport: MOBILE_VIEWPORT });

    test(`mobile @ ${route.path}`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => !!document.querySelector("main"), { timeout: 15000 });
      await page.waitForTimeout(500);

      await expect.soft(page).toHaveScreenshot(`${route.name}-mobile.png`, {
        animations: "disabled",
        maxDiffPixelRatio: 0.02,
      });
    });
  });
}
