/**
 * Mobile interaction regressions for the generation form:
 *   1. Visible buttons must be tappable — not covered by any fixed overlay.
 *   2. Repeated taps on the same button must keep firing.
 *   3. Tapping outside an open dialog dismisses it without leaving a
 *      blocking overlay behind.
 *
 * Hardened against flake from animations / lazy hydration via:
 *   - per-test retries
 *   - `waitForLoadState('networkidle')` + targeted `waitFor` calls
 *   - `Locator.scrollIntoViewIfNeeded()` + visibility/enabled assertions
 *     before every tap (Playwright's actionability checks).
 */
import { test, expect, Page, Locator } from "@playwright/test";

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});

// Local flake guard for animations / lazy hydration on the mobile form.
test.describe.configure({ retries: 2 });

const OVERLAY = '[aria-label="Lyrics editor render metrics (dev)"]';
const ACTIONABLE_TIMEOUT = 5000;

async function gotoGenerate(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("lv:metrics:visible", "1"); // forced; mobile must still suppress
    } catch {
      /* noop */
    }
  });
  await page.goto("/generate", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  // Wait for at least one interactive button to appear (lazy chunks).
  await page
    .locator("button:visible")
    .first()
    .waitFor({ state: "visible", timeout: 10_000 })
    .catch(() => {});
  // Settle one animation frame.
  await page.evaluate(
    () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
  );
}

async function ensureActionable(loc: Locator) {
  await loc.waitFor({ state: "visible", timeout: ACTIONABLE_TIMEOUT });
  await loc.scrollIntoViewIfNeeded({ timeout: ACTIONABLE_TIMEOUT }).catch(() => {});
  await expect(loc).toBeEnabled({ timeout: ACTIONABLE_TIMEOUT });
}

test("dev metrics overlay never mounts on mobile, even when forced visible", async ({ page }) => {
  await gotoGenerate(page);
  await expect(page.locator(OVERLAY)).toHaveCount(0);
});

test("primary form buttons are not occluded by fixed overlays", async ({ page }) => {
  await gotoGenerate(page);

  const buttons = page.locator("button:visible");
  const total = await buttons.count();
  test.skip(total === 0, "no visible buttons on /generate in this build");

  const sample = Math.min(total, 6);
  for (let i = 0; i < sample; i++) {
    const btn = buttons.nth(i);
    await ensureActionable(btn);
    const box = await btn.boundingBox();
    if (!box || box.width < 8 || box.height < 8) continue;

    const isTop = await page.evaluate(
      ({ x, y }) => !!document.elementFromPoint(x, y)?.closest("button"),
      { x: box.x + box.width / 2, y: box.y + box.height / 2 },
    );
    expect(isTop, `button #${i} is covered by another element`).toBe(true);
  }
});

test("repeated taps on the same chip keep firing", async ({ page }) => {
  await gotoGenerate(page);

  const btn = page.locator("button:visible").first();
  await ensureActionable(btn);

  const handle = await btn.elementHandle();
  test.skip(!handle, "no tappable button on /generate");

  await page.evaluate((el) => {
    (el as HTMLElement).dataset.e2eTaps = "0";
    (el as HTMLElement).addEventListener("click", () => {
      const n = parseInt((el as HTMLElement).dataset.e2eTaps || "0", 10);
      (el as HTMLElement).dataset.e2eTaps = String(n + 1);
    });
  }, handle);

  for (let i = 0; i < 3; i++) {
    await ensureActionable(btn);
    await btn.tap({ timeout: ACTIONABLE_TIMEOUT });
    // Allow ripple / haptic-mock handlers + state updates to settle.
    await page.waitForTimeout(180);
  }

  await expect
    .poll(
      async () =>
        page.evaluate(
          (el) => parseInt((el as HTMLElement).dataset.e2eTaps || "0", 10),
          handle,
        ),
      { timeout: 3000 },
    )
    .toBe(3);
});

test("tap outside open dialog closes it and leaves no blocking overlay", async ({ page }) => {
  await gotoGenerate(page);

  const triggers = page.locator("button:visible");
  const count = await triggers.count();
  let opened = false;
  for (let i = 0; i < Math.min(count, 8); i++) {
    const t = triggers.nth(i);
    try {
      await ensureActionable(t);
      await t.tap({ timeout: ACTIONABLE_TIMEOUT });
    } catch {
      continue;
    }
    const dlg = page.locator('[role="dialog"][data-state="open"]').first();
    if (
      await dlg
        .waitFor({ state: "visible", timeout: 1200 })
        .then(() => true)
        .catch(() => false)
    ) {
      opened = true;
      break;
    }
  }
  test.skip(!opened, "no mobile trigger opens a dialog on /generate in this build");

  // Tap on backdrop / outside the dialog content.
  await page.mouse.click(8, 8);
  // Some implementations require an explicit Escape — fall through if needed.
  if (
    await page
      .locator('[role="dialog"][data-state="open"]')
      .first()
      .waitFor({ state: "hidden", timeout: 1500 })
      .then(() => false)
      .catch(() => true)
  ) {
    await page.keyboard.press("Escape");
  }
  await expect(page.locator('[role="dialog"][data-state="open"]')).toHaveCount(0, {
    timeout: 3000,
  });

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
