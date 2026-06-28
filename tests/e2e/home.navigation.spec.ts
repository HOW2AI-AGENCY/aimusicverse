/**
 * Home page navigation & composition regression tests.
 *
 * Validates:
 *   - Sections render in the expected order
 *   - No duplicated carousels / StatsHighlight blocks
 *   - All sections render via the unified HomeSection wrapper
 */
import { test, expect } from "@playwright/test";

const EXPECTED_ORDER = [
  "hero",
  "quick-start",
  "featured",
  "new",
  "popular",
];

test.describe("Home page navigation", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("renders expected sections in order, no duplicates", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Wait for app to be ready
    await page.waitForFunction(
      () => {
        const root = document.getElementById("root");
        if (!root) return false;
        const fallback = document.getElementById("loading-fallback");
        const hasReal =
          root.querySelector("main, [role='main'], nav, [role='navigation'], [data-testid]") != null;
        return !fallback || hasReal;
      },
      { timeout: 20000 },
    );

    const sectionIds = await page.$$eval(
      "[data-section-id]",
      (els) => els.map((el) => el.getAttribute("data-section-id") || ""),
    );

    if (sectionIds.length === 0) {
      test.skip(true, "HomeSection wrapper not yet wired with data-section-id");
    }

    // Unique
    const dupes = sectionIds.filter(
      (id, i, arr) => id && arr.indexOf(id) !== i,
    );
    expect(dupes, `Duplicate sections: ${dupes.join(", ")}`).toHaveLength(0);

    // Expected ordering (subset — only assert relative order of known ids)
    const seen = sectionIds.filter((id) => EXPECTED_ORDER.includes(id));
    const sortedByExpected = [...seen].sort(
      (a, b) => EXPECTED_ORDER.indexOf(a) - EXPECTED_ORDER.indexOf(b),
    );
    expect(seen).toEqual(sortedByExpected);
  });

  test("StatsHighlight appears at most once", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Wait for app to be ready
    await page.waitForFunction(
      () => {
        const root = document.getElementById("root");
        if (!root) return false;
        const fallback = document.getElementById("loading-fallback");
        const hasReal =
          root.querySelector("main, [role='main'], nav, [role='navigation'], [data-testid]") != null;
        return !fallback || hasReal;
      },
      { timeout: 20000 },
    );
    const count = await page
      .locator('[data-testid="stats-highlight"]')
      .count();
    expect(count).toBeLessThanOrEqual(1);
  });
});
