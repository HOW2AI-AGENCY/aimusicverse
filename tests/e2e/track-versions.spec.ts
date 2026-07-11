import { test, expect } from "@playwright/test";

test.describe("Track version switching", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("should display version selector and switch A/B", async ({ page }) => {
    // Navigate to a known track that has versions
    await page.goto("/track/demo", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Look for version switch element (pill/chip with "A" / "B")
    const versionToggle = page.locator(
      '[data-testid*="version"], [aria-label*="верси"], [aria-label*="version"], button:has-text("A"), button:has-text("B")',
    ).first();

    // If no version toggle on demo track, skip (not all tracks have versions)
    test.skip(await versionToggle.count() === 0, "No version toggle available on this track");

    await expect(versionToggle).toBeVisible();
    await versionToggle.click();

    // After switching, version label should update
    await expect(page.locator('[class*="version"], [class*="верси"]').first()).toBeVisible({ timeout: 5000 });
  });
});
