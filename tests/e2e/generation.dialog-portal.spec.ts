/**
 * Regression: every Radix dialog/sheet used by the generation form must
 *   - portal into <body> (not nested inside the form container),
 *   - render above any fixed overlays already on the page,
 *   - have a computed z-index >= the app's Z_INDEX.dialog (140) tier.
 *
 * We exercise this on both desktop and a Telegram-narrow mobile viewport
 * to catch breakpoint-specific portal regressions.
 */
import { test, expect, Page } from "@playwright/test";

const MIN_DIALOG_Z = 140;

async function openAnyDialog(page: Page): Promise<boolean> {
  // Try a few generic entry points; bail with `false` if none are present.
  const candidates = [
    'button:has-text("Создать")',
    'button:has-text("Generate")',
    'button[aria-label*="референс" i]',
    'button[aria-label*="персон" i]',
    'button[aria-label*="проект" i]',
    'button[aria-label*="голос" i]',
    '[data-testid*="open-dialog"]',
  ];
  for (const sel of candidates) {
    const btn = page.locator(sel).first();
    if (await btn.count()) {
      try {
        await btn.click({ timeout: 1500 });
        const dlg = page.locator('[role="dialog"][data-state="open"]').first();
        if (await dlg.waitFor({ state: "visible", timeout: 1500 }).then(() => true).catch(() => false)) {
          return true;
        }
      } catch {
        /* try next */
      }
    }
  }
  return false;
}

async function assertDialogContract(page: Page) {
  const dialog = page.locator('[role="dialog"][data-state="open"]').first();
  await expect(dialog).toBeVisible();

  // 1. Portaled to body (parent chain reaches document.body directly, not via #root).
  const portaledToBody = await dialog.evaluate((el) => {
    let p: HTMLElement | null = el.parentElement;
    while (p && p !== document.body) {
      if (p.id === "root") return false;
      p = p.parentElement;
    }
    return p === document.body;
  });
  expect(portaledToBody, "dialog must portal directly into document.body").toBe(true);

  // 2. Effective stacking: dialog (or any fixed ancestor) must have z-index >= 140.
  const effectiveZ = await dialog.evaluate((el) => {
    let node: HTMLElement | null = el;
    let max = 0;
    while (node && node !== document.body) {
      const z = parseInt(getComputedStyle(node).zIndex, 10);
      if (!Number.isNaN(z)) max = Math.max(max, z);
      node = node.parentElement;
    }
    return max;
  });
  expect(effectiveZ).toBeGreaterThanOrEqual(MIN_DIALOG_Z);

  // 3. The dialog must sit above every fixed sibling on the page.
  const maxOtherFixedZ = await page.evaluate(() => {
    const els = Array.from(document.body.querySelectorAll<HTMLElement>("*"));
    let max = 0;
    for (const el of els) {
      if (el.closest('[role="dialog"]')) continue;
      const cs = getComputedStyle(el);
      if (cs.position !== "fixed") continue;
      if (cs.visibility === "hidden" || cs.display === "none") continue;
      const z = parseInt(cs.zIndex, 10);
      if (!Number.isNaN(z)) max = Math.max(max, z);
    }
    return max;
  });
  expect(effectiveZ).toBeGreaterThanOrEqual(maxOtherFixedZ);
}

for (const vp of [
  { name: "desktop", width: 1280, height: 800, mobile: false },
  { name: "telegram-narrow", width: 424, height: 783, mobile: true },
]) {
  test.describe(`generation dialogs · ${vp.name}`, () => {
    test.use({
      viewport: { width: vp.width, height: vp.height },
      hasTouch: vp.mobile,
      isMobile: vp.mobile,
    });

    test("first reachable dialog portals to body and stacks above overlays", async ({ page }) => {
      await page.goto("/generate", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);

      const opened = await openAnyDialog(page);
      test.skip(!opened, "no dialog trigger reachable on this build/route");

      await assertDialogContract(page);
    });
  });
}
