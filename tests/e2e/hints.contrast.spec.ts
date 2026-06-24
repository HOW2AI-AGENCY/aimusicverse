/**
 * WCAG contrast check for UnifiedTipCard in Dark Mode.
 *
 * Computes the effective foreground vs background color of every visible
 * text/icon node inside the card and asserts a minimum contrast ratio per
 * WCAG 2.1: ≥4.5:1 for normal text, ≥3:1 for large text (≥18pt or ≥14pt
 * bold) and for graphical objects (icons).
 */
import { test, expect, type Page } from "@playwright/test";

const TEST_ID = "swipe-gesture";

test.use({ colorScheme: "dark", viewport: { width: 390, height: 844 } });

async function goHome(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("musicverse-theme", "dark");
      localStorage.removeItem("mv:hints:v1");
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith("hint_seen_")) localStorage.removeItem(k);
      }
    } catch { /* ignore */ }
  });
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.waitForFunction(() => Boolean((window as any).__hintRegistry), null, {
    timeout: 10_000,
  });
  await page.evaluate((id) => {
    const reg = (window as any).__hintRegistry;
    reg?.resetAll();
    reg?.request(id);
  }, TEST_ID);
}

test("UnifiedTipCard meets WCAG AA contrast in dark mode", async ({ page }) => {
  await goHome(page);
  const card = page.locator('[data-testid="unified-tip-card"]');
  await expect(card).toBeVisible({ timeout: 5000 });

  const result = await card.evaluate((root: HTMLElement) => {
    // --- color utils ---
    const parseColor = (input: string): [number, number, number, number] | null => {
      const m = input.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const parts = m[1].split(",").map((s) => parseFloat(s.trim()));
      const [r, g, b] = parts;
      const a = parts.length === 4 ? parts[3] : 1;
      return [r, g, b, a];
    };
    const srgbToLin = (c: number) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    const luminance = ([r, g, b]: [number, number, number, number]) =>
      0.2126 * srgbToLin(r) + 0.7152 * srgbToLin(g) + 0.0722 * srgbToLin(b);
    const blend = (
      fg: [number, number, number, number],
      bg: [number, number, number, number]
    ): [number, number, number, number] => {
      const a = fg[3] + bg[3] * (1 - fg[3]);
      if (a === 0) return [0, 0, 0, 0];
      return [
        (fg[0] * fg[3] + bg[0] * bg[3] * (1 - fg[3])) / a,
        (fg[1] * fg[3] + bg[1] * bg[3] * (1 - fg[3])) / a,
        (fg[2] * fg[3] + bg[2] * bg[3] * (1 - fg[3])) / a,
        a,
      ];
    };
    const effectiveBg = (el: HTMLElement): [number, number, number, number] => {
      let acc: [number, number, number, number] = [0, 0, 0, 0];
      let cur: HTMLElement | null = el;
      while (cur) {
        const cs = getComputedStyle(cur);
        const c = parseColor(cs.backgroundColor);
        if (c && c[3] > 0) acc = blend(acc, c);
        if (acc[3] >= 0.999) break;
        cur = cur.parentElement;
      }
      // Final fallback to the page background (dark theme).
      if (acc[3] < 0.999) {
        const body = parseColor(getComputedStyle(document.body).backgroundColor) ?? [
          15, 23, 42, 1,
        ];
        acc = blend(acc, body);
      }
      return acc;
    };
    const contrast = (
      fg: [number, number, number, number],
      bg: [number, number, number, number]
    ) => {
      const l1 = luminance(fg);
      const l2 = luminance(bg);
      const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
      return (lighter + 0.05) / (darker + 0.05);
    };

    const failures: Array<{ tag: string; text: string; ratio: number; min: number }> = [];
    const isLargeText = (cs: CSSStyleDeclaration) => {
      const pxSize = parseFloat(cs.fontSize);
      const weight = parseInt(cs.fontWeight, 10) || 400;
      // 18pt ≈ 24px; 14pt ≈ ~18.66px and weight ≥ 700.
      return pxSize >= 24 || (pxSize >= 18.66 && weight >= 700);
    };

    // Text nodes
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const text = (node.textContent ?? "").trim();
      if (!text) continue;
      const parent = node.parentElement;
      if (!parent) continue;
      const cs = getComputedStyle(parent);
      if (cs.visibility === "hidden" || cs.display === "none") continue;
      const fgRaw = parseColor(cs.color);
      if (!fgRaw) continue;
      const bg = effectiveBg(parent);
      const fg = blend(fgRaw, bg);
      const ratio = contrast(fg, bg);
      const min = isLargeText(cs) ? 3 : 4.5;
      if (ratio < min) {
        failures.push({
          tag: parent.tagName.toLowerCase(),
          text: text.slice(0, 60),
          ratio: Math.round(ratio * 100) / 100,
          min,
        });
      }
    }

    // SVG icons — stroke or fill must hit ≥3:1 against the card surface.
    const svgs = Array.from(root.querySelectorAll("svg")) as SVGElement[];
    for (const svg of svgs) {
      const cs = getComputedStyle(svg);
      const colorSource = parseColor(cs.color) || parseColor(cs.stroke) || parseColor(cs.fill);
      if (!colorSource) continue;
      const parent = (svg.parentElement ?? root) as HTMLElement;
      const bg = effectiveBg(parent);
      const fg = blend(colorSource, bg);
      const ratio = contrast(fg, bg);
      if (ratio < 3) {
        failures.push({ tag: "svg", text: svg.getAttribute("aria-label") ?? "icon", ratio: Math.round(ratio * 100) / 100, min: 3 });
      }
    }
    return failures;
  });

  if (result.length > 0) {
    console.error("Contrast failures:", JSON.stringify(result, null, 2));
  }
  expect(result, "UnifiedTipCard should meet WCAG AA contrast in dark mode").toEqual([]);
});
