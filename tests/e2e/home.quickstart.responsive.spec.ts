import { test, expect, devices } from '@playwright/test';

const WIDTHS = [360, 390, 414, 480, 540, 640];

test.describe('Home — Quick Start tabs are not truncated (360–640px)', () => {
  for (const width of WIDTHS) {
    test(`renders "Быстрый старт" + Тексты/Треки/Проекты cleanly @${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/');

      // Header text is visible
      const header = page.getByText('Быстрый старт', { exact: true }).first();
      await expect(header).toBeVisible();

      const tablist = page.getByRole('tablist', { name: 'Категории шаблонов' });
      await expect(tablist).toBeVisible();

      // Each tab visible + not horizontally clipped
      for (const name of ['Тексты', 'Треки', 'Проекты']) {
        const tab = page.getByRole('tab', { name });
        await expect(tab).toBeVisible();
        const box = await tab.boundingBox();
        expect(box).not.toBeNull();
        if (box) {
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
        }
        // Label text node not visually truncated
        const overflow = await tab.evaluate((el) => {
          const span = el.querySelector('span:not(.hidden)') as HTMLElement | null;
          if (!span) return 0;
          return span.scrollWidth - span.clientWidth;
        });
        expect(overflow).toBeLessThanOrEqual(1);
      }

      // Two-row layout: header row above tablist row (stacked on mobile)
      const headerBox = await header.boundingBox();
      const tablistBox = await tablist.boundingBox();
      expect(headerBox).not.toBeNull();
      expect(tablistBox).not.toBeNull();
      if (headerBox && tablistBox) {
        expect(tablistBox.y).toBeGreaterThanOrEqual(headerBox.y + headerBox.height - 4);
      }
    });
  }
});
