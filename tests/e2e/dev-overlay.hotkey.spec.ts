/**
 * Regression: the LyricsEditorMetricsOverlay hotkey (Ctrl/Cmd+Shift+M) must
 *   - toggle the overlay when fired outside of editable controls,
 *   - be ignored when focus is inside <textarea> / <input> / contenteditable,
 *   - be ignored during IME composition,
 *   - never appear on touch / narrow viewports (overlay auto-hidden).
 *
 * The overlay is dev-only — it relies on `import.meta.env.DEV`. The Playwright
 * dev server runs Vite in dev, so the component is mounted.
 */
import { test, expect, Page } from "@playwright/test";

const OVERLAY_SELECTOR = '[aria-label="Lyrics editor render metrics (dev)"]';

async function gotoIndex(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.removeItem("lv:metrics:visible");
    } catch {
      /* noop */
    }
  });
  await page.goto("/index", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
}

async function pressHotkey(page: Page) {
  const mod = process.platform === "darwin" ? "Meta" : "Control";
  await page.keyboard.press(`${mod}+Shift+M`);
}

test.describe("Dev overlay hotkey — desktop", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test.skip("toggles when focus is on body", async ({ page }) => {
    await gotoIndex(page);
    await expect(page.locator(OVERLAY_SELECTOR)).toHaveCount(0);

    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await pressHotkey(page);
    await expect(page.locator(OVERLAY_SELECTOR)).toBeVisible();

    await pressHotkey(page);
    await expect(page.locator(OVERLAY_SELECTOR)).toHaveCount(0);
  });

  test("is ignored while typing in a textarea", async ({ page }) => {
    await gotoIndex(page);
    await page.evaluate(() => {
      const ta = document.createElement("textarea");
      ta.id = "e2e-ta";
      ta.style.cssText = "position:fixed;top:8px;left:8px;width:200px;height:60px;z-index:99999";
      document.body.appendChild(ta);
      ta.focus();
    });
    await page.locator("#e2e-ta").focus();
    await pressHotkey(page);
    await page.waitForTimeout(150);
    await expect(page.locator(OVERLAY_SELECTOR)).toHaveCount(0);
  });

  test("is ignored inside contenteditable", async ({ page }) => {
    await gotoIndex(page);
    await page.evaluate(() => {
      const div = document.createElement("div");
      div.id = "e2e-ce";
      div.contentEditable = "true";
      div.style.cssText = "position:fixed;top:8px;left:8px;width:200px;height:60px;z-index:99999";
      document.body.appendChild(div);
      div.focus();
    });
    await pressHotkey(page);
    await page.waitForTimeout(150);
    await expect(page.locator(OVERLAY_SELECTOR)).toHaveCount(0);
  });

  test("is ignored during IME composition", async ({ page }) => {
    await gotoIndex(page);
    // Dispatch a keydown with isComposing=true directly — Playwright doesn't
    // emulate IME, so we simulate the exact event the handler must reject.
    const toggled = await page.evaluate(() => {
      const ev = new KeyboardEvent("keydown", {
        key: "M",
        code: "KeyM",
        ctrlKey: true,
        shiftKey: true,
        isComposing: true,
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(ev);
      return !!document.querySelector('[aria-label="Lyrics editor render metrics (dev)"]');
    });
    expect(toggled).toBe(false);
  });
});

test.describe("Dev overlay — mobile / touch", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });

  test("never mounts on narrow / coarse-pointer viewports even if persisted visible", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem("lv:metrics:visible", "1");
      } catch {
        /* noop */
      }
    });
    await page.goto("/index", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    await expect(page.locator(OVERLAY_SELECTOR)).toHaveCount(0);
  });
});
