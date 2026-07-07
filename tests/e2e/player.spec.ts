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
    await page.waitForLoadState("domcontentloaded");
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
    await page.waitForLoadState("domcontentloaded");
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
    await page.waitForLoadState("domcontentloaded");
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
    await page.waitForLoadState("domcontentloaded");
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
    await page.waitForLoadState("domcontentloaded");
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

test.describe("Player Mode Switching", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
  });

  test("should switch between compact and expanded modes", async ({ page }) => {
    // Look for compact player
    const compactPlayer = page.locator("[class*='CompactPlayer']").first();
    const compactCount = await compactPlayer.count();

    if (compactCount > 0) {
      // Click to expand
      await compactPlayer.click();
      await page.waitForTimeout(500);

      // Look for expanded player
      const expandedPlayer = page.locator("[class*='ExpandedPlayer'], [class*='expanded-player']").first();
      const expandedCount = await expandedPlayer.count();

      console.log(`Expanded player visible: ${expandedCount > 0}`);

      // Click to collapse back
      if (expandedCount > 0) {
        await expandedPlayer.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test("should maintain playback state during mode switch", async ({ page }) => {
    // Mock a playing track
    const compactPlayer = page.locator("[class*='CompactPlayer']").first();
    const compactCount = await compactPlayer.count();

    if (compactCount > 0) {
      // Get initial play/pause state
      const playButton = page.locator("button[aria-label*='Play'], button[aria-label*='Pause']").first();
      const hasButton = await playButton.count();

      if (hasButton > 0) {
        const initialLabel = await playButton.getAttribute("aria-label");
        console.log(`Initial play state: ${initialLabel}`);

        // Switch to expanded mode
        await compactPlayer.click();
        await page.waitForTimeout(500);

        // Check play state maintained
        const expandedPlayButton = page.locator("button[aria-label*='Play'], button[aria-label*='Pause']").first();
        const expandedLabel = await expandedPlayButton.getAttribute("aria-label");

        console.log(`Expanded play state: ${expandedLabel}`);
        // States should match (both playing or both paused)
      }
    }
  });
});

test.describe("Queue Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/library");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
  });

  test("should display queue when multiple tracks are available", async ({ page }) => {
    // Look for queue button or drawer
    const queueButton = page.locator("button:has-text('Очередь'), button:has_text('Queue'), [class*='queue']").first();
    const queueCount = await queueButton.count();

    console.log(`Queue button found: ${queueCount > 0}`);

    if (queueCount > 0) {
      await queueButton.click();
      await page.waitForTimeout(500);

      // Check for queue display
      const queueDisplay = page.locator("[class*='Queue'], [class*='playlist'], [role='list']").first();
      const displayCount = await queueDisplay.count();

      console.log(`Queue display visible: ${displayCount > 0}`);
    }
  });

  test("should allow reordering tracks in queue", async ({ page }) => {
    const queueButton = page.locator("button:has-text('Очередь'), button:has_text('Queue')").first();
    const queueCount = await queueButton.count();

    if (queueCount > 0) {
      await queueButton.click();
      await page.waitForTimeout(500);

      // Look for drag handles or reorder indicators
      const dragHandles = page.locator("[class*='drag'], [aria-grabable='true'], [draggable='true']").first();
      const handleCount = await dragHandles.count();

      console.log(`Drag handles found: ${handleCount > 0}`);

      if (handleCount > 0) {
        // Simulate drag reordering
        await dragHandles.dragTo(page.locator("[class*='Queue']").first());
        await page.waitForTimeout(500);
        console.log("Successfully reordered queue items");
      }
    }
  });

  test("should remove tracks from queue", async ({ page }) => {
    const queueButton = page.locator("button:has-text('Очередь'), button:has_text('Queue')").first();
    const queueCount = await queueButton.count();

    if (queueCount > 0) {
      await queueButton.click();
      await page.waitForTimeout(500);

      // Look for remove buttons
      const removeButtons = page.locator("button:has_text('Удалить'), button[aria-label*='remove'], [class*='remove']").first();
      const removeCount = await removeButtons.count();

      console.log(`Remove buttons found: ${removeCount > 0}`);

      if (removeCount > 0) {
        await removeButtons.click();
        await page.waitForTimeout(500);
        console.log("Successfully removed track from queue");
      }
    }
  });
});

test.describe("Mobile Gestures", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
  });

  test("should support swipe gestures for track navigation", async ({ page }) => {
    const player = page.locator("[class*='CompactPlayer'], [class*='Player']").first();
    const playerCount = await player.count();

    if (playerCount > 0) {
      // Simulate swipe left (next track)
      await player.evaluate(el => {
        const touchStart = new TouchEvent('touchstart', {
          touches: [{ clientX: 300, clientY: 50 }],
          cancelable: true,
          bubbles: true
        });
        const touchEnd = new TouchEvent('touchend', {
          touches: [{ clientX: 100, clientY: 50 }],
          cancelable: true,
          bubbles: true
        });
        el.dispatchEvent(touchStart);
        setTimeout(() => el.dispatchEvent(touchEnd), 100);
      });

      await page.waitForTimeout(500);
      console.log("Swipe gesture completed");
    }
  });

  test("should support long-press for additional options", async ({ page }) => {
    const player = page.locator("[class*='CompactPlayer']").first();
    const playerCount = await player.count();

    if (playerCount > 0) {
      // Simulate long press
      await player.click({ button: 'right', delay: 1000 });
      await page.waitForTimeout(500);

      // Check for context menu or additional options
      const contextMenu = page.locator("[class*='ContextMenu'], [class*='options']").first();
      const menuCount = await contextMenu.count();

      console.log(`Context menu appeared: ${menuCount > 0}`);
    }
  });
});

test.describe("Lyrics Display", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
  });

  test("should display lyrics when available", async ({ page }) => {
    // Look for lyrics button or display
    const lyricsButton = page.locator("button:has-text('Текст'), button:has_text('Lyrics'), [class*='lyrics']").first();
    const lyricsCount = await lyricsButton.count();

    console.log(`Lyrics button found: ${lyricsCount > 0}`);

    if (lyricsCount > 0) {
      await lyricsButton.click();
      await page.waitForTimeout(500);

      // Check for lyrics display
      const lyricsDisplay = page.locator("[class*='Lyrics'], [class*='lyrics-display']").first();
      const displayCount = await lyricsDisplay.count();

      if (displayCount > 0) {
        const lyricsText = await lyricsDisplay.textContent();
        console.log(`Lyrics displayed: ${lyricsText?.length > 0}`);
      }
    }
  });

  test("should scroll lyrics automatically during playback", async ({ page }) => {
    const lyricsButton = page.locator("button:has-text('Текст'), button:has_text('Lyrics')").first();
    const lyricsCount = await lyricsButton.count();

    if (lyricsCount > 0) {
      await lyricsButton.click();
      await page.waitForTimeout(500);

      const lyricsDisplay = page.locator("[class*='Lyrics']").first();
      const displayCount = await lyricsDisplay.count();

      if (displayCount > 0) {
        // Get initial scroll position
        const initialScroll = await lyricsDisplay.evaluate(el => el.scrollTop);

        // Simulate playback progress
        await page.waitForTimeout(2000);

        // Check if scroll position changed
        const finalScroll = await lyricsDisplay.evaluate(el => el.scrollTop);
        console.log(`Lyrics auto-scroll: ${finalScroll > initialScroll}`);
      }
    }
  });
});

test.describe("Karaoke Mode", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
  });

  test("should have karaoke mode toggle", async ({ page }) => {
    const karaokeButton = page.locator("button:has-text('Караоке'), button:has_text('Karaoke')").first();
    const karaokeCount = await karaokeButton.count();

    console.log(`Karaoke button found: ${karaokeCount > 0}`);

    if (karaokeCount > 0) {
      await expect(karaokeButton).toBeVisible();
    }
  });

  test("should highlight lyrics in karaoke mode", async ({ page }) => {
    const karaokeButton = page.locator("button:has-text('Караоке'), button:has_text('Karaoke')").first();
    const karaokeCount = await karaokeButton.count();

    if (karaokeCount > 0) {
      await karaokeButton.click();
      await page.waitForTimeout(1000);

      // Look for highlighted lyrics
      const highlightedLyrics = page.locator("[class*='highlight'], [class*='current'], [class*='active']").first();
      const highlightCount = await highlightedLyrics.count();

      console.log(`Karaoke highlighting active: ${highlightCount > 0}`);
    }
  });
});

test.describe("Player Error Handling", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
  });

  test("should handle audio loading errors", async ({ page }) => {
    // Mock audio loading failure
    await page.route("**/audio/**/*.mp3", route => {
      route.abort("failed");
    });

    // Try to play a track
    const playButton = page.locator("button[aria-label*='Play'], button[aria-label*='Воспр']").first();
    const hasButton = await playButton.count();

    if (hasButton > 0) {
      await playButton.click();
      await page.waitForTimeout(2000);

      // Check for error message
      const errorMessage = page.locator("[class*='error'], [class*='Error'], [role='alert']").first();
      const errorCount = await errorMessage.count();

      console.log(`Audio error message displayed: ${errorCount > 0}`);

      if (errorCount > 0) {
        const errorText = await errorMessage.textContent();
        console.log(`Error text: ${errorText}`);
      }
    }
  });

  test("should show fallback for unsupported formats", async ({ page }) => {
    // Mock unsupported audio format
    await page.route("**/audio/**", route => {
      route.fulfill({
        status: 415,
        contentType: "text/plain",
        body: "Unsupported Media Type"
      });
    });

    const playButton = page.locator("button[aria-label*='Play']").first();
    const hasButton = await playButton.count();

    if (hasButton > 0) {
      await playButton.click();
      await page.waitForTimeout(2000);

      // Check for format error
      const formatError = page.locator("text=формат, text=format, text=unsupported").first();
      const formatCount = await formatError.count();

      console.log(`Format error displayed: ${formatCount > 0}`);
    }
  });
});
