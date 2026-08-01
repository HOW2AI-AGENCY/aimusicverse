import { test, expect } from "@playwright/test";

const BREAKPOINTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 1800 },
] as const;

test.describe("Studio visual regression", () => {
  for (const bp of BREAKPOINTS) {
    test(`studio @ ${bp.name} (${bp.width}x${bp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto("/studio-v2/unified", { waitUntil: "domcontentloaded" });

      await page.addStyleTag({
        content: `*, *::before, *::after {
          animation-duration: 0s !important; animation-delay: 0s !important;
          transition-duration: 0s !important; transition-delay: 0s !important;
        }`,
      });

      await page.waitForSelector('[data-testid="studio-content"], main', { timeout: 8000 });
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot(`studio-${bp.name}.png`, {
        fullPage: false,
        maxDiffPixelRatio: 0.002,
        animations: "disabled",
      });
    });
  }
});
