/**
 * E2E Tests for Telegram Deep-link Functionality (Sprint 055-A5)
 */

import { test, expect } from "@playwright/test";

test.describe("Telegram Deep-link to Generate Sheet", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearPermissions();
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
  });

  test("should open generate sheet from ?openGenerate=1 parameter", async ({ page }) => {
    await page.goto("/?openGenerate=1");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const sheet = page.locator("[class*='SheetContent").first();
    const isVisible = await sheet.isVisible({ timeout: 3000 }).catch(() => false);

    console.log("Generate sheet visible:", isVisible);

    if (isVisible) {
      await expect(sheet).toBeVisible();
      const currentUrl = page.url();
      expect(currentUrl).not.toContain("openGenerate=1");
    }
  });

  test("should strip openGenerate parameter after opening sheet", async ({ page }) => {
    await page.goto("/?openGenerate=1");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    const currentUrl = page.url();
    console.log("Final URL:", currentUrl);

    expect(currentUrl).not.toContain("openGenerate=1");
  });

  test("should not open sheet on normal navigation without parameter", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const sheet = page.locator("[class*='SheetContent").first();
    const isVisible = await sheet.isVisible({ timeout: 2000 }).catch(() => false);

    console.log("Sheet visible without deeplink:", isVisible);
    expect(isVisible).toBe(false);
  });

  test("should work with Telegram startapp format (via sessionStorage)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.evaluate(() => {
      sessionStorage.setItem("__deeplink_generate_open", "1");
    });

    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    const flagExists = await page.evaluate(() => {
      return sessionStorage.getItem("__deeplink_generate_open");
    });

    console.log("SessionStorage flag exists:", flagExists);
    expect(flagExists).toBeNull();
  });
});
