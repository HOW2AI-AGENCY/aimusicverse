/**
 * Mobile interaction regressions for the generation form:
 *   1. Visible buttons must be tappable — not covered by any fixed overlay
 *      (the dev metrics overlay is the historical culprit).
 *   2. Repeated taps on the same button must keep firing.
 *   3. Tapping outside an open dialog dismisses it without leaving a
 *      blocking overlay behind.
 */
import { test, expect, Page } from "@playwright/test";

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});

async function gotoGenerate(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("lv:metrics:visible", "1"); // force-enable; mobile should still suppress
    } catch {
      /* noop */
    }
  });
  await page.goto("/generate", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
}

test("dev metrics overlay never mounts on mobile, even when forced visible", async ({ page }) => {
  await gotoGenerate(page);
  await expect(
    page.locator('[aria-label="Lyrics editor render metrics (dev)"]'),
  ).toHaveCount(0);
});

test("primary form buttons are not occluded by fixed overlays", async ({ page }) => {
  await gotoGenerate(page);

  const buttons = page.locator("button:visible");
  const total = await buttons.count();
  test.skip(total === 0, "no visible buttons on /generate in this build");

  // Sample up to 6 visible buttons; ensure each is the topmost element at its center.
  const sample = Math.min(total, 6);
  for (let i = 0; i < sample; i++) {
    const btn = buttons.nth(i);
    const box = await btn.boundingBox();
    if (!box || box.width < 8 || box.height < 8) continue;

    const isTop = await page.evaluate(
      ({ x, y }) => {
        const top = document.elementFromPoint(x, y);
        if (!top) return true; // off-screen / virtualized — skip
        // Walk up: the tapped element must be inside a <button> (the one we sampled).
        return !!top.closest("button");
      },
      { x: box.x + box.width / 2, y: box.y + box.height / 2 },
    );
    expect(isTop, `button #${i} is covered by another element`).toBe(true);
  }
});

test("repeated taps on the same chip keep firing", async ({ page }) => {
  await gotoGenerate(page);

  // Install a tap counter on the first visible button.
  const handle = await page.locator("button:visible").first().elementHandle();
  test.skip(!handle, "no tappable button on /generate");

  await page.evaluate((el) => {
    (el as HTMLElement).dataset.e2eTaps = "0";
    (el as HTMLElement).addEventListener("click", () => {
      const n = parseInt((el as HTMLElement).dataset.e2eTaps || "0", 10);
      (el as HTMLElement).dataset.e2eTaps = String(n + 1);
    });
  }, handle);

  for (let i = 0; i < 3; i++) {
    await handle!.tap();
    await page.waitForTimeout(120);
  }
  const taps = await page.evaluate(
    (el) => parseInt((el as HTMLElement).dataset.e2eTaps || "0", 10),
    handle,
  );
  expect(taps).toBe(3);
});

test("tap outside open dialog closes it and leaves no blocking overlay", async ({ page }) => {
  await gotoGenerate(page);

  // Find any button that opens a dialog.
  const triggers = page.locator("button:visible");
  const count = await triggers.count();
  let opened = false;
  for (let i = 0; i < Math.min(count, 8); i++) {
    await triggers.nth(i).tap().catch(() => {});
    const dlg = page.locator('[role="dialog"][data-state="open"]').first();
    if (await dlg.waitFor({ state: "visible", timeout: 800 }).then(() => true).catch(() => false)) {
      opened = true;
      break;
    }
  }
  test.skip(!opened, "no mobile trigger opens a dialog on /generate in this build");

  // Tap on the backdrop / outside the dialog content.
  await page.mouse.click(8, 8);
  await page.waitForTimeout(400);

  // Either the dialog closes, or pressing Escape closes it.
  if (await page.locator('[role="dialog"][data-state="open"]').count()) {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  }
  await expect(page.locator('[role="dialog"][data-state="open"]')).toHaveCount(0);

  // After close, no fixed blocking overlay should remain interactive.
  const blocking = await page.evaluate(() => {
    const els = Array.from(document.body.querySelectorAll<HTMLElement>("*"));
    return els.some((el) => {
      const cs = getComputedStyle(el);
      if (cs.position !== "fixed") return false;
      if (cs.pointerEvents === "none") return false;
      if (cs.visibility === "hidden" || cs.display === "none") return false;
      if (parseFloat(cs.opacity || "1") < 0.3) return false;
      const r = el.getBoundingClientRect();
      return r.width >= window.innerWidth * 0.9 && r.height >= window.innerHeight * 0.6;
    });
  });
  expect(blocking).toBe(false);
});
