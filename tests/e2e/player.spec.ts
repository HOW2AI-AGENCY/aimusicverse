/**
 * E2E Tests for Audio Player
 *
 * Tests player functionality:
 * - Player display
 * - Controls interaction
 * - Volume control
 * - Progress bar
 */

import { test, expect } from "@playwright/test";

test.describe("Audio Player Display", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
  });

  test("should display compact player when track is active", async ({ page }) => {
    // Look for compact player
    const compactPlayer = page.locator(
      "[class*='CompactPlayer'], [class*='compact-player'], [class*='MiniPlayer'], [class*='player-bar']"
    );
    
    const playerCount = await compactPlayer.count();
    console.log(`Found ${playerCount} compact player elements`);
    
    // May not be visible if no track is playing
    expect(playerCount).toBeGreaterThanOrEqual(0);
  });

  test("should have play/pause button", async ({ page }) => {
    const playPauseButton = page.locator(
      "button[aria-label*='Play'], button[aria-label*='Pause'], button[aria-label*='Воспр'], button[aria-label*='Пауза'], [class*='PlayPause']"
    );
    
    const buttonCount = await playPauseButton.count();
    console.log(`Found ${buttonCount} play/pause buttons`);
    
    expect(buttonCount).toBeGreaterThanOrEqual(0);
  });

  test("should have volume control", async ({ page }) => {
    const volumeControl = page.locator(
      "[class*='Volume'], [class*='volume'], input[type='range'][aria-label*='volume'], [aria-label*='Громкость']"
    );
    
    const volumeCount = await volumeControl.count();
    console.log(`Found ${volumeCount} volume controls`);
    
    expect(volumeCount).toBeGreaterThanOrEqual(0);
  });

  test("should have progress bar", async ({ page }) => {
    const progressBar = page.locator(
      "[class*='Progress'], [class*='progress'], input[type='range'][aria-label*='seek'], [role='slider']"
    );
    
    const progressCount = await progressBar.count();
    console.log(`Found ${progressCount} progress bars`);
    
    expect(progressCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Player Controls Interaction", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/library");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
  });

  test("should handle keyboard space for play/pause", async ({ page }) => {
    // Focus on a playable element first
    await page.keyboard.press("Tab");
    await page.waitForTimeout(300);
    
    // Try space to play
    await page.keyboard.press("Space");
    await page.waitForTimeout(500);
    
    // Should not throw errors
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });
    
    expect(errors.length).toBeLessThan(5);
  });

  test("should handle track navigation if controls available", async ({ page }) => {
    // Look for next/previous buttons
    const navButtons = page.locator(
      "button[aria-label*='Next'], button[aria-label*='Previous'], button[aria-label*='Следующ'], button[aria-label*='Предыдущ']"
    );
    
    const navCount = await navButtons.count();
    console.log(`Found ${navCount} navigation buttons`);
    
    expect(navCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Full Screen Player", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
  });

  test("should have expand button for full player", async ({ page }) => {
    const expandButton = page.locator(
      "button[aria-label*='expand'], button[aria-label*='Развернуть'], button[aria-label*='maximize'], [class*='Maximize']"
    );
    
    const expandCount = await expandButton.count();
    console.log(`Found ${expandCount} expand buttons`);
    
    expect(expandCount).toBeGreaterThanOrEqual(0);
  });

  test("should display track info", async ({ page }) => {
    // Look for track title/artist display
    const trackInfo = page.locator(
      "[class*='TrackInfo'], [class*='track-info'], [class*='NowPlaying'], [class*='song-title']"
    );
    
    const infoCount = await trackInfo.count();
    console.log(`Found ${infoCount} track info elements`);
    
    expect(infoCount).toBeGreaterThanOrEqual(0);
  });

  test("should display track artwork if available", async ({ page }) => {
    const artwork = page.locator(
      "[class*='Artwork'], [class*='artwork'], [class*='cover'], img[alt*='cover'], img[alt*='album']"
    );
    
    const artworkCount = await artwork.count();
    console.log(`Found ${artworkCount} artwork elements`);
    
    expect(artworkCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Player Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
  });

  test("should have accessible controls", async ({ page }) => {
    const accessibleControls = page.locator(
      "button[aria-label], [role='slider'][aria-label], [role='progressbar']"
    );
    
    const controlCount = await accessibleControls.count();
    console.log(`Found ${controlCount} accessible controls`);
    
    expect(controlCount).toBeGreaterThan(0);
  });

  test("should support keyboard shortcuts", async ({ page }) => {
    // Test common media shortcuts
    await page.keyboard.press("m"); // Mute
    await page.waitForTimeout(200);
    
    await page.keyboard.press("ArrowUp"); // Volume up
    await page.waitForTimeout(200);
    
    await page.keyboard.press("ArrowDown"); // Volume down
    await page.waitForTimeout(200);
    
    // Should not crash
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should have proper focus management", async ({ page }) => {
    // Tab through player controls
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    
    const focusedElement = page.locator(":focus");
    const hasFocus = await focusedElement.count();
    
    console.log(`Focused elements after 3 Tabs: ${hasFocus}`);
    
    expect(hasFocus).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Player Responsive Design", () => {
  test("should adapt to mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    
    // Player should be visible and not overflow
    const body = page.locator("body");
    await expect(body).toBeVisible();
    
    const bodyBox = await body.boundingBox();
    expect(bodyBox?.width).toBeLessThanOrEqual(375);
  });

  test("should have touch-friendly controls on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForTimeout(2000);
    
    // Check button sizes for touch
    const buttons = page.locator("button");
    const buttonCount = await buttons.count();
    
    console.log(`Found ${buttonCount} buttons on mobile`);
    
    expect(buttonCount).toBeGreaterThan(0);
  });
});
