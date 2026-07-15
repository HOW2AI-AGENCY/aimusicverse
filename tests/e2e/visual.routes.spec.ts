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
  { path: "/artists", name: "artists" },
  { path: "/blog", name: "blog" },
  { path: "/playlists", name: "playlists" },
  { path: "/pricing", name: "pricing" },
  { path: "/templates", name: "templates" },
  { path: "/voices", name: "voices" },
  { path: "/rewards", name: "rewards" },
  { path: "/terms", name: "terms" },
  { path: "/music-graph", name: "music-graph" },
] as const;

const MOBILE_VIEWPORT = { width: 375, height: 812 };
const DESKTOP_VIEWPORT = { width: 1280, height: 1800 };

for (const route of ROUTES) {
  test.describe(`${route.name}`, () => {
    test.use({ viewport: DESKTOP_VIEWPORT });

    test(`desktop @ ${route.path}`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "load" });
      await page.waitForTimeout(800); // fonts + lazy load + query settling

      await expect.soft(page).toHaveScreenshot(`${route.name}-desktop.png`, {
        animations: "disabled",
        maxDiffPixelRatio: 0.02,
      });
    });
  });

  test.describe(`${route.name} mobile`, () => {
    test.use({ viewport: MOBILE_VIEWPORT });

    test(`mobile @ ${route.path}`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "load" });
      await page.waitForTimeout(800); // fonts + lazy load + query settling

      await expect.soft(page).toHaveScreenshot(`${route.name}-mobile.png`, {
        animations: "disabled",
        maxDiffPixelRatio: 0.02,
      });
    });
  });
}
