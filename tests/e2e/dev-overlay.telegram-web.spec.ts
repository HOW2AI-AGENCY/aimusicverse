/**
 * Telegram Web hotkey parity:
 *   - Ctrl+Shift+M and Cmd+Shift+M both toggle the dev overlay identically.
 *   - Plain modifier keys / lone "m" / Ctrl+M (without Shift) do NOT trigger,
 *     so we don't collide with Telegram Web's own shortcuts (Ctrl+M minimises
 *     the current chat on Telegram Web).
 *
 * Runs under desktop emulation only — Telegram Web is a desktop surface and
 * the overlay is suppressed on touch viewports by design.
 */
import { test, expect, Page } from "@playwright/test";

const OVERLAY = '[aria-label="Lyrics editor render metrics (dev)"]';

async function freshGoto(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.removeItem("lv:metrics:visible");
    } catch {
      /* noop */
    }
  });
  await page.goto("/index", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  await page.waitForTimeout(300);
}

test.describe("Hotkey parity — Telegram Web (desktop emulation)", () => {
  test.use({ viewport: { width: 1366, height: 768 } });

  test("Control+Shift+M toggles the overlay", async ({ page }) => {
    await freshGoto(page);
    await expect(page.locator(OVERLAY)).toHaveCount(0);
    await page.keyboard.press("Control+Shift+M");
    await expect(page.locator(OVERLAY)).toBeVisible();
    await page.keyboard.press("Control+Shift+M");
    await expect(page.locator(OVERLAY)).toHaveCount(0);
  });

  test("Meta+Shift+M toggles the overlay (macOS Telegram Web)", async ({ page }) => {
    await freshGoto(page);
    await page.keyboard.press("Meta+Shift+M");
    await expect(page.locator(OVERLAY)).toBeVisible();
    await page.keyboard.press("Meta+Shift+M");
    await expect(page.locator(OVERLAY)).toHaveCount(0);
  });

  test("does NOT trigger on shortcuts that Telegram Web owns", async ({ page }) => {
    await freshGoto(page);
    // Ctrl+M alone is "minimise chat" on Telegram Web — must not toggle us.
    await page.keyboard.press("Control+M");
    await expect(page.locator(OVERLAY)).toHaveCount(0);
    // Lone "m" — should never toggle.
    await page.keyboard.press("m");
    await expect(page.locator(OVERLAY)).toHaveCount(0);
    // Shift+M alone — should never toggle.
    await page.keyboard.press("Shift+M");
    await expect(page.locator(OVERLAY)).toHaveCount(0);
  });
});
