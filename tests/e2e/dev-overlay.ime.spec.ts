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

  test("composing inside textarea + hotkey keypress is a no-op (multi-char, paused)", async ({
    page,
  }) => {
    await prepare(page);

    // Simulate a realistic multi-character IME session with pauses, firing
    // the hotkey both on compositionupdate AND right before compositionend.
    const phases = ["に", "にほ", "にほん", "にほんご"];
    for (const data of phases) {
      const phaseResult = await page.evaluate((d) => {
        const ta = document.getElementById("e2e-ime") as HTMLTextAreaElement;
        if (d === "に") {
          ta.dispatchEvent(new CompositionEvent("compositionstart", { data: "" }));
        }
        ta.dispatchEvent(new CompositionEvent("compositionupdate", { data: d }));
        // Fire the hotkey under isComposing=true → MUST be ignored.
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
        return {
          overlayMounted: !!document.querySelector(
            '[aria-label="Lyrics editor render metrics (dev)"]',
          ),
          defaultPrevented: ev.defaultPrevented,
        };
      }, data);
      expect(
        phaseResult.overlayMounted,
        `overlay must stay hidden on compositionupdate "${data}"`,
      ).toBe(false);
      expect(phaseResult.defaultPrevented).toBe(false);
      // Human-like pause between candidate updates.
      await page.waitForTimeout(80);
    }

    // Fire one more hotkey immediately BEFORE compositionend (still composing).
    const beforeEnd = await page.evaluate(() => {
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
      return !!document.querySelector(
        '[aria-label="Lyrics editor render metrics (dev)"]',
      );
    });
    expect(beforeEnd).toBe(false);

    // End composition and commit the value.
    await page.evaluate(() => {
      const ta = document.getElementById("e2e-ime") as HTMLTextAreaElement;
      ta.dispatchEvent(new CompositionEvent("compositionend", { data: "日本語" }));
      ta.value = "日本語";
      ta.dispatchEvent(new Event("input", { bubbles: true }));
    });

    // Hotkey fired RIGHT AFTER compositionend but with focus still inside the
    // textarea — handler's "focus is in textarea" guard must still block it.
    await page.locator("#e2e-ime").focus();
    await page.keyboard.press("Control+Shift+M");
    await expect(page.locator(OVERLAY)).toHaveCount(0);

    expect(await page.locator("#e2e-ime").inputValue()).toBe("日本語");
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
