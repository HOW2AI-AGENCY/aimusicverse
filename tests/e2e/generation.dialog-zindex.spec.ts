/**
 * Visual + computed-stacking confirmation that an open dialog/sheet renders
 * ABOVE every other fixed overlay on both desktop and mobile.
 *
 * Strategy:
 *   1. Inject a deterministic full-viewport "decoy" fixed overlay with a
 *      high z-index (200, brightly coloured) AFTER the page has loaded.
 *   2. Open any reachable dialog on /generate.
 *   3. Sample the centre of the dialog with elementFromPoint — the topmost
 *      element must be inside the dialog, not the decoy.
 *   4. Screenshot the dialog area; the decoy colour must NOT dominate the
 *      sampled pixels (visual confirmation, no golden image needed).
 */
import { test, expect, Page } from "@playwright/test";

const DECOY_RGB = { r: 255, g: 0, b: 128 }; // hot magenta — unlikely in UI

async function injectDecoyOverlay(page: Page) {
  await page.evaluate(
    ({ r, g, b }) => {
      const div = document.createElement("div");
      div.id = "e2e-decoy-overlay";
      div.style.cssText = [
        "position:fixed",
        "inset:0",
        `background:rgba(${r},${g},${b},0.95)`,
        "z-index:200", // above Z_INDEX.dropdown but BELOW Z_INDEX.dialog (140)? No: 200 > 140.
        "pointer-events:none", // don't block our own clicks while opening dialogs
      ].join(";");
      document.body.appendChild(div);
    },
    DECOY_RGB,
  );
}

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
      const ok = await dlg
        .waitFor({ state: "visible", timeout: 1500 })
        .then(() => true)
        .catch(() => false);
      if (ok) return true;
    } catch {
      /* try next */
    }
  }
  return false;
}

function near(a: number, b: number, tol = 40) {
  return Math.abs(a - b) <= tol;
}

for (const vp of [
  { name: "desktop", width: 1280, height: 800, mobile: false },
  { name: "mobile", width: 390, height: 844, mobile: true },
]) {
  test.describe(`dialog z-index above decoy overlay · ${vp.name}`, () => {
    test.use({
      viewport: { width: vp.width, height: vp.height },
      hasTouch: vp.mobile,
      isMobile: vp.mobile,
    });

    test("dialog wins both computed stacking and pixel sampling", async ({ page }) => {
      await page.goto("/generate", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(1000);

      const opened = await openAnyDialog(page);
      test.skip(!opened, "no reachable dialog trigger on /generate");

      // Now inject the decoy — AFTER the dialog opened, to simulate a rogue
      // fixed overlay that mounted later.
      await injectDecoyOverlay(page);
      await page.waitForTimeout(150);

      const dialog = page.locator('[role="dialog"][data-state="open"]').first();
      await expect(dialog).toBeVisible();

      // Computed: dialog effective z-index >= decoy (200).
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
      expect(effectiveZ).toBeGreaterThanOrEqual(200);

      // Stacking: centre of dialog must hit dialog content, not the decoy.
      const topAtCenter = await dialog.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return {
          id: top?.id ?? null,
          inDialog: !!top?.closest('[role="dialog"]'),
        };
      });
      expect(topAtCenter.inDialog).toBe(true);
      expect(topAtCenter.id).not.toBe("e2e-decoy-overlay");

      // Visual: screenshot the dialog and ensure the decoy magenta is not
      // the dominant colour (it would be if the decoy painted on top).
      const buf = await dialog.screenshot();
      // Cheap PNG sampling: count pixels close to DECOY_RGB by decoding via
      // page-side <canvas> instead of pulling a PNG decoder into the test.
      const dominantMatch = await page.evaluate(
        async ({ base64, decoy }) => {
          const img = new Image();
          await new Promise<void>((res, rej) => {
            img.onload = () => res();
            img.onerror = rej;
            img.src = "data:image/png;base64," + base64;
          });
          const c = document.createElement("canvas");
          c.width = img.naturalWidth;
          c.height = img.naturalHeight;
          const ctx = c.getContext("2d")!;
          ctx.drawImage(img, 0, 0);
          const { data } = ctx.getImageData(0, 0, c.width, c.height);
          let hits = 0;
          const total = data.length / 4;
          for (let i = 0; i < data.length; i += 4) {
            if (
              Math.abs(data[i] - decoy.r) <= 30 &&
              Math.abs(data[i + 1] - decoy.g) <= 30 &&
              Math.abs(data[i + 2] - decoy.b) <= 30
            ) {
              hits++;
            }
          }
          return hits / total;
        },
        { base64: buf.toString("base64"), decoy: DECOY_RGB },
      );
      // Even with a translucent decoy bleeding through, <5% of dialog pixels
      // should match the decoy colour if stacking is correct.
      expect(dominantMatch).toBeLessThan(0.05);
      void near; // (kept for future tolerance helpers)
    });
  });
}
