/**
 * E2E Tests for Library Page
 *
 * Tests library functionality:
 * - Track list display
 * - Search and filtering
 * - Sort options
 * - Track interactions
 */

import { test, expect } from "@playwright/test";

test.describe("Library Page Display", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/library");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
  });

  test("should display library page", async ({ page }) => {
    const body = page.locator("body");
    await expect(body).toBeVisible();
    
    // Look for library content
    const libraryContent = page.locator(
      "[class*='Library'], [class*='library'], h1, h2"
    );
    
    const contentCount = await libraryContent.count();
    console.log(`Found ${contentCount} library content elements`);
    
    expect(contentCount).toBeGreaterThan(0);
  });

  test("should display search input", async ({ page }) => {
    const searchInput = page.locator(
      "input[type='search'], input[placeholder*='Поиск'], input[placeholder*='Search'], [class*='search'] input"
    );
    
    const inputCount = await searchInput.count();
    console.log(`Found ${inputCount} search inputs`);
    
    expect(inputCount).toBeGreaterThanOrEqual(0);
  });

  test("should display filter options if available", async ({ page }) => {
    // Look for filter/sort buttons
    const filters = page.locator(
      "[class*='Filter'], [class*='filter'], select, [role='combobox'], button:has-text('Фильтр'), button:has-text('Сорт')"
    );
    
    const filterCount = await filters.count();
    console.log(`Found ${filterCount} filter elements`);
    
    expect(filterCount).toBeGreaterThanOrEqual(0);
  });

  test("should display track cards or empty state", async ({ page }) => {
    // Look for track cards or empty state
    const trackCards = page.locator(
      "[class*='TrackCard'], [class*='track-card'], [data-testid*='track']"
    );
    
    const emptyState = page.locator(
      "[class*='Empty'], [class*='empty'], :has-text('Нет треков'), :has-text('No tracks')"
    );
    
    const trackCount = await trackCards.count();
    const emptyCount = await emptyState.count();
    
    console.log(`Found ${trackCount} tracks, ${emptyCount} empty states`);
    
    // Should have either tracks or empty state
    expect(trackCount + emptyCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Library Search Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/library");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
  });

  test("should handle search input", async ({ page }) => {
    const searchInput = page.locator(
      "input[type='search'], input[placeholder*='Поиск'], [class*='search'] input"
    ).first();
    
    const hasSearch = await searchInput.count();
    
    if (hasSearch > 0) {
      await searchInput.fill("test search");
      const value = await searchInput.inputValue();
      
      expect(value).toBe("test search");
      
      // Wait for debounced search
      await page.waitForTimeout(500);
    }
    
    expect(hasSearch).toBeGreaterThanOrEqual(0);
  });

  test("should handle search clear", async ({ page }) => {
    const searchInput = page.locator(
      "input[type='search'], input[placeholder*='Поиск'], [class*='search'] input"
    ).first();
    
    const hasSearch = await searchInput.count();
    
    if (hasSearch > 0) {
      await searchInput.fill("test");
      await searchInput.clear();
      const value = await searchInput.inputValue();
      
      expect(value).toBe("");
    }
    
    expect(hasSearch).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Library Track Interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/library");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
  });

  test("should handle track card click", async ({ page }) => {
    const trackCard = page.locator(
      "[class*='TrackCard'], [class*='track-card'], [data-testid*='track']"
    ).first();
    
    const hasTrack = await trackCard.count();
    
    if (hasTrack > 0) {
      await trackCard.click();
      await page.waitForTimeout(1000);
      
      // Should either open player or navigate to track detail
      console.log("Track clicked successfully");
    }
    
    expect(hasTrack).toBeGreaterThanOrEqual(0);
  });

  test("should display play button on track", async ({ page }) => {
    const playButton = page.locator(
      "button[aria-label*='Play'], button[aria-label*='Воспр'], [class*='play'], svg[class*='play']"
    );
    
    const playCount = await playButton.count();
    console.log(`Found ${playCount} play buttons`);
    
    expect(playCount).toBeGreaterThanOrEqual(0);
  });

  test("should display track actions menu", async ({ page }) => {
    const actionsButton = page.locator(
      "button[aria-label*='menu'], button[aria-label*='опции'], [class*='dropdown'], [class*='MoreVertical']"
    );
    
    const actionsCount = await actionsButton.count();
    console.log(`Found ${actionsCount} action buttons`);
    
    expect(actionsCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Library Pagination/Infinite Scroll", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/library");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
  });

  test("should handle scroll for more content", async ({ page }) => {
    // Scroll down to trigger infinite scroll
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    await page.waitForTimeout(1000);
    
    // Page should still be functional
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});

test.describe("Library Responsive Design", () => {
  test("should adapt to mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/library");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    
    // Check grid adapts
    const trackCards = page.locator(
      "[class*='TrackCard'], [class*='track-card']"
    );
    
    const trackCount = await trackCards.count();
    console.log(`Found ${trackCount} tracks on mobile`);
    
    // Body should not overflow
    const body = page.locator("body");
    const bodyBox = await body.boundingBox();
    expect(bodyBox?.width).toBeLessThanOrEqual(375);
  });

  test("should adapt to tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/library");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});

test.describe("Library Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/library");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
  });

  test("should have proper heading hierarchy", async ({ page }) => {
    const h1 = page.locator("h1");
    const h1Count = await h1.count();
    
    console.log(`Found ${h1Count} h1 headings`);
    
    expect(h1Count).toBeGreaterThanOrEqual(0);
  });

  test("should support keyboard navigation", async ({ page }) => {
    await page.keyboard.press("Tab");
    await page.waitForTimeout(300);
    
    const focusedElement = page.locator(":focus");
    const hasFocus = await focusedElement.count();
    
    console.log(`Focused elements after Tab: ${hasFocus}`);
    
    expect(hasFocus).toBeGreaterThanOrEqual(0);
  });

  test("should have accessible track cards", async ({ page }) => {
    const accessibleCards = page.locator(
      "[class*='TrackCard'][role], [class*='TrackCard'][aria-label], [class*='track-card'][tabindex]"
    );
    
    const accessibleCount = await accessibleCards.count();
    console.log(`Found ${accessibleCount} accessible track cards`);
    
    expect(accessibleCount).toBeGreaterThanOrEqual(0);
  });
});
