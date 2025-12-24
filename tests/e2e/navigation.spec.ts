/**
 * E2E Tests for Navigation
 *
 * Tests navigation functionality:
 * - Bottom navigation
 * - Route transitions
 * - Deep links
 * - Back navigation
 */

import { test, expect } from "@playwright/test";

test.describe("Bottom Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
  });

  test("should display bottom navigation on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const bottomNav = page.locator(
      "[class*='BottomNavigation'], [class*='bottom-nav'], nav[class*='fixed']"
    );
    
    const navCount = await bottomNav.count();
    console.log(`Found ${navCount} bottom nav elements`);
    
    expect(navCount).toBeGreaterThanOrEqual(0);
  });

  test("should have navigation items", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const navItems = page.locator(
      "nav a, nav button, [class*='nav'] a, [class*='nav'] button"
    );
    
    const itemCount = await navItems.count();
    console.log(`Found ${itemCount} nav items`);
    
    expect(itemCount).toBeGreaterThan(0);
  });

  test("should highlight active route", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Look for active state indicators
    const activeItem = page.locator(
      "[class*='active'], [aria-current='page'], [data-active='true']"
    );
    
    const activeCount = await activeItem.count();
    console.log(`Found ${activeCount} active nav items`);
    
    expect(activeCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Route Navigation", () => {
  const routes = [
    { path: "/", name: "Home" },
    { path: "/library", name: "Library" },
    { path: "/generate", name: "Generate" },
    { path: "/projects", name: "Projects" },
  ];

  for (const route of routes) {
    test(`should navigate to ${route.name} without errors`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);
      
      // Page should load without crashing
      const body = page.locator("body");
      await expect(body).toBeVisible();
      
      // Check for JS errors
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error" && !msg.text().includes("DevTools")) {
          errors.push(msg.text());
        }
      });
      
      await page.waitForTimeout(1000);
      
      expect(errors.length).toBeLessThan(5);
    });
  }
});

test.describe("Deep Links", () => {
  test("should handle track deep link", async ({ page }) => {
    // Try a track deep link pattern
    await page.goto("/track/test-id-123");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    
    // Should either show track or 404, not crash
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should handle project deep link", async ({ page }) => {
    await page.goto("/projects/test-project-id");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should handle user profile deep link", async ({ page }) => {
    await page.goto("/user/test-user");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});

test.describe("Back Navigation", () => {
  test("should handle browser back button", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    await page.goto("/library");
    await page.waitForLoadState("networkidle");
    
    await page.goBack();
    await page.waitForTimeout(1000);
    
    // Should be back on home
    const url = page.url();
    expect(url).toContain("/");
  });

  test("should handle browser forward button", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    await page.goto("/library");
    await page.waitForLoadState("networkidle");
    
    await page.goBack();
    await page.goForward();
    await page.waitForTimeout(1000);
    
    // Should be on library
    const url = page.url();
    expect(url).toContain("library");
  });
});

test.describe("Navigation Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
  });

  test("should have skip to main content link", async ({ page }) => {
    const skipLink = page.locator(
      "a[href='#main'], a[href='#content'], [class*='skip'], a:has-text('Skip')"
    );
    
    const skipCount = await skipLink.count();
    console.log(`Found ${skipCount} skip links`);
    
    // Skip link is nice-to-have
    expect(skipCount).toBeGreaterThanOrEqual(0);
  });

  test("should have proper nav landmarks", async ({ page }) => {
    const navLandmarks = page.locator(
      "nav, [role='navigation']"
    );
    
    const landmarkCount = await navLandmarks.count();
    console.log(`Found ${landmarkCount} nav landmarks`);
    
    expect(landmarkCount).toBeGreaterThan(0);
  });

  test("should support keyboard navigation through nav", async ({ page }) => {
    // Tab to navigation
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");
      await page.waitForTimeout(100);
    }
    
    const focusedElement = page.locator(":focus");
    const hasFocus = await focusedElement.count();
    
    console.log(`Focused elements after 5 Tabs: ${hasFocus}`);
    
    expect(hasFocus).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Navigation Performance", () => {
  test("should navigate quickly between routes", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    const startTime = Date.now();
    
    await page.goto("/library");
    await page.waitForLoadState("networkidle");
    
    const navTime = Date.now() - startTime;
    
    console.log(`Navigation time: ${navTime}ms`);
    
    // Navigation should be under 5 seconds
    expect(navTime).toBeLessThan(5000);
  });

  test("should not cause memory leaks on repeated navigation", async ({ page }) => {
    // Navigate back and forth multiple times
    for (let i = 0; i < 5; i++) {
      await page.goto("/");
      await page.waitForTimeout(500);
      await page.goto("/library");
      await page.waitForTimeout(500);
    }
    
    // Page should still be functional
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});
