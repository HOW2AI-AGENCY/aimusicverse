/**
 * Visual regression for shared Section + key cards.
 *
 * Two layers of protection:
 *  1. Pixel snapshot per section/card via `toHaveScreenshot`
 *     (baselines live under tests/e2e/visual.section.spec.ts-snapshots/).
 *  2. Brightness assertion — average luminance of each Section surface
 *     must stay BELOW a threshold (dark/neutral theme). Catches the
 *     "too bright" regression without waiting for a human to eyeball
 *     screenshots.
 *
 * Run locally:
 *   npm run test:visual
 *   npm run test:visual:update    # refresh baselines after intentional change
 */
import { test, expect, type Page } from "@playwright/test";

const ROUTES_WITH_SECTIONS = ["/", "/library"];

// Average luminance threshold (0..1). Anything brighter = saturated wash regression.
// Tuned for the dark theme: real surfaces sit around 0.05..0.18.
const MAX_AVG_LUMINANCE = 0.32;

async function waitForApp(page: Page) {
  await page.waitForFunction(() => !!document.querySelector("main"), { timeout: 15_000 });
  // Allow fonts + cards to settle so screenshots are stable.
  await page.waitForTimeout(500);
}

async function avgLuminance(page: Page, selector: string): Promise<number | null> {
  const handle = await page.$(selector);
  if (!handle) return null;
  const buf = await handle.screenshot({ type: "png" });
  // Decode via the page so we don't need a node image lib.
  return page.evaluate(async (b64: string) => {
    const img = new Image();
    img.src = "data:image/png;base64," + b64;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = Math.min(img.width, 200);
    canvas.height = Math.min(img.height, 200);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let sum = 0;
    const px = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b2 = data[i + 2] / 255;
      sum += 0.2126 * r + 0.7152 * g + 0.0722 * b2;
    }
    return sum / px;
  }, buf.toString("base64"));
}

test.describe("Visual regression — Section + cards", () => {
  test.use({ viewport: { width: 1280, height: 1800 } });

  for (const route of ROUTES_WITH_SECTIONS) {
    test(`route ${route}: no oversaturated Section surfaces`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await waitForApp(page);

      const sections = page.locator("[data-section-id]");
      const count = await sections.count();
      if (count === 0) {
        test.info().annotations.push({ type: "skip", description: `no <Section> on ${route}` });
        return;
      }

      for (let i = 0; i < Math.min(count, 6); i++) {
        const sec = sections.nth(i);
        const id = (await sec.getAttribute("data-section-id")) ?? `idx-${i}`;
        const tone = (await sec.getAttribute("data-tone")) ?? "plain";

        const lum = await avgLuminance(page, `[data-section-id="${id}"]`);
        if (lum !== null) {
          expect
            .soft(lum, `Section "${id}" (tone=${tone}) too bright: avg luminance ${lum.toFixed(3)} > ${MAX_AVG_LUMINANCE}`)
            .toBeLessThan(MAX_AVG_LUMINANCE);
        }

        // Pixel snapshot — small maxDiffPixelRatio so tiny font AA shifts pass
        // but a color/gradient regression fails loudly.
        await expect.soft(sec).toHaveScreenshot(`${route.replace(/\W+/g, "_")}__section-${id}.png`, {
          maxDiffPixelRatio: 0.02,
          animations: "disabled",
        });
      }
    });
  }
});
