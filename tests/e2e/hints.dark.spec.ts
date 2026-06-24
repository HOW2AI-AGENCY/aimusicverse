/**
 * Hint card — visual regression in Dark Mode.
 *
 * Forces dark theme via localStorage (project uses key 'musicverse-theme') and
 * sets `<html class="dark">` to short-circuit any system-preference logic.
 */
import { test, expect, type Page } from "@playwright/test";

const HINT_STORAGE_KEY = "mv:hints:v1";
const TEST_ID = "swipe-gesture";

async function prime(page: Page) {
  await page.addInitScript((key) => {
    try {
      localStorage.removeItem(key);
      localStorage.setItem("musicverse-theme", "dark");
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && (k.startsWith("hint_seen_") || k.startsWith("onboarding_tip_"))) {
          localStorage.removeItem(k);
        }
      }
    } catch {
      /* ignore */
    }
  }, HINT_STORAGE_KEY);
  await page.emulateMedia({ colorScheme: "dark" });
}

async function goHome(page: Page) {
  await prime(page);
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.waitForFunction(() => Boolean((window as any).__hintRegistry), null, {
    timeout: 10_000,
  });
}

async function showHint(page: Page, id: string) {
  await page.evaluate((hintId) => {
    const reg = (window as any).__hintRegistry;
    reg?.resetAll();
    reg?.request(hintId);
  }, id);
}

async function setMiniPlayer(page: Page, on: boolean) {
  await page.evaluate((enabled) => {
    const store = (window as any).__playerStore;
    if (!store) return;
    store.setState(
      enabled
        ? {
            activeTrack: {
              id: "test-track",
              title: "Test",
              user_id: "u",
              status: "completed",
              audio_url: "https://example.com/a.mp3",
              cover_url: null,
              created_at: new Date().toISOString(),
            },
          }
        : { activeTrack: null }
    );
  }, on);
}

async function openDialog(page: Page) {
  await page.evaluate(() => {
    const el = document.createElement("div");
    el.setAttribute("role", "dialog");
    el.setAttribute("data-state", "open");
    el.id = "__overlay__";
    document.body.appendChild(el);
  });
}

async function stabilize(page: Page) {
  await page.addStyleTag({
    content: `*,*::before,*::after{animation:none!important;transition:none!important}`,
  });
  await page.waitForTimeout(150);
}

test.describe("Hints: dark-mode visual regression", () => {
  test.use({ viewport: { width: 390, height: 844 }, colorScheme: "dark" });

  test("dark / no mini-player", async ({ page }) => {
    await goHome(page);
    await setMiniPlayer(page, false);
    await showHint(page, TEST_ID);
    const card = page.locator('[data-testid="unified-tip-card"]');
    await expect(card).toBeVisible({ timeout: 5000 });
    await stabilize(page);
    await expect(card).toHaveScreenshot("hint-dark-no-player.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("dark / mini-player active", async ({ page }) => {
    await goHome(page);
    await setMiniPlayer(page, true);
    await showHint(page, TEST_ID);
    const card = page.locator('[data-testid="unified-tip-card"]');
    await expect(card).toBeVisible({ timeout: 5000 });
    await stabilize(page);
    await expect(card).toHaveScreenshot("hint-dark-with-player.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("dark / mini-player + open dialog → card hidden", async ({ page }) => {
    await goHome(page);
    await setMiniPlayer(page, true);
    await showHint(page, TEST_ID);
    const card = page.locator('[data-testid="unified-tip-card"]');
    await expect(card).toBeVisible({ timeout: 5000 });
    await openDialog(page);
    await expect(card).toBeHidden({ timeout: 2000 });
    await stabilize(page);
    await expect(page).toHaveScreenshot("hint-dark-with-player-dialog.png", {
      fullPage: false,
      maxDiffPixelRatio: 0.02,
    });
  });
});
