/**
 * Visual regression tests for the Home screen (mobile + desktop breakpoints).
 *
 * Baselines live in `tests/visual/home.spec.ts-snapshots/` and are compared with
 * a 0.2% pixel diff threshold. To (re-)generate baselines locally after an
 * intentional change, run:
 *   npx playwright test tests/visual/home.spec.ts --update-snapshots
 * CI runs this suite headless on chromium and fails on any diff.
 */
import { test, expect } from "@playwright/test";

const BREAKPOINTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 1800 },
] as const;

test.describe("Home visual regression", () => {
  for (const bp of BREAKPOINTS) {
    test(`home @ ${bp.name} (${bp.width}x${bp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto("/", { waitUntil: "domcontentloaded" });

      // Freeze animations & disable motion for a stable snapshot.
      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
          }
        `,
      });

      // Wait for the hero (guest or authed) to render before snapshotting.
      await page.waitForSelector('[aria-label="Быстрое создание трека"], main, [data-testid="home-hero"]', {
        timeout: 8000,
      });
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot(`home-${bp.name}.png`, {
        fullPage: false,
        maxDiffPixelRatio: 0.002,
        animations: "disabled",
      });
    });
  }
});
