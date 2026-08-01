import { test, expect } from "@playwright/test";

const BREAKPOINTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 1800 },
] as const;

test.describe("Generate visual regression", () => {
  for (const bp of BREAKPOINTS) {
    test(`generate @ ${bp.name} (${bp.width}x${bp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto("/generate", { waitUntil: "domcontentloaded" });

      await page.addStyleTag({
        content: `*, *::before, *::after {
          animation-duration: 0s !important; animation-delay: 0s !important;
          transition-duration: 0s !important; transition-delay: 0s !important;
        }`,
      });

      await page.waitForSelector('[data-testid="generate-form"], main', { timeout: 8000 });
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot(`generate-${bp.name}.png`, {
        fullPage: false,
        maxDiffPixelRatio: 0.002,
        animations: "disabled",
      });
    });
  }
});
