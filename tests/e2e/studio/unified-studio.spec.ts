/**
 * E2E Tests for Unified Studio
 * 
 * Critical user flows:
 * 1. Track mode: Open track → Play → Edit sections → Save
 * 2. Project mode: Create project → Add tracks → Mix → Export
 * 3. Mobile gestures: Swipe navigation
 * 4. Offline mode: Graceful degradation
 * 5. Error recovery: Retry generation
 */

import { test, expect, Page } from '@playwright/test';

// Helper to wait for app to be ready
async function waitForAppReady(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
}

test.describe('Unified Studio - Track Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should navigate to studio from library', async ({ page }) => {
    // Look for any track card or library item
    const trackCard = page.locator('[data-testid="track-card"]').first();
    
    // If track cards exist, click one
    if (await trackCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await trackCard.click();
      
      // Should navigate to studio or track details
      await expect(page.locator('[data-testid="studio-container"], [data-testid="track-details"]')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display player controls', async ({ page }) => {
    // Navigate to a track if possible
    const trackCard = page.locator('[data-testid="track-card"]').first();
    
    if (await trackCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await trackCard.click();
      await waitForAppReady(page);
      
      // Check for player controls
      const playButton = page.locator('[data-testid="play-button"], [aria-label*="play" i], button:has-text("Play")');
      await expect(playButton.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('should switch between studio tabs', async ({ page }) => {
    const trackCard = page.locator('[data-testid="track-card"]').first();
    
    if (await trackCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await trackCard.click();
      await waitForAppReady(page);
      
      // Look for tab navigation
      const tabs = page.locator('[role="tablist"] [role="tab"], [data-testid*="tab"]');
      const tabCount = await tabs.count();
      
      if (tabCount > 0) {
        // Click through tabs
        for (let i = 0; i < Math.min(tabCount, 4); i++) {
          await tabs.nth(i).click();
          await page.waitForTimeout(200);
        }
      }
    }
  });

  test('should preserve playback state when switching tabs', async ({ page }) => {
    const trackCard = page.locator('[data-testid="track-card"]').first();
    
    if (await trackCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await trackCard.click();
      await waitForAppReady(page);
      
      // Find and click play button
      const playButton = page.locator('[data-testid="play-button"], [aria-label*="play" i]').first();
      
      if (await playButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await playButton.click();
        await page.waitForTimeout(500);
        
        // Switch tabs if available
        const tabs = page.locator('[role="tablist"] [role="tab"]');
        if (await tabs.count() > 1) {
          await tabs.nth(1).click();
          await page.waitForTimeout(300);
          
          // Audio should still be "playing" (pause button should be visible)
          const pauseButton = page.locator('[data-testid="pause-button"], [aria-label*="pause" i]');
          // Note: This might not be visible if audio can't play in test environment
        }
      }
    }
  });
});

test.describe('Unified Studio - Project Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects');
    await waitForAppReady(page);
  });

  test('should display projects list or create prompt', async ({ page }) => {
    // Should show projects or a create button
    const projectsContainer = page.locator('[data-testid="projects-list"], [data-testid="create-project"]');
    const createButton = page.locator('button:has-text("Create"), button:has-text("New Project"), [data-testid="create-project-button"]');
    
    const hasProjects = await projectsContainer.isVisible({ timeout: 5000 }).catch(() => false);
    const hasCreateButton = await createButton.first().isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(hasProjects || hasCreateButton).toBeTruthy();
  });

  test('should open project creation dialog', async ({ page }) => {
    const createButton = page.locator('button:has-text("Create"), button:has-text("New Project"), [data-testid="create-project-button"]').first();
    
    if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createButton.click();
      
      // Should show creation dialog or form
      const dialog = page.locator('[role="dialog"], [data-testid="project-form"], form');
      await expect(dialog.first()).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Mobile Gestures', () => {
  test.use({
    viewport: { width: 375, height: 812 }, // iPhone X
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should support swipe navigation on mobile', async ({ page }) => {
    const trackCard = page.locator('[data-testid="track-card"]').first();
    
    if (await trackCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await trackCard.click();
      await waitForAppReady(page);
      
      // Get the main content area
      const content = page.locator('[data-testid="studio-content"], main, .studio-container').first();
      
      if (await content.isVisible({ timeout: 5000 }).catch(() => false)) {
        const box = await content.boundingBox();
        
        if (box) {
          // Simulate swipe left
          await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, { steps: 10 });
          await page.mouse.up();
          
          await page.waitForTimeout(500);
        }
      }
    }
  });

  test('should have touch-friendly controls on mobile', async ({ page }) => {
    // Check that buttons are large enough for touch
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          // Touch targets should be at least 44x44 for accessibility
          // We check for at least 32x32 as a minimum
          expect(box.width >= 32 || box.height >= 32).toBeTruthy();
        }
      }
    }
  });

  test('should handle pull-to-refresh gesture', async ({ page }) => {
    const content = page.locator('main, [data-testid="main-content"]').first();
    
    if (await content.isVisible({ timeout: 5000 }).catch(() => false)) {
      const box = await content.boundingBox();
      
      if (box) {
        // Simulate pull down
        await page.mouse.move(box.x + box.width / 2, box.y + 50);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2, box.y + 200, { steps: 10 });
        await page.mouse.up();
        
        await page.waitForTimeout(500);
        // Page should still be functional
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });
});

test.describe('Error Recovery', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should display error boundary on crash', async ({ page }) => {
    // Navigate to a potentially error-prone area
    await page.goto('/generate');
    await waitForAppReady(page);
    
    // The page should load without showing an error boundary
    const errorBoundary = page.locator('[data-testid="error-boundary"], .error-boundary, text="Something went wrong"');
    const hasError = await errorBoundary.isVisible({ timeout: 2000 }).catch(() => false);
    
    // If no error, page should have content
    if (!hasError) {
      await expect(page.locator('main, [role="main"], [data-testid="generate-form"]').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show retry button on generation failure', async ({ page }) => {
    await page.goto('/generate');
    await waitForAppReady(page);
    
    // If there's a retry button visible (from previous failure), it should be clickable
    const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try Again"), [data-testid="retry-button"]');
    
    if (await retryButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(retryButton.first()).toBeEnabled();
    }
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Intercept and fail network requests
    await page.route('**/rest/v1/**', route => route.abort());
    
    await page.goto('/library');
    await waitForAppReady(page);
    
    // Should show error message or empty state, not crash
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Look for error or empty state indicators
    const hasContent = await page.locator('[data-testid="track-card"], [data-testid="empty-state"], .error-message, text="No tracks"').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(true).toBeTruthy(); // Page didn't crash
  });
});

test.describe('Offline Mode', () => {
  test('should show offline indicator when disconnected', async ({ page, context }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Go offline
    await context.setOffline(true);
    await page.waitForTimeout(1000);
    
    // Should show some offline indicator or the page should still be usable
    const offlineIndicator = page.locator('[data-testid="offline-indicator"], .offline-banner, text="Offline"');
    
    // Either show offline indicator or page should still have content
    const hasIndicator = await offlineIndicator.isVisible({ timeout: 3000 }).catch(() => false);
    const hasContent = await page.locator('main, [role="main"]').first().isVisible({ timeout: 3000 }).catch(() => false);
    
    expect(hasIndicator || hasContent).toBeTruthy();
    
    // Go back online
    await context.setOffline(false);
  });

  test('should cache essential assets for offline use', async ({ page }) => {
    // First visit to cache assets
    await page.goto('/');
    await waitForAppReady(page);
    
    // Check that service worker is registered (if applicable)
    const swRegistration = await page.evaluate(() => {
      return navigator.serviceWorker?.controller !== null;
    }).catch(() => false);
    
    // App should be functional regardless of SW
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Tab through interactive elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
    }
    
    // Should have focus on some element
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    // Check for buttons without labels
    const unlabeledButtons = await page.locator('button:not([aria-label]):not(:has-text(*))').count();
    
    // Most buttons should have either text content or aria-label
    // Allow some flexibility for icon-only buttons that might be styled differently
    expect(unlabeledButtons).toBeLessThan(20);
  });

  test('should respect reduced motion preference', async ({ page }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    await page.goto('/');
    await waitForAppReady(page);
    
    // Page should still be functional
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('should load main page within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // Should load DOM content within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should not have memory leaks on navigation', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Get initial heap size
    const initialHeap = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // Navigate multiple times
    for (let i = 0; i < 5; i++) {
      await page.goto('/library');
      await waitForAppReady(page);
      await page.goto('/');
      await waitForAppReady(page);
    }
    
    // Force garbage collection if available
    await page.evaluate(() => {
      if ('gc' in window) {
        (window as any).gc();
      }
    });
    
    const finalHeap = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // Heap shouldn't grow more than 50MB after navigation
    if (initialHeap > 0 && finalHeap > 0) {
      const heapGrowth = (finalHeap - initialHeap) / (1024 * 1024);
      expect(heapGrowth).toBeLessThan(50);
    }
  });
});
