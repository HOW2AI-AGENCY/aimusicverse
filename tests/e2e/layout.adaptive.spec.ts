/**
 * Adaptive layout regression tests.
 *
 * Covers:
 *  - /library renders without ErrorBoundary fallback at 360px width
 *  - Mobile landscape (≤500px height, landscape) shows the edge-rail
 *    instead of the bottom navigation, and main content is offset
 */
import { test, expect, type Page } from "@playwright/test";

async function goto(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("domcontentloaded");
}

test.describe("Library @ 360px", () => {
  test.use({ viewport: { width: 360, height: 720 } });

  test("renders without ErrorBoundary fallback", async ({ page }) => {
    await goto(page, "/library");
    // No fallback UI should be visible
    await expect(page.getByText(/что-то пошло не так|something went wrong/i)).toHaveCount(0);
    // Main content region exists
    await expect(page.locator("#main-content")).toBeVisible();
  });

  test("visual snapshot is stable", async ({ page }) => {
    await goto(page, "/library");
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("library-360.png", {
      maxDiffPixelRatio: 0.05,
      fullPage: false,
    });
  });
});

test.describe("Mobile landscape edge-rail", () => {
  test.use({ viewport: { width: 844, height: 390 } });

  test("renders edge-rail and hides BottomNavigation", async ({ page }) => {
    await goto(page, "/");
    const edgeRail = page.getByTestId("edge-rail");
    await expect(edgeRail).toBeVisible();
    // BottomNavigation has role=navigation / data-testid bottom-navigation;
    // accept either being absent
    const bottomNav = page.getByTestId("bottom-navigation");
    await expect(bottomNav).toHaveCount(0);
  });

  test("main content is offset by edge-rail width", async ({ page }) => {
    await goto(page, "/");
    const main = page.locator("#main-content");
    const box = await main.boundingBox();
    expect(box?.x ?? 0).toBeGreaterThanOrEqual(48); // w-14 = 56px
  });
});
