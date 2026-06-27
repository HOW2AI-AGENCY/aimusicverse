/**
 * Regression: smart-alerts ("Стемы готовы") and PRO paywall MUST NOT
 * auto-open on the home / public routes, on any common mobile viewport,
 * regardless of trigger state.
 *
 * Fixtures/mocks:
 *   - Reset sessionStorage flags that gate the paywall (so a "fresh" session
 *     would normally allow auto-open). The provider should still NOT show on
 *     denylisted routes.
 *   - Stub Supabase REST/RPC calls that could deliver smart-alert triggers
 *     (notifications, ready-stem events) with empty payloads so we don't rely
 *     on the live DB state.
 */
import { test, expect, Page } from "@playwright/test";

const PUBLIC_ROUTES = [
  "/",
  "/index",
  "/auth",
  "/blog",
  "/terms",
  "/privacy",
  "/pricing",
];

const MOBILE_VIEWPORTS = [
  { name: "iPhone SE", width: 320, height: 568 },
  { name: "iPhone 12", width: 390, height: 844 },
  { name: "Pixel 5", width: 393, height: 851 },
  { name: "Telegram narrow", width: 424, height: 783 },
  { name: "Tablet portrait", width: 768, height: 1024 },
];

const FORBIDDEN_TEXTS = [
  /Стемы\s+готовы/i,
  /Stems?\s+ready/i,
  /Ты\s+настоящий\s+музыкант/i,
  /Оформить\s+PRO/i,
  /Upgrade\s+to\s+PRO/i,
  /Перейти\s+на\s+PRO/i,
];

/** Install fixtures that simulate "trigger state present" while routing the
 *  network responses to deterministic empty payloads. */
async function installFixtures(page: Page) {
  // 1. Pre-seed storage as if the user had unread stems / had never seen PRO.
  await page.addInitScript(() => {
    try {
      sessionStorage.removeItem("paywall_shown_this_session");
      // Simulate "fresh" smart-alert flags so providers would WANT to show.
      localStorage.removeItem("smart_alerts_seen");
      localStorage.setItem("stems_ready_pending", "1");
      localStorage.setItem("pro_promo_eligible", "1");
    } catch {
      /* noop */
    }
  });

  // 2. Stub anything that could deliver smart-alert triggers from the backend.
  await page.route(/\/rest\/v1\/(notifications|track_stems|user_credits).*/i, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "content-range": "0-0/0" },
      body: "[]",
    }),
  );
  await page.route(/\/rest\/v1\/rpc\/.*/i, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "null" }),
  );
}

async function assertNoAutoOverlays(page: Page, route: string) {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  // Wait long enough for SmartAlertProvider / PaywallProvider auto timers.
  await page.waitForTimeout(2500);

  for (const re of FORBIDDEN_TEXTS) {
    const count = await page.getByText(re).count();
    expect(
      count,
      `Route ${route} unexpectedly shows overlay text matching ${re}`,
    ).toBe(0);
  }

  // No dialog/sheet with role="dialog" should be auto-open on entry.
  const openDialogs = await page.locator('[role="dialog"][data-state="open"]').count();
  expect(
    openDialogs,
    `Route ${route} has ${openDialogs} dialog(s) auto-opened without trigger`,
  ).toBe(0);

  // PaywallProvider must not render a blocking fixed overlay.
  const blockingFixed = await page.evaluate(() => {
    const els = Array.from(document.body.querySelectorAll<HTMLElement>("*"));
    return els
      .filter((el) => {
        const cs = getComputedStyle(el);
        if (cs.position !== "fixed") return false;
        const r = el.getBoundingClientRect();
        const coversViewport =
          r.width >= window.innerWidth * 0.9 &&
          r.height >= window.innerHeight * 0.5;
        const visible =
          cs.visibility !== "hidden" &&
          cs.display !== "none" &&
          parseFloat(cs.opacity || "1") > 0.5;
        const interactive = cs.pointerEvents !== "none";
        return coversViewport && visible && interactive;
      })
      .map((el) => ({
        tag: el.tagName,
        cls: (el.className?.toString() ?? "").slice(0, 120),
        text: (el.innerText || "").slice(0, 80),
      }));
  });

  expect(
    blockingFixed,
    `Route ${route} has blocking fixed overlay(s): ${JSON.stringify(blockingFixed)}`,
  ).toEqual([]);
}

test.describe("Public routes — no auto smart-alert / PRO overlays", () => {
  test.beforeEach(async ({ page }) => {
    await installFixtures(page);
  });

  for (const vp of MOBILE_VIEWPORTS) {
    test.describe(`viewport ${vp.name} (${vp.width}x${vp.height})`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      for (const route of PUBLIC_ROUTES) {
        test(`${route} stays clear of overlays`, async ({ page }) => {
          await assertNoAutoOverlays(page, route);
        });
      }
    });
  }
});
