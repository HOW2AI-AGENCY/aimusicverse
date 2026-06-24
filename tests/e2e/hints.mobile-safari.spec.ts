/**
 * Mobile WebKit / Safari coverage for the hint card at 390×844 (iPhone 12/13).
 *
 * Pinned to webkit-based projects so these assertions exercise Safari's
 * layout engine specifically — that's where -webkit-fill-available, env()
 * safe-area math, and Mobile Safari's vh quirks differ from Chromium.
 */
import { test, expect, type Page, devices } from "@playwright/test";

const HINT_STORAGE_KEY = "mv:hints:v1";
const TEST_ID = "swipe-gesture";

// Run only on webkit/Mobile-Safari projects.
test.skip(({ browserName }) => browserName !== "webkit", "webkit-only suite");
test.use({ ...devices["iPhone 12"], viewport: { width: 390, height: 844 } });

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

async function showHint(page: Page) {
  await page.evaluate((id) => {
    const reg = (window as any).__hintRegistry;
    reg?.resetAll();
    reg?.request(id);
  }, TEST_ID);
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

async function getFixedFooterTop(page: Page): Promise<number> {
  return await page.evaluate(() => {
    const candidates = Array.from(document.querySelectorAll("*")) as HTMLElement[];
    const tops = candidates
      .filter((n) => {
        const cs = getComputedStyle(n);
        if (cs.position !== "fixed") return false;
        const r = n.getBoundingClientRect();
        return r.bottom <= window.innerHeight + 1 && r.top > 0 && r.height < 200;
      })
      .map((n) => n.getBoundingClientRect().top);
    return tops.length ? Math.min(...tops) : window.innerHeight;
  });
}

test("iPhone — card clears the bottom-nav (no player)", async ({ page }) => {
  await goHome(page);
  await setMiniPlayer(page, false);
  await showHint(page);
  const card = page.locator('[data-testid="unified-tip-card"]');
  await expect(card).toBeVisible({ timeout: 5000 });

  const cardBox = await card.boundingBox();
  const footerTop = await getFixedFooterTop(page);
  expect(cardBox).not.toBeNull();
  expect(cardBox!.y + cardBox!.height).toBeLessThanOrEqual(footerTop);
  // Stays inside the 390px viewport with proper gutter.
  expect(cardBox!.x).toBeGreaterThanOrEqual(8);
  expect(cardBox!.x + cardBox!.width).toBeLessThanOrEqual(390 - 8);
});

test("iPhone — card clears mini-player + bottom-nav", async ({ page }) => {
  await goHome(page);
  await setMiniPlayer(page, true);
  await showHint(page);
  const card = page.locator('[data-testid="unified-tip-card"]');
  await expect(card).toBeVisible({ timeout: 5000 });

  const cardBox = await card.boundingBox();
  const footerTop = await getFixedFooterTop(page);
  expect(cardBox).not.toBeNull();
  // Card must sit ABOVE the topmost fixed footer element (player or nav).
  expect(cardBox!.y + cardBox!.height).toBeLessThanOrEqual(footerTop);
});

test("iPhone — toggling the player relocates the card upward", async ({ page }) => {
  await goHome(page);
  await setMiniPlayer(page, false);
  await showHint(page);
  const card = page.locator('[data-testid="unified-tip-card"]');
  await expect(card).toBeVisible({ timeout: 5000 });
  const without = (await card.boundingBox())!.y;

  await setMiniPlayer(page, true);
  await page.waitForTimeout(150);
  const withPlayer = (await card.boundingBox())!.y;

  // Card moves UP (smaller y) when the player appears.
  expect(withPlayer).toBeLessThan(without);
});
