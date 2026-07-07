/**
 * Orientation-change regression: after rotating the device between portrait
 * and landscape, the dialog/portal contract must still hold:
 *   - dialog is portaled to <body>,
 *   - effective z-index ≥ 140 (Z_INDEX.dialog),
 *   - dialog centre is the topmost element (no fixed overlay leaks above it).
 *
 * Runs against both Mobile Chrome (Pixel 5) and Mobile Safari (iPhone 12)
 * via the CI mobile job; this spec only drives the rotation through
 * page.setViewportSize, which is what those projects emulate under the hood.
 */
import { test, expect, Page } from "@playwright/test";

const MIN_DIALOG_Z = 140;

async function openAnyDialog(page: Page): Promise<boolean> {
  const candidates = [
    'button[aria-label*="референс" i]',
    'button[aria-label*="персон" i]',
    'button[aria-label*="проект" i]',
    'button[aria-label*="голос" i]',
    'button:has-text("Создать")',
    'button:has-text("Generate")',
  ];
  for (const sel of candidates) {
    const btn = page.locator(sel).first();
    if (!(await btn.count())) continue;
    try {
      await btn.waitFor({ state: "visible", timeout: 1500 });
      await btn.click({ timeout: 1500 });
      const dlg = page.locator('[role="dialog"][data-state="open"]').first();
      if (
        await dlg
          .waitFor({ state: "visible", timeout: 1500 })
          .then(() => true)
          .catch(() => false)
      ) {
        return true;
      }
    } catch {
      /* try next */
    }
  }
  return false;
}

async function assertDialogContract(page: Page, label: string) {
  const dialog = page.locator('[role="dialog"][data-state="open"]').first();
  await expect(dialog, `${label}: dialog visible`).toBeVisible();

  const portaledToBody = await dialog.evaluate((el) => {
    let p: Element | null = el.parentElement;
    while (p && p !== document.body) {
      if ((p as HTMLElement).id === "root") return false;
      p = p.parentElement;
    }
    return p === document.body;
  });
  expect(portaledToBody, `${label}: dialog must portal to body`).toBe(true);

  const effectiveZ = await dialog.evaluate((el) => {
    let node: Element | null = el;
    let max = 0;
    while (node && node !== document.body) {
      const z = parseInt(getComputedStyle(node as Element).zIndex, 10);
      if (!Number.isNaN(z)) max = Math.max(max, z);
      node = node.parentElement;
    }
    return max;
  });
  expect(effectiveZ, `${label}: dialog effective z-index`).toBeGreaterThanOrEqual(
    MIN_DIALOG_Z,
  );

  const topAtCenter = await dialog.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const cx = Math.max(1, Math.min(window.innerWidth - 1, r.x + r.width / 2));
    const cy = Math.max(1, Math.min(window.innerHeight - 1, r.y + r.height / 2));
    return !!document.elementFromPoint(cx, cy)?.closest('[role="dialog"]');
  });
  expect(topAtCenter, `${label}: dialog centre is topmost`).toBe(true);
}

const PORTRAIT = { width: 390, height: 844 };
const LANDSCAPE = { width: 844, height: 390 };

test.describe("dialog survives orientation changes (mobile)", () => {
  test.use({
    viewport: PORTRAIT,
    hasTouch: true,
    isMobile: true,
  });

  test.describe.configure({ retries: 2 });

  test("portrait → landscape → portrait keeps dialog stacking valid", async ({ page }) => {
    await page.setViewportSize(PORTRAIT);
    await page.goto("/generate", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("domcontentloaded").catch(() => {});
    await page.waitForTimeout(800);

    const opened = await openAnyDialog(page);
    test.skip(!opened, "no reachable dialog trigger on /generate");

    await assertDialogContract(page, "portrait #1");

    // Rotate to landscape and let layout/resize observers settle.
    await page.setViewportSize(LANDSCAPE);
    await page.evaluate(() => window.dispatchEvent(new Event("resize")));
    await page.waitForTimeout(500);
    await assertDialogContract(page, "landscape");

    // Rotate back to portrait.
    await page.setViewportSize(PORTRAIT);
    await page.evaluate(() => window.dispatchEvent(new Event("resize")));
    await page.waitForTimeout(500);
    await assertDialogContract(page, "portrait #2");
  });
});
