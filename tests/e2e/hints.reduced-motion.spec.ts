/**
 * Hint card behavior with `prefers-reduced-motion: reduce`.
 *
 * Verifies that:
 *  - Animations on the card are disabled (no transform jitter on open/close).
 *  - The card's bounding box does not shift when an overlay opens/closes,
 *    i.e. it isn't "popping" via spring animations between states.
 */
import { test, expect, type Page } from "@playwright/test";

const HINT_STORAGE_KEY = "mv:hints:v1";
const TEST_ID = "swipe-gesture";

test.use({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });

async function prime(page: Page) {
  await page.addInitScript((key) => {
    try {
      localStorage.removeItem(key);
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith("hint_seen_")) localStorage.removeItem(k);
      }
    } catch {
      /* ignore */
    }
  }, HINT_STORAGE_KEY);
}

async function goHome(page: Page) {
  await prime(page);
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForFunction(() => Boolean((window as any).__hintRegistry), null, {
    timeout: 10_000,
  });
}

test("animation duration of the card is effectively zero", async ({ page }) => {
  await goHome(page);
  await page.evaluate((id) => {
    const reg = (window as any).__hintRegistry;
    reg?.resetAll();
    reg?.request(id);
  }, TEST_ID);
  const card = page.locator('[data-testid="unified-tip-card"]');
  await expect(card).toBeVisible({ timeout: 5000 });

  const longAnim = await card.evaluate((el) => {
    const cs = getComputedStyle(el);
    const durations = (cs.animationDuration + "," + cs.transitionDuration)
      .split(",")
      .map((s) => parseFloat(s.trim()) || 0);
    return Math.max(...durations);
  });
  // Framer Motion respects reduced-motion: durations should collapse to 0.
  expect(longAnim).toBeLessThan(0.05);
});

test("card doesn't jitter when a dialog opens and closes", async ({ page }) => {
  await goHome(page);
  await page.evaluate((id) => {
    const reg = (window as any).__hintRegistry;
    reg?.resetAll();
    reg?.request(id);
  }, TEST_ID);

  const card = page.locator('[data-testid="unified-tip-card"]');
  await expect(card).toBeVisible({ timeout: 5000 });
  const before = await card.boundingBox();
  expect(before).not.toBeNull();

  // Open a dialog -> card hides.
  await page.evaluate(() => {
    const el = document.createElement("div");
    el.setAttribute("role", "dialog");
    el.setAttribute("data-state", "open");
    el.id = "__overlay__";
    document.body.appendChild(el);
  });
  await expect(card).toBeHidden({ timeout: 1000 });

  // Close the dialog.
  await page.evaluate(() => document.getElementById("__overlay__")?.remove());

  // After cooldown re-show the same id; box must match the original.
  await page.waitForTimeout(1800);
  await page.evaluate((id) => {
    (window as any).__hintRegistry.request(id);
  }, TEST_ID);
  await expect(card).toBeVisible({ timeout: 2000 });
  const after = await card.boundingBox();
  expect(after).not.toBeNull();

  // ≤2px tolerance for sub-pixel rounding across browsers.
  expect(Math.abs(after!.x - before!.x)).toBeLessThanOrEqual(2);
  expect(Math.abs(after!.y - before!.y)).toBeLessThanOrEqual(2);
  expect(Math.abs(after!.width - before!.width)).toBeLessThanOrEqual(2);
  expect(Math.abs(after!.height - before!.height)).toBeLessThanOrEqual(2);
});
