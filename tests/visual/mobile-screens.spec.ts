/**
 * Mobile visual + accessibility regression for key screens.
 *
 * Captures full-page mobile snapshots at 320×640 and 375×720 to catch text
 * truncation / overflow, and runs axe-core to catch focus & ARIA regressions.
 *
 * Baselines: tests/visual/mobile-screens.spec.ts-snapshots/
 * Update:    npx playwright test -c playwright.visual.config.ts tests/visual/mobile-screens.spec.ts -u
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const ROUTES = [
  { name: "home", path: "/" },
  { name: "library", path: "/library" },
  { name: "projects", path: "/projects" },
  { name: "community", path: "/community" },
  { name: "profile", path: "/profile" },
] as const;

const VIEWPORTS = [
  { name: "xs", width: 320, height: 640 },
  { name: "sm", width: 375, height: 720 },
] as const;

const FREEZE_ANIM_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }
`;

test.describe("Mobile visual regression — key screens", () => {
  for (const vp of VIEWPORTS) {
    for (const route of ROUTES) {
      test(`${route.name} @ ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(route.path, { waitUntil: "domcontentloaded" });
        await page.addStyleTag({ content: FREEZE_ANIM_CSS });
        await page.waitForSelector("main, [role='main'], body", { timeout: 8000 });
        await page.waitForTimeout(400);

        await expect(page).toHaveScreenshot(`${route.name}-${vp.name}.png`, {
          fullPage: true,
          maxDiffPixelRatio: 0.005,
          animations: "disabled",
        });

        // Detect horizontal overflow (a common source of text clipping on mobile).
        const overflowX = await page.evaluate(() => {
          const doc = document.documentElement;
          return doc.scrollWidth - doc.clientWidth;
        });
        expect(overflowX, `horizontal overflow on ${route.name} @ ${vp.name}`).toBeLessThanOrEqual(1);
      });
    }
  }
});

test.describe("Mobile accessibility — key screens", () => {
  for (const route of ROUTES) {
    test(`${route.name} a11y @ 375x720`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 720 });
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(400);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        // Focus on rules most relevant to CTA/focus/ARIA regressions on mobile.
        .include("body")
        .analyze();

      const critical = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
      expect.soft(critical, `axe violations on ${route.name}: ${JSON.stringify(critical.map((v) => v.id))}`).toEqual([]);
    });
  }
});
