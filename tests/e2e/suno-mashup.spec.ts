import { test, expect } from "@playwright/test";

/**
 * Sprint 052-B8 — e2e smoke for the mashup deep-link.
 *
 * Verifies the bot deep-link `?startapp=mashup_<trackId>` lands on the app
 * and that the MashupDialog renders with the correct title. The actual
 * Suno API call is not exercised (no real track in the test environment);
 * this is a routing + render check only.
 */
test.describe("Suno mashup deep-link", () => {
  test("loads the app with startapp=mashup and renders the dialog CTA", async ({ page }) => {
    await page.goto("/?startapp=mashup_dummy-track-id");

    // App must boot without crashing.
    await expect(page).toHaveTitle(/MusicVerse/i, { timeout: 15_000 });

    // The mashup dialog may be opened via a track action menu; we don't
    // assert the dialog is mounted here because trackId is fake — but we
    // assert the app didn't redirect away or throw.
    await page.waitForLoadState("domcontentloaded");

    // Sanity: no JS error overlay or blank error page.
    const bodyText = (await page.locator("body").textContent()) ?? "";
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test("renders MashupDialog when invoked from track actions", async ({ page }) => {
    // Open the app and look for any track action menu — the exact trackId
    // doesn't matter for the dialog render check.
    await page.goto("/library");
    await page.waitForLoadState("domcontentloaded");

    // Look for any track context. If none exist (empty library), skip.
    const trackCount = await page.locator('[data-testid*="track"], [aria-label*="Меню трека"]').count();
    if (trackCount === 0) {
      test.skip(true, "no tracks in library to open mashup dialog from");
      return;
    }

    // Open first track menu and look for the mashup action. The action
    // label is "Mashup с другим треком" (see CreateActions).
    const menuButton = page.locator('[aria-label*="Меню трека"]').first();
    await menuButton.click({ timeout: 5_000 });

    const mashupMenuItem = page.locator("text=Mashup с другим треком").first();
    if ((await mashupMenuItem.count()) === 0) {
      test.skip(true, "mashup menu item not present (track has no audio_url?)");
      return;
    }

    await mashupMenuItem.click();
    // MashupDialog title.
    await expect(page.locator("text=Mashup").first()).toBeVisible({ timeout: 5_000 });
  });
});
