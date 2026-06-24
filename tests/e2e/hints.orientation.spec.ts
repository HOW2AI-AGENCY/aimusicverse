/**
 * Orientation drift: card must reposition cleanly when the viewport
 * rotates between portrait and landscape at the same logical width.
 */
import { test, expect, type Page } from "@playwright/test";

const TEST_ID = "swipe-gesture";

async function boot(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.removeItem("mv:hints:v1");
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith("hint_seen_")) localStorage.removeItem(k);
      }
    } catch { /* ignore */ }
  });
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForFunction(() => Boolean((window as any).__hintRegistry), null, {
    timeout: 10_000,
  });
}

async function show(page: Page) {
  await page.evaluate((id) => {
    const reg = (window as any).__hintRegistry;
    reg?.resetAll();
    reg?.request(id);
  }, TEST_ID);
}

test("card does not drift across portrait → landscape → portrait", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await boot(page);
  await show(page);

  const card = page.locator('[data-testid="unified-tip-card"]');
  await expect(card).toBeVisible({ timeout: 5000 });
  const portraitA = await card.boundingBox();
  expect(portraitA).not.toBeNull();
  expect(portraitA!.x + portraitA!.width).toBeLessThanOrEqual(390);
  expect(portraitA!.y + portraitA!.height).toBeLessThanOrEqual(844);

  // Rotate to landscape (same device, swapped dimensions).
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(250); // allow layout/raf flush
  await expect(card).toBeVisible();
  const landscape = (await card.boundingBox())!;
  expect(landscape.x + landscape.width).toBeLessThanOrEqual(844);
  expect(landscape.y + landscape.height).toBeLessThanOrEqual(390);

  // Rotate back to portrait — must land within ≤2px of the original box.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  const portraitB = (await card.boundingBox())!;
  expect(Math.abs(portraitB.x - portraitA!.x)).toBeLessThanOrEqual(2);
  expect(Math.abs(portraitB.y - portraitA!.y)).toBeLessThanOrEqual(2);
  expect(Math.abs(portraitB.width - portraitA!.width)).toBeLessThanOrEqual(2);
  expect(Math.abs(portraitB.height - portraitA!.height)).toBeLessThanOrEqual(2);
});
