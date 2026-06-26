/**
 * IME composition regression:
 *   While the user is composing CJK / accented input inside a <textarea>,
 *   the Ctrl/Cmd+Shift+M hotkey must be a no-op AND the textarea value must
 *   accumulate normally (we don't preventDefault / clobber it).
 *
 * Playwright doesn't natively emulate the platform IME, so we drive the
 * spec via real CompositionEvents the same way the browser would for a
 * Japanese / Pinyin candidate window.
 */
import { test, expect, Page } from "@playwright/test";

const OVERLAY = '[aria-label="Lyrics editor render metrics (dev)"]';

async function prepare(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.removeItem("lv:metrics:visible");
    } catch {
      /* noop */
    }
  });
  await page.goto("/index", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    const ta = document.createElement("textarea");
    ta.id = "e2e-ime";
    ta.style.cssText =
      "position:fixed;top:8px;left:8px;width:240px;height:80px;z-index:99999;font:16px sans-serif";
    document.body.appendChild(ta);
    ta.focus();
  });
}

test.describe("IME composition does not trigger hotkey", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("composing inside textarea + hotkey keypress is a no-op", async ({ page }) => {
    await prepare(page);

    // Drive a realistic IME session: compositionstart → updates → end.
    await page.evaluate(() => {
      const ta = document.getElementById("e2e-ime") as HTMLTextAreaElement;
      ta.dispatchEvent(new CompositionEvent("compositionstart", { data: "" }));
      ta.dispatchEvent(new CompositionEvent("compositionupdate", { data: "に" }));
      ta.dispatchEvent(new CompositionEvent("compositionupdate", { data: "にほ" }));
    });

    // While composition is "active", fire the hotkey via a synthetic event
    // carrying isComposing=true (the only signal a browser would provide).
    const triggered = await page.evaluate(() => {
      const before = !!document.querySelector(
        '[aria-label="Lyrics editor render metrics (dev)"]',
      );
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
      const after = !!document.querySelector(
        '[aria-label="Lyrics editor render metrics (dev)"]',
      );
      return { before, after, defaultPrevented: ev.defaultPrevented };
    });
    expect(triggered.before).toBe(false);
    expect(triggered.after).toBe(false);
    expect(triggered.defaultPrevented).toBe(false);

    // Commit the composition — textarea must hold the composed value.
    await page.evaluate(() => {
      const ta = document.getElementById("e2e-ime") as HTMLTextAreaElement;
      ta.dispatchEvent(new CompositionEvent("compositionend", { data: "日本" }));
      ta.value = "日本";
      ta.dispatchEvent(new Event("input", { bubbles: true }));
    });

    const value = await page.locator("#e2e-ime").inputValue();
    expect(value).toBe("日本");
    await expect(page.locator(OVERLAY)).toHaveCount(0);
  });

  test("regular typing in textarea is not intercepted by hotkey handler", async ({ page }) => {
    await prepare(page);
    await page.locator("#e2e-ime").focus();
    await page.keyboard.type("hello world");
    // Even pressing the modifier combo while focus is in textarea: no-op.
    await page.keyboard.press("Control+Shift+M");
    await expect(page.locator(OVERLAY)).toHaveCount(0);
    expect(await page.locator("#e2e-ime").inputValue()).toBe("hello world");
  });
});
