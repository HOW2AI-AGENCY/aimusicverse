import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Automated axe-core scan for critical/serious WCAG 2.1 AA violations.
 * Covers UI Audit 2026-07-03 patches #5-9, #11.
 *
 * Dev-server note: First-load bundle compile (Vite) can exceed the default
 * 30s Playwright timeout for cold runs, so we extend the per-test timeout.
 *
 * Auth note: Library is gated by Telegram WebApp SDK; axe scan on `/` covers
 * the Index surface (Hero, Create, Discover, YouStrip) which validates the
 * global token changes (patches 8, 9) and headings/landmarks.
 */
test.describe.configure({ mode: "serial", timeout: 120_000 });

test("axe scan on / — no critical/serious violations", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#main-content", { timeout: 60_000 });
  await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => undefined);

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const criticalOrSerious = results.violations.filter((v) =>
    ["critical", "serious"].includes(v.impact ?? ""),
  );

  if (criticalOrSerious.length > 0) {
    // eslint-disable-next-line no-console
    console.log(
      "axe violations on /:",
      JSON.stringify(
        criticalOrSerious.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })),
        null,
        2,
      ),
    );
  }
  expect(criticalOrSerious).toEqual([]);
});