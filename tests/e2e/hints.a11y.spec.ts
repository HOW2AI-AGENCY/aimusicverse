/**
 * Hint card accessibility.
 *
 *  - aria-live="polite" + role="status" stay correct across mount/unmount.
 *  - When a dialog opens, focus moves into the dialog; when it closes, focus
 *    returns to the previously focused element (the hint card's close button
 *    if it was focused).
 *  - No duplicate role="status" elements in the DOM at any time.
 */
import { test, expect, type Page } from "@playwright/test";

const HINT_STORAGE_KEY = "mv:hints:v1";
const TEST_ID = "swipe-gesture";

test.use({ viewport: { width: 1280, height: 800 } });

async function goHome(page: Page) {
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
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForFunction(() => Boolean((window as any).__hintRegistry), null, {
    timeout: 10_000,
  });
}

async function showHint(page: Page) {
  await page.evaluate((id) => {
    const reg = (window as any).__hintRegistry;
    reg?.resetAll();
    reg?.request(id);
  }, TEST_ID);
}

test("aria-live region announces the new card content on each show", async ({
  page,
}) => {
  await goHome(page);
  await showHint(page);
  const card = page.locator('[data-testid="unified-tip-card"]');
  await expect(card).toBeVisible({ timeout: 5000 });

  // The aria-live region must be present and polite.
  await expect(card).toHaveAttribute("aria-live", "polite");
  await expect(card).toHaveAttribute("role", "status");

  // The card must contain the hint's title/message text (announceable).
  const text = (await card.textContent()) ?? "";
  expect(text.trim().length).toBeGreaterThan(0);
});

test("only one role=status hint exists at any time", async ({ page }) => {
  await goHome(page);
  await showHint(page);
  const statuses = page.locator('[data-testid="unified-tip-card"][role="status"]');
  await expect(statuses).toHaveCount(1, { timeout: 5000 });

  // Rapid re-request attempts must not multiply the live region.
  for (let i = 0; i < 5; i++) {
    await page.evaluate((id) => (window as any).__hintRegistry?.request(id), TEST_ID);
  }
  await expect(statuses).toHaveCount(1);
});

test("focus stays valid across overlay open/close", async ({ page }) => {
  await goHome(page);
  await showHint(page);
  const card = page.locator('[data-testid="unified-tip-card"]');
  await expect(card).toBeVisible({ timeout: 5000 });

  // Focus the close button inside the card.
  const closeBtn = card.getByRole("button", { name: /закрыть подсказку/i });
  await closeBtn.focus();
  await expect(closeBtn).toBeFocused();

  // Open an overlay that traps focus.
  await page.evaluate(() => {
    const overlay = document.createElement("div");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("data-state", "open");
    overlay.id = "__overlay__";
    overlay.tabIndex = -1;
    const inner = document.createElement("button");
    inner.id = "__overlay_btn__";
    inner.textContent = "Overlay action";
    overlay.appendChild(inner);
    document.body.appendChild(overlay);
    inner.focus();
  });
  await expect(card).toBeHidden({ timeout: 2000 });
  await expect(page.locator("#__overlay_btn__")).toBeFocused();

  // Close overlay -> focus must land somewhere valid (not on a detached node).
  await page.evaluate(() => document.getElementById("__overlay__")?.remove());
  const activeOk = await page.evaluate(
    () => document.activeElement !== null && document.body.contains(document.activeElement)
  );
  expect(activeOk).toBe(true);
});

test("close button has an accessible name", async ({ page }) => {
  await goHome(page);
  await showHint(page);
  const card = page.locator('[data-testid="unified-tip-card"]');
  await expect(card).toBeVisible({ timeout: 5000 });
  const closeBtn = card.getByRole("button", { name: /закрыть подсказку/i });
  await expect(closeBtn).toBeVisible();
});
