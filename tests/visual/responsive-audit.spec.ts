/**
 * Responsive audit — automatic guardrails for typography, controls, and overflow.
 *
 * Runs across the mobile (320, 375, 420) and tablet+ (768, 1024) width bands
 * and fails the build if:
 *   - Any interactive control (button / link-as-button / input / textarea / select) is
 *     shorter than the mobile touch target (36px) or wider than its viewport.
 *   - Any headline (h1/h2/h3) uses a font-size outside the responsive band for that
 *     viewport (prevents "оверсайз" typography that breaks the layout again).
 *   - The page has horizontal overflow (scrollWidth > clientWidth + 1px).
 *
 * The routes list mirrors tests/visual/mobile-screens.spec.ts so the two specs stay
 * aligned on which surfaces are guarded.
 */
import { test, expect, Page } from "@playwright/test";

const ROUTES = ["/", "/library", "/projects", "/community", "/profile"] as const;

const MOBILE_WIDTHS = [320, 375, 420] as const;
const TABLET_UP_WIDTHS = [768, 1024] as const;

// Reasonable bands for headline font-size in px. Prevents both illegible (<14px)
// and layout-breaking (>40px on mobile / >64px on desktop) typography.
const HEADING_BAND = {
  mobile: { h1: [20, 40], h2: [16, 32], h3: [14, 26] },
  desktop: { h1: [24, 64], h2: [18, 48], h3: [16, 36] },
} as const;

const MIN_CONTROL_HEIGHT_PX = 36; // shadcn size="sm" floor; below this is a regression
const HIDDEN_STYLES = new Set(["none", "hidden", "collapse"]);

async function freezeMotion(page: Page) {
  await page.addStyleTag({
    content: `*,*::before,*::after{animation-duration:0s!important;transition-duration:0s!important;}`,
  });
}

async function gotoAndSettle(page: Page, route: string) {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await freezeMotion(page);
}

type ControlProbe = {
  tag: string;
  height: number;
  width: number;
  viewportWidth: number;
  text: string;
  selector: string;
};

type HeadingProbe = {
  tag: string;
  fontSize: number;
  text: string;
};

async function probeControls(page: Page): Promise<ControlProbe[]> {
  return page.$$eval(
    'button, [role="button"], input:not([type="hidden"]), textarea, select',
    (nodes) =>
      nodes
        .map((el) => {
          const style = window.getComputedStyle(el);
          if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            style.visibility === "collapse"
          ) {
            return null;
          }
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) return null;
          const text = (el.textContent || (el as HTMLInputElement).placeholder || "")
            .trim()
            .slice(0, 60);
          return {
            tag: el.tagName.toLowerCase(),
            height: Math.round(rect.height),
            width: Math.round(rect.width),
            viewportWidth: window.innerWidth,
            text,
            selector: el.id ? `#${el.id}` : `${el.tagName.toLowerCase()}.${el.className || ""}`,
          };
        })
        .filter((v): v is ControlProbe => v !== null),
  );
}

async function probeHeadings(page: Page): Promise<HeadingProbe[]> {
  return page.$$eval("h1, h2, h3", (nodes) =>
    nodes
      .map((el) => {
        const style = window.getComputedStyle(el);
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          style.visibility === "collapse"
        ) {
          return null;
        }
        const fontSize = parseFloat(style.fontSize);
        if (!Number.isFinite(fontSize) || fontSize === 0) return null;
        return {
          tag: el.tagName.toLowerCase(),
          fontSize: Math.round(fontSize * 10) / 10,
          text: (el.textContent || "").trim().slice(0, 60),
        };
      })
      .filter((v): v is HeadingProbe => v !== null),
  );
}

async function assertNoHorizontalOverflow(page: Page, route: string, width: number) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    overflow.scrollWidth - overflow.clientWidth,
    `Horizontal overflow on ${route} @ ${width}px`,
  ).toBeLessThanOrEqual(1);
}

function assertHeadingBand(headings: HeadingProbe[], width: number, route: string) {
  const band = width >= 768 ? HEADING_BAND.desktop : HEADING_BAND.mobile;
  const failures = headings
    .map((h) => {
      const [min, max] = (band as Record<string, [number, number]>)[h.tag] ?? [0, Infinity];
      if (h.fontSize < min || h.fontSize > max) {
        return `${h.tag}="${h.text}" fontSize=${h.fontSize}px (band ${min}-${max}px)`;
      }
      return null;
    })
    .filter(Boolean);
  expect(failures, `Heading typography out of band on ${route} @ ${width}px`).toEqual([]);
}

function assertControls(controls: ControlProbe[], width: number, route: string) {
  const tooShort = controls.filter((c) => c.height > 0 && c.height < MIN_CONTROL_HEIGHT_PX);
  const overflowing = controls.filter((c) => c.width > width + 1);
  expect(
    tooShort.map((c) => `${c.tag} h=${c.height}px "${c.text}"`),
    `Controls below ${MIN_CONTROL_HEIGHT_PX}px on ${route} @ ${width}px`,
  ).toEqual([]);
  expect(
    overflowing.map((c) => `${c.tag} w=${c.width}px "${c.text}"`),
    `Controls wider than viewport on ${route} @ ${width}px`,
  ).toEqual([]);
}

test.describe("Responsive audit — mobile band (320-420px)", () => {
  for (const width of MOBILE_WIDTHS) {
    for (const route of ROUTES) {
      test(`${route} @ ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 780 });
        await gotoAndSettle(page, route);
        await assertNoHorizontalOverflow(page, route, width);
        assertHeadingBand(await probeHeadings(page), width, route);
        assertControls(await probeControls(page), width, route);
      });
    }
  }
});

test.describe("Responsive audit — tablet/desktop band (768px+)", () => {
  for (const width of TABLET_UP_WIDTHS) {
    for (const route of ROUTES) {
      test(`${route} @ ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await gotoAndSettle(page, route);
        await assertNoHorizontalOverflow(page, route, width);
        assertHeadingBand(await probeHeadings(page), width, route);
        assertControls(await probeControls(page), width, route);
      });
    }
  }
});

// Silence linter: HIDDEN_STYLES kept for readability parity with probe filters.
void HIDDEN_STYLES;
