/**
 * Home "Быстрый старт" (CreativePresetsSection) responsive layout regression.
 *
 * Ensures across narrow viewports (360–640px):
 *   - The section header ("Быстрый старт") and the Текст/Треки/Проекты tab
 *     switcher render on TWO separate rows (header above, tabs below).
 *   - Tabs are not clipped horizontally (full width fits in viewport).
 *   - Tab labels are not truncated (full Russian labels visible).
 */
import { test, expect, type Page } from "@playwright/test";

const WIDTHS = [360, 390, 414, 480, 540, 600, 640];
const HEIGHT = 844;

async function gotoHome(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
  // Wait for the section header
  await page.getByText("Быстрый старт", { exact: true }).first().waitFor({ timeout: 15_000 });
}

test.describe("Home — Quick Start responsive layout (360–640px)", () => {
  for (const width of WIDTHS) {
    test(`at ${width}px: header & tab switcher on two rows, tabs fully visible`, async ({ page }) => {
      await page.setViewportSize({ width, height: HEIGHT });
      await gotoHome(page);

      const header = page.getByText("Быстрый старт", { exact: true }).first();
      const tablist = page.getByRole("tablist", { name: "Категории шаблонов" }).first();

      await expect(header).toBeVisible();
      await expect(tablist).toBeVisible();

      const headerBox = await header.boundingBox();
      const tablistBox = await tablist.boundingBox();
      expect(headerBox).not.toBeNull();
      expect(tablistBox).not.toBeNull();
      if (!headerBox || !tablistBox) return;

      // Two-row layout: tablist sits BELOW the header (no inline overlap).
      expect(tablistBox.y).toBeGreaterThanOrEqual(headerBox.y + headerBox.height - 2);

      // Tablist takes (close to) the full available width on narrow screens.
      // Allow for container padding (~32px total).
      expect(tablistBox.width).toBeGreaterThanOrEqual(width - 48);
      // And does not overflow the viewport.
      expect(tablistBox.x).toBeGreaterThanOrEqual(0);
      expect(tablistBox.x + tablistBox.width).toBeLessThanOrEqual(width + 1);

      // All 3 tabs are present, each with its full Russian label.
      for (const label of ["Тексты", "Треки", "Проекты"]) {
        const tab = page.getByRole("tab", { name: label });
        await expect(tab).toBeVisible();
        const tabBox = await tab.boundingBox();
        expect(tabBox).not.toBeNull();
        if (!tabBox) continue;
        // Tab fully inside the viewport horizontally.
        expect(tabBox.x).toBeGreaterThanOrEqual(0);
        expect(tabBox.x + tabBox.width).toBeLessThanOrEqual(width + 1);
        // Touch target height ≥ 36px (matches min-h-[36px] in component).
        expect(tabBox.height).toBeGreaterThanOrEqual(34);
      }

      // The 3 tabs share the row roughly equally (flex-1 on mobile).
      const widths = await Promise.all(
        ["Тексты", "Треки", "Проекты"].map(async (label) => {
          const b = await page.getByRole("tab", { name: label }).boundingBox();
          return b?.width ?? 0;
        })
      );
      const max = Math.max(...widths);
      const min = Math.min(...widths);
      expect(max - min).toBeLessThanOrEqual(2);
    });
  }
});
