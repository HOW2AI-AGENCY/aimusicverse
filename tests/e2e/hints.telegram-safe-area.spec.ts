/**
 * Telegram Mini App safe-area: the card must honour
 * `--tg-safe-area-inset-bottom` (and the `env(safe-area-inset-bottom)`
 * fallback) on devices with a notch / home indicator.
 *
 * We simulate the Telegram WebApp by injecting the same CSS variables
 * that `@twa-dev/sdk` writes to the root element on iPhone X+ devices.
 */
import { test, expect, type Page } from "@playwright/test";

const TEST_ID = "swipe-gesture";
const TG_INSET_BOTTOM = 34; // iPhone home-indicator height in CSS px.
const TG_INSET_TOP = 47;

test.use({ viewport: { width: 390, height: 844 } });

async function boot(page: Page) {
  await page.addInitScript(
    ({ top, bottom }) => {
      try {
        localStorage.removeItem("mv:hints:v1");
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && k.startsWith("hint_seen_")) localStorage.removeItem(k);
        }
      } catch { /* ignore */ }

      // Inject Telegram safe-area variables before app boot so the layout
      // engine sees them on first paint.
      const style = document.createElement("style");
      style.id = "__tg_safe_area__";
      style.textContent = `
        :root {
          --tg-safe-area-inset-top: ${top}px;
          --tg-safe-area-inset-bottom: ${bottom}px;
          --tg-content-safe-area-inset-top: ${top}px;
          --tg-content-safe-area-inset-bottom: ${bottom}px;
          --tg-viewport-height: 100vh;
        }
      `;
      document.documentElement.appendChild(style);
    },
    { top: TG_INSET_TOP, bottom: TG_INSET_BOTTOM }
  );
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

test("card bottom respects Telegram safe-area inset (notch device)", async ({ page }) => {
  await boot(page);
  await show(page);

  const card = page.locator('[data-testid="unified-tip-card"]');
  await expect(card).toBeVisible({ timeout: 5000 });

  const box = (await card.boundingBox())!;
  const viewportHeight = page.viewportSize()!.height;

  // The card's bottom edge must sit above the home-indicator zone.
  // Allow ≤2px sub-pixel rounding.
  expect(box.y + box.height, "card bottom must clear TG safe-area").toBeLessThanOrEqual(
    viewportHeight - TG_INSET_BOTTOM + 2
  );
});

test("card lifts further when both mini-player and safe-area apply", async ({ page }) => {
  await boot(page);
  await show(page);
  const card = page.locator('[data-testid="unified-tip-card"]');
  await expect(card).toBeVisible({ timeout: 5000 });
  const baselineTop = (await card.boundingBox())!.y;

  // Activate the mini-player.
  await page.evaluate(() => {
    const store = (window as any).__playerStore;
    store?.setState({
      activeTrack: {
        id: "t",
        title: "T",
        user_id: "u",
        status: "completed",
        audio_url: "https://example.com/a.mp3",
        cover_url: null,
        created_at: new Date().toISOString(),
      },
    });
  });
  await page.waitForTimeout(200);
  const liftedTop = (await card.boundingBox())!.y;

  expect(liftedTop, "card must move UP when player appears").toBeLessThan(baselineTop);
  // And the bottom edge still respects the safe-area.
  const lifted = (await card.boundingBox())!;
  expect(lifted.y + lifted.height).toBeLessThanOrEqual(
    page.viewportSize()!.height - TG_INSET_BOTTOM + 2
  );
});
