/**
 * Regression: ensure no smart-alerts ("Стемы готовы") or PRO paywall
 * auto-open on the home page or public routes without an explicit trigger.
 *
 * Also verifies that PaywallProvider does not render an overlay covering content.
 */
import { test, expect, Page } from "@playwright/test";

const PUBLIC_ROUTES = ["/", "/index", "/auth"];

const FORBIDDEN_TEXTS = [
  /Стемы\s+готовы/i,
  /Ты\s+настоящий\s+музыкант/i,
  /Оформить\s+PRO/i,
  /Upgrade\s+to\s+PRO/i,
];

async function assertNoAutoOverlays(page: Page, route: string) {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  // Wait long enough for SmartAlertProvider / PaywallProvider auto timers.
  await page.waitForTimeout(2500);

  for (const re of FORBIDDEN_TEXTS) {
    const matches = await page.getByText(re).all();
    expect(
      matches.length,
      `Route ${route} unexpectedly shows overlay text matching ${re}`,
    ).toBe(0);
  }

  // No dialog/sheet with role="dialog" should be auto-open on entry.
  const openDialogs = await page.locator('[role="dialog"][data-state="open"]').count();
  expect(
    openDialogs,
    `Route ${route} has ${openDialogs} dialog(s) auto-opened without trigger`,
  ).toBe(0);

  // Hero / main content must be visible (not covered by an overlay).
  const main = page.locator("main, [role='main']").first();
  if (await main.count()) {
    await expect(main).toBeVisible();
  }
}

test.describe("Home & public routes — no auto overlays", () => {
  test.use({ viewport: { width: 424, height: 783 } });

  for (const route of PUBLIC_ROUTES) {
    test(`route ${route} does not auto-open smart-alerts or paywall`, async ({ page }) => {
      await assertNoAutoOverlays(page, route);
    });
  }

  test("PaywallProvider does not render blocking overlay on /", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);

    // Tap roughly at hero CTA area — if paywall was covering content, this would
    // hit the overlay instead of the underlying button.
    const blockingFixed = await page.evaluate(() => {
      const els = Array.from(document.body.querySelectorAll<HTMLElement>("*"));
      return els.filter((el) => {
        const cs = getComputedStyle(el);
        if (cs.position !== "fixed") return false;
        const r = el.getBoundingClientRect();
        const coversViewport =
          r.width >= window.innerWidth * 0.9 &&
          r.height >= window.innerHeight * 0.5;
        const visible = cs.visibility !== "hidden" && cs.display !== "none" && parseFloat(cs.opacity || "1") > 0.5;
        const interactive = cs.pointerEvents !== "none";
        return coversViewport && visible && interactive;
      }).map((el) => ({
        tag: el.tagName,
        cls: el.className?.toString().slice(0, 120) ?? "",
        text: (el.innerText || "").slice(0, 80),
      }));
    });

    expect(
      blockingFixed,
      `Found blocking fixed overlays on /: ${JSON.stringify(blockingFixed)}`,
    ).toEqual([]);
  });
});
