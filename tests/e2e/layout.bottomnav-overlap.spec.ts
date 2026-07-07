import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
];

test.describe('Home — BottomNav and CompactPlayer do not overlap content', () => {
  for (const vp of VIEWPORTS) {
    test(`last section is above BottomNav @${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      // Wait for layout to settle
      await page.waitForLoadState('domcontentloaded').catch(() => {});

      // Scroll the main scroll container to the bottom
      await page.evaluate(() => {
        const main = document.getElementById('main-content');
        if (main) main.scrollTop = main.scrollHeight;
      });
      await page.waitForTimeout(300);

      const nav = page.locator('[data-testid="bottom-navigation"], nav[aria-label*="навигаци" i]').first();
      await expect(nav).toBeVisible();
      const navBox = await nav.boundingBox();
      expect(navBox).not.toBeNull();
      if (!navBox) return;

      // Pick the visually last in-flow content block in main and assert its
      // bottom does not get covered by the dock.
      const lastBottom = await page.evaluate(() => {
        const main = document.getElementById('main-content');
        if (!main) return null;
        let lowest = 0;
        main.querySelectorAll('section, [data-section], .home-section, footer').forEach((el) => {
          const r = (el as HTMLElement).getBoundingClientRect();
          if (r.height > 0 && r.bottom > lowest) lowest = r.bottom;
        });
        return lowest;
      });
      expect(lastBottom).not.toBeNull();
      if (lastBottom !== null && lastBottom > 0) {
        // Allow a 4px fudge for sub-pixel rounding.
        expect(lastBottom).toBeLessThanOrEqual(navBox.y + 4);
      }
    });
  }
});
