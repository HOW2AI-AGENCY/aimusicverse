/**
 * Hard guarantee: even if `lv:metrics:visible` is forced to "1" in
 * localStorage, the dev overlay must NEVER block or steal a tap on mobile.
 *
 * Strategy — works regardless of whether the overlay actually mounted:
 *   1. Force-enable + reload on a mobile viewport.
 *   2. Plant a deterministic button in the overlay's pinned corner
 *      (bottom:16px, right:16px, 260×~80px area) and verify a tap on its
 *      centre actually reaches the button (click counter increments).
 *   3. Sample the same screen coordinates with elementFromPoint — the
 *      topmost element must NOT carry the overlay's aria-label.
 */
import { test, expect } from "@playwright/test";

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});

test.describe.configure({ retries: 1 });

test("forced-visible dev overlay is never interactive on mobile", async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("lv:metrics:visible", "1");
      localStorage.setItem("lv:metrics:collapsed", "0");
    } catch {
      /* noop */
    }
  });
  await page.goto("/index", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});

  // 1. Overlay element must not be in the DOM at all on mobile.
  await expect(
    page.locator('[aria-label="Lyrics editor render metrics (dev)"]'),
  ).toHaveCount(0);

  // 2. Plant a probe button exactly where the overlay would pin itself.
  await page.evaluate(() => {
    const btn = document.createElement("button");
    btn.id = "e2e-probe";
    btn.type = "button";
    btn.textContent = "probe";
    btn.dataset.clicks = "0";
    btn.style.cssText = [
      "position:fixed",
      "right:16px",
      "bottom:16px",
      "width:260px",
      "height:120px",
      "z-index:1", // intentionally low — overlay (z=9999) would normally win
      "background:#0f0",
    ].join(";");
    btn.addEventListener("click", () => {
      btn.dataset.clicks = String(parseInt(btn.dataset.clicks || "0", 10) + 1);
    });
    document.body.appendChild(btn);
  });

  const probe = page.locator("#e2e-probe");
  await expect(probe).toBeVisible();

  // 3. Tap centre of the probe — must register every time.
  for (let i = 0; i < 3; i++) {
    await probe.tap();
    await page.waitForTimeout(80);
  }
  await expect
    .poll(async () =>
      probe.evaluate((el) => parseInt((el as HTMLElement).dataset.clicks || "0", 10)),
    )
    .toBe(3);

  // 4. elementFromPoint at probe centre must be the probe, not an overlay.
  const top = await page.evaluate(() => {
    const r = document.getElementById("e2e-probe")!.getBoundingClientRect();
    const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return {
      id: el?.id ?? null,
      aria: el?.getAttribute?.("aria-label") ?? null,
      inOverlay: !!el?.closest('[aria-label="Lyrics editor render metrics (dev)"]'),
    };
  });
  expect(top.inOverlay).toBe(false);
  expect(top.id).toBe("e2e-probe");
});
