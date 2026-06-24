/**
 * Extended E2E coverage for the unified hint system.
 *
 * These specs lean on the dev-only test hooks exposed on `window`:
 *   - window.__hintRegistry  (request/release/markSeen/resetAll, activeId)
 *   - window.__playerStore   (Zustand store; setState to fake activeTrack)
 *
 * Both hooks are gated by `import.meta.env.DEV` and disappear in production.
 *
 * The suite covers:
 *   1. Data-attribute assertions on the active card.
 *   2. Keyboard-focus dialog toggling -> hide / re-surface.
 *   3. Viewport resize across the 768px breakpoint -> position recompute.
 *   4. Cooldown enforcement when the same id is spammed.
 *   5. Sheet / Drawer / Vaul bottom-sheet open+close cycles.
 *   6. Visual regression for three player/dialog state combinations.
 */

import { test, expect, type Page } from "@playwright/test";

const HINT_STORAGE_KEY = "mv:hints:v1";
const COOLDOWN_MS = 1500;
const TEST_ID = "swipe-gesture"; // exists in HINT_REGISTRY

async function clearHints(page: Page) {
  await page.addInitScript((key) => {
    try {
      localStorage.removeItem(key);
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (k.startsWith("hint_seen_") || k.startsWith("onboarding_tip_")) {
          localStorage.removeItem(k);
        }
      }
    } catch {
      /* ignore */
    }
  }, HINT_STORAGE_KEY);
}

async function goHome(page: Page) {
  await clearHints(page);
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
  // Wait for the dev-only registry hook to be attached.
  await page.waitForFunction(() => Boolean((window as any).__hintRegistry), null, {
    timeout: 10_000,
  });
}

/** Force a specific hint to appear via the registry test hook. */
async function showHint(page: Page, id: string) {
  await page.evaluate((hintId) => {
    const reg = (window as any).__hintRegistry as
      | { request: (id: string) => boolean; resetAll: () => void }
      | undefined;
    reg?.resetAll();
    return reg?.request(hintId);
  }, id);
}

/** Toggle the fake mini-player in the Zustand store. */
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

/** Inject a Radix-style overlay element with arbitrary marker attributes. */
async function openOverlay(
  page: Page,
  role: "dialog" | "alertdialog",
  extraAttrs: Record<string, string> = {}
) {
  await page.evaluate(
    ({ role: r, extraAttrs: attrs }) => {
      const el = document.createElement("div");
      el.setAttribute("role", r);
      el.setAttribute("data-state", "open");
      el.id = "__overlay__";
      el.tabIndex = -1;
      el.style.position = "fixed";
      el.style.inset = "0";
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      document.body.appendChild(el);
      el.focus();
    },
    { role, extraAttrs }
  );
}

async function closeOverlay(page: Page) {
  await page.evaluate(() => {
    document.getElementById("__overlay__")?.remove();
  });
}

// ───────────────────────── 1. Data attributes + a11y ──────────────────────────

test.describe("Hints: card attributes & keyboard-driven dialogs", () => {
  test("active card has expected data + ARIA attributes", async ({ page }) => {
    await goHome(page);
    await showHint(page, TEST_ID);

    const card = page.locator('[data-testid="unified-tip-card"]');
    await expect(card).toBeVisible({ timeout: 5000 });
    await expect(card).toHaveAttribute("data-hint-id", TEST_ID);
    await expect(card).toHaveAttribute("role", "status");
    await expect(card).toHaveAttribute("aria-live", "polite");
  });

  test("dialog opened via keyboard hides the card, closing restores it", async ({
    page,
  }) => {
    await goHome(page);
    await showHint(page, TEST_ID);
    const card = page.locator('[data-testid="unified-tip-card"]');
    await expect(card).toBeVisible({ timeout: 5000 });

    // Open via keyboard: focus a button, simulate Enter -> inject overlay.
    await page.evaluate(() => {
      const btn = document.createElement("button");
      btn.id = "__trigger__";
      btn.textContent = "Open";
      btn.addEventListener("keydown", (e) => {
        if ((e as KeyboardEvent).key === "Enter") {
          const el = document.createElement("div");
          el.setAttribute("role", "dialog");
          el.setAttribute("data-state", "open");
          el.id = "__overlay__";
          el.tabIndex = -1;
          document.body.appendChild(el);
          el.focus();
        }
      });
      document.body.appendChild(btn);
      btn.focus();
    });
    await page.keyboard.press("Enter");
    await expect(card).toBeHidden({ timeout: 2000 });

    // Close via keyboard: Escape removes the overlay.
    await page.evaluate(() => {
      document.addEventListener(
        "keydown",
        (e) => {
          if (e.key === "Escape") {
            document.getElementById("__overlay__")?.remove();
          }
        },
        { once: true }
      );
    });
    await page.keyboard.press("Escape");

    // After the cooldown, re-request the same id to confirm registry recovers.
    await page.waitForTimeout(COOLDOWN_MS + 200);
    await showHint(page, TEST_ID);
    await expect(card).toBeVisible({ timeout: 3000 });
    await expect(card).toHaveAttribute("data-hint-id", TEST_ID);
  });
});

// ─────────────────────── 2. Viewport resize across 768px ──────────────────────

test.describe("Hints: position recomputes across the 768px breakpoint", () => {
  test("mobile -> desktop swap repositions the card", async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await goHome(page);
    await showHint(page, TEST_ID);

    const card = page.locator('[data-testid="unified-tip-card"]');
    await expect(card).toBeVisible({ timeout: 5000 });

    const mobileBox = await card.boundingBox();
    expect(mobileBox).not.toBeNull();
    // Mobile: spans the gutter (≈12px from each side), not pinned right.
    expect(mobileBox!.x).toBeLessThanOrEqual(20);
    expect(mobileBox!.width).toBeGreaterThan(300);

    await page.setViewportSize({ width: 1280, height: 800 });
    // Allow the matchMedia listener to flush.
    await page.waitForTimeout(200);

    const desktopBox = await card.boundingBox();
    expect(desktopBox).not.toBeNull();
    // Desktop: ≤480px wide, hugging the bottom-right edge.
    expect(desktopBox!.width).toBeLessThan(480);
    expect(desktopBox!.x + desktopBox!.width).toBeGreaterThan(1280 - 32);
  });

  test("mobile card never overlaps mini-player when the player is active", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await goHome(page);
    await setMiniPlayer(page, true);
    await showHint(page, TEST_ID);

    const card = page.locator('[data-testid="unified-tip-card"]');
    await expect(card).toBeVisible({ timeout: 5000 });

    const cardBox = await card.boundingBox();
    const playerTop = await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll("*")) as HTMLElement[];
      const tops = candidates
        .filter((n) => {
          const cs = getComputedStyle(n);
          if (cs.position !== "fixed") return false;
          const r = n.getBoundingClientRect();
          return r.top > 0 && r.bottom <= window.innerHeight && r.height < 200;
        })
        .map((n) => n.getBoundingClientRect().top);
      return tops.length ? Math.min(...tops) : window.innerHeight;
    });

    expect(cardBox).not.toBeNull();
    expect(cardBox!.y + cardBox!.height).toBeLessThanOrEqual(playerTop);
  });
});

// ──────────────────────── 3. Cooldown / spam protection ───────────────────────

test.describe("Hints: cooldown blocks rapid duplicates", () => {
  test("spamming request(id) only mounts one card and only re-shows after cooldown", async ({
    page,
  }) => {
    await goHome(page);

    // Fire 20 requests in a tight loop.
    const grants = await page.evaluate((id) => {
      const reg = (window as any).__hintRegistry as {
        request: (id: string) => boolean;
        release: (id: string) => void;
        resetAll: () => void;
      };
      reg.resetAll();
      const granted: boolean[] = [];
      for (let i = 0; i < 20; i++) granted.push(reg.request(id));
      return granted;
    }, TEST_ID);

    // Exactly one of the 20 should have been granted.
    expect(grants.filter(Boolean).length).toBe(1);
    const card = page.locator('[data-testid="unified-tip-card"]');
    await expect(card).toBeVisible({ timeout: 3000 });
    expect(await card.count()).toBe(1);

    // Release + immediately re-request -> blocked by cooldown.
    const immediate = await page.evaluate((id) => {
      const reg = (window as any).__hintRegistry;
      reg.release(id);
      return reg.request(id);
    }, TEST_ID);
    expect(immediate).toBe(false);

    // After the cooldown window, re-request succeeds.
    await page.waitForTimeout(COOLDOWN_MS + 200);
    const afterCooldown = await page.evaluate((id) => {
      const reg = (window as any).__hintRegistry;
      return reg.request(id);
    }, TEST_ID);
    expect(afterCooldown).toBe(true);
    await expect(card).toBeVisible();
    expect(await card.count()).toBe(1);
  });
});

// ──────────────────── 4. Sheet / Drawer / Vaul coverage ──────────────────────

const OVERLAY_VARIANTS = [
  { name: "Radix Sheet", role: "dialog" as const, attrs: { "data-radix-sheet": "" } },
  { name: "Radix Drawer", role: "dialog" as const, attrs: { "data-radix-drawer": "" } },
  { name: "Vaul bottom sheet", role: "dialog" as const, attrs: { "data-vaul-drawer": "" } },
  { name: "AlertDialog", role: "alertdialog" as const, attrs: {} },
];

for (const variant of OVERLAY_VARIANTS) {
  for (const width of [390, 1280]) {
    test(`${variant.name} hides + restores hint @${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 800 });
      await goHome(page);
      await showHint(page, TEST_ID);
      const card = page.locator('[data-testid="unified-tip-card"]');
      await expect(card).toBeVisible({ timeout: 5000 });

      await openOverlay(page, variant.role, variant.attrs);
      await expect(card).toBeHidden({ timeout: 2000 });

      await closeOverlay(page);
      await page.waitForTimeout(COOLDOWN_MS + 200);
      await showHint(page, TEST_ID);
      await expect(card).toBeVisible({ timeout: 3000 });
      // Never more than one card.
      expect(await card.count()).toBe(1);
    });
  }
}

// ────────────────────────── 5. Visual regression ──────────────────────────────

test.describe("Hints: visual regression", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  async function stabilize(page: Page) {
    // Freeze animations + waveforms for deterministic screenshots.
    await page.addStyleTag({
      content: `*,*::before,*::after{animation:none!important;transition:none!important}`,
    });
    await page.waitForTimeout(150);
  }

  test("no mini-player", async ({ page }) => {
    await goHome(page);
    await setMiniPlayer(page, false);
    await showHint(page, TEST_ID);
    const card = page.locator('[data-testid="unified-tip-card"]');
    await expect(card).toBeVisible({ timeout: 5000 });
    await stabilize(page);
    await expect(card).toHaveScreenshot("hint-no-player.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("mini-player active", async ({ page }) => {
    await goHome(page);
    await setMiniPlayer(page, true);
    await showHint(page, TEST_ID);
    const card = page.locator('[data-testid="unified-tip-card"]');
    await expect(card).toBeVisible({ timeout: 5000 });
    await stabilize(page);
    await expect(card).toHaveScreenshot("hint-with-player.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("mini-player active + open dialog → card hidden", async ({ page }) => {
    await goHome(page);
    await setMiniPlayer(page, true);
    await showHint(page, TEST_ID);
    const card = page.locator('[data-testid="unified-tip-card"]');
    await expect(card).toBeVisible({ timeout: 5000 });
    await openOverlay(page, "dialog");
    await expect(card).toBeHidden({ timeout: 2000 });
    await stabilize(page);
    // Snapshot the viewport to assert the card is gone while the player stays.
    await expect(page).toHaveScreenshot("hint-with-player-dialog.png", {
      fullPage: false,
      maxDiffPixelRatio: 0.02,
    });
  });
});
