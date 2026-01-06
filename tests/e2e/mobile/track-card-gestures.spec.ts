/**
 * E2E tests for track card swipe gestures on mobile
 *
 * Per contracts/UnifiedTrackCard.contract.ts:
 * - Swipe gestures for actions (like, delete)
 * - Double-tap to like
 * - Long-press for context menu
 * - Touch target compliance (44-56px)
 */

import { test, expect, Page } from '@playwright/test';

test.describe.configure({ mode: 'parallel' });

test.describe('Track Card Gestures - Mobile', () => {
  // Mobile viewport dimensions
  const MOBILE_WIDTH = 375;
  const MOBILE_HEIGHT = 812; // iPhone X

  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: MOBILE_WIDTH, height: MOBILE_HEIGHT });

    // Navigate to library page
    await page.goto('/library');

    // Wait for tracks to load
    await page.waitForSelector('[data-testid="track-card"]', { timeout: 5000 });
  });

  test('should swipe right to like a track', async ({ page }) => {
    // Get first track card
    const trackCard = page.locator('[data-testid="track-card"]').first();

    // Get initial like count
    const initialLikeCount = await trackCard.locator('[data-testid="like-count"]').textContent();

    // Perform swipe right gesture
    const box = await trackCard.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width + 100, box.y + box.height / 2, { steps: 10 });
      await page.mouse.up();
    }

    // Wait for animation
    await page.waitForTimeout(500);

    // Verify like animation appeared
    await expect(trackCard.locator('[data-testid="like-animation"]')).toBeVisible();

    // Verify like count increased
    const newLikeCount = await trackCard.locator('[data-testid="like-count"]').textContent();
    expect(parseInt(newLikeCount || '0')).toBe(parseInt(initialLikeCount || '0') + 1);
  });

  test('should swipe left to delete a track', async ({ page }) => {
    // Get first track card
    const trackCard = page.locator('[data-testid="track-card"]').first();

    // Perform swipe left gesture
    const box = await trackCard.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x - 100, box.y + box.height / 2, { steps: 10 });
      await page.mouse.up();
    }

    // Confirm delete in dialog
    await page.waitForSelector('[data-testid="delete-confirm-dialog"]');
    await page.click('[data-testid="confirm-delete-button"]');

    // Wait for animation
    await page.waitForTimeout(500);

    // Verify track card was removed
    await expect(trackCard).not.toBeVisible();
  });

  test('should double-tap to like a track', async ({ page }) => {
    // Get first track card
    const trackCard = page.locator('[data-testid="track-card"]').first();

    // Get initial like state
    const initialLikeState = await trackCard.getAttribute('data-liked');

    // Perform double-tap gesture
    const box = await trackCard.boundingBox();
    if (box) {
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;

      await page.mouse.click(centerX, centerY, { clickCount: 2 });
    }

    // Wait for animation
    await page.waitForTimeout(300);

    // Verify like state changed
    const newLikeState = await trackCard.getAttribute('data-liked');
    expect(newLikeState).toBe(initialLikeState === 'true' ? 'false' : 'true');
  });

  test('should long-press for context menu', async ({ page }) => {
    // Get first track card
    const trackCard = page.locator('[data-testid="track-card"]').first();

    // Perform long-press gesture
    const box = await trackCard.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(600); // Long press threshold
      await page.mouse.up();
    }

    // Verify context menu appeared
    await expect(page.locator('[data-testid="track-context-menu"]')).toBeVisible();

    // Verify menu options
    await expect(page.locator('[data-testid="menu-add-to-playlist"]')).toBeVisible();
    await expect(page.locator('[data-testid="menu-share"]')).toBeVisible();
    await expect(page.locator('[data-testid="menu-delete"]')).toBeVisible();
  });

  test('should provide haptic feedback on swipe', async ({ page }) => {
    // Note: Haptic feedback can't be directly tested in E2E
    // We verify the gesture completion and UI feedback instead

    // Get first track card
    const trackCard = page.locator('[data-testid="track-card"]').first();

    // Perform swipe right gesture
    const box = await trackCard.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width + 100, box.y + box.height / 2, { steps: 10 });
      await page.mouse.up();
    }

    // Verify visual feedback appeared (animation)
    await expect(trackCard.locator('[data-testid="swipe-feedback"]')).toBeVisible();
  });

  test('should respect touch target sizes', async ({ page }) => {
    // Get all interactive buttons in track card
    const playButton = page.locator('[data-testid="play-button"]').first();
    const likeButton = page.locator('[data-testid="like-button"]').first();
    const moreButton = page.locator('[data-testid="more-button"]').first();

    // Check play button size
    const playBox = await playButton.boundingBox();
    expect(playBox?.width).toBeGreaterThanOrEqual(44);
    expect(playBox?.height).toBeGreaterThanOrEqual(44);

    // Check like button size
    const likeBox = await likeButton.boundingBox();
    expect(likeBox?.width).toBeGreaterThanOrEqual(44);
    expect(likeBox?.height).toBeGreaterThanOrEqual(44);

    // Check more button size
    const moreBox = await moreButton.boundingBox();
    expect(moreBox?.width).toBeGreaterThanOrEqual(44);
    expect(moreBox?.height).toBeGreaterThanOrEqual(44);
  });

  test('should handle pinch gesture for version switch', async ({ page }) => {
    // Get first track card that has versions
    const trackCard = page.locator('[data-testid="track-card"][data-has-versions="true"]').first();

    // Perform pinch gesture (simulated)
    const box = await trackCard.boundingBox();
    if (box) {
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;

      // Two-finger pinch in
      await page.touchscreen.tap(centerX - 50, centerY);
      await page.touchscreen.tap(centerX + 50, centerY);
      await page.waitForTimeout(300);
      await page.touchscreen.tap(centerX - 20, centerY);
      await page.touchscreen.tap(centerX + 20, centerY);
    }

    // Verify version switcher appeared
    await expect(page.locator('[data-testid="version-switcher"]')).toBeVisible();
  });

  test('should cancel swipe on gesture abort', async ({ page }) => {
    // Get first track card
    const trackCard = page.locator('[data-testid="track-card"]').first();

    // Start swipe but don't complete it
    const box = await trackCard.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2, { steps: 5 });
      // Release before threshold
      await page.mouse.up();
    }

    // Verify no action was triggered
    await expect(trackCard.locator('[data-testid="like-animation"]')).not.toBeVisible();
    await expect(trackCard).toBeVisible();
  });

  test('should support multiple gestures on same card', async ({ page }) => {
    // Get first track card
    const trackCard = page.locator('[data-testid="track-card"]').first();

    // Perform swipe right to like
    const box = await trackCard.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width + 100, box.y + box.height / 2, { steps: 10 });
      await page.mouse.up();
    }

    await page.waitForTimeout(500);

    // Verify like happened
    await expect(trackCard.locator('[data-testid="like-animation"]')).toBeVisible();

    // Wait for animation to complete
    await page.waitForTimeout(500);

    // Now perform long-press for menu
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(600);
      await page.mouse.up();
    }

    // Verify context menu appeared
    await expect(page.locator('[data-testid="track-context-menu"]')).toBeVisible();
  });
});

test.describe('Track Card Gestures - Desktop', () => {
  test('should work with mouse drag on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/library');

    // Wait for tracks to load
    await page.waitForSelector('[data-testid="track-card"]', { timeout: 5000 });

    // Get first track card
    const trackCard = page.locator('[data-testid="track-card"]').first();

    // Perform mouse drag (not swipe - desktop has different interactions)
    const box = await trackCard.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width + 100, box.y + box.height / 2, { steps: 10 });
      await page.mouse.up();
    }

    // On desktop, might not trigger swipe (different interaction model)
    // Verify card is still visible
    await expect(trackCard).toBeVisible();
  });
});
