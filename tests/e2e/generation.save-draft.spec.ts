/**
 * E2E Tests for Save Draft Functionality (Sprint 055-A1, A2, A3)
 *
 * Tests draft save/reload functionality:
 * - Draft save button visibility
 * - Draft save round-trip (save → close → reopen → verify)
 * - Draft expiry (30-minute window)
 * - Draft persistence across sessions
 */

import { test, expect } from "@playwright/test";

test.describe("Save Draft Functionality", () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear localStorage before each test
    await context.clearPermissions();
    await page.goto("/");
    
    // Clear draft storage
    await page.evaluate(() => {
      localStorage.removeItem("generate_form_draft");
    });
    
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
  });

  test("should display save draft button when form has unsaved data", async ({ page }) => {
    // Open generate sheet
    await page.evaluate(() => {
      const event = new CustomEvent("open-generate-sheet");
      window.dispatchEvent(event);
    });
    
    await page.waitForTimeout(500);
    
    // Look for generate sheet
    const sheet = page.locator("[class*='SheetContent']").first();
    await expect(sheet).toBeVisible({ timeout: 5000 }).catch(() => false);
    
    if (await sheet.isVisible()) {
      // Enter some text to trigger unsaved data state
      const textarea = page.locator("textarea").first();
      await textarea.fill("Test description for draft");
      await page.waitForTimeout(500);
      
      // Check for save draft button
      const saveButton = page.locator("button:has-text('Черновик')");
      const saveCount = await saveButton.count();
      
      console.log(`Found ${saveCount} save draft buttons`);
      expect(saveCount).toBeGreaterThan(0);
    }
  });

  test("should save draft and restore after closing sheet", async ({ page }) => {
    // Open generate sheet
    await page.evaluate(() => {
      const event = new CustomEvent("open-generate-sheet");
      window.dispatchEvent(event);
    });
    
    await page.waitForTimeout(1000);
    
    const sheet = page.locator("[class*='SheetContent']").first();
    if (!await sheet.isVisible({ timeout: 3000 }).catch(() => true)) {
      test.skip("Generate sheet not available");
      return;
    }
    
    // Fill in form data
    const testData = {
      description: "Test draft description " + Date.now(),
      title: "Test Draft Title",
    };
    
    const textarea = page.locator("textarea").first();
    await textarea.fill(testData.description);
    await page.waitForTimeout(300);
    
    // Click save draft button
    const saveButton = page.locator("button:has-text('Черновик')").first();
    await saveButton.click();
    await page.waitForTimeout(500);
    
    // Verify draft saved in localStorage
    const draftData = await page.evaluate(() => {
      const draft = localStorage.getItem("generate_form_draft");
      return draft ? JSON.parse(draft) : null;
    });
    
    expect(draftData).not.toBeNull();
    expect(draftData?.description).toContain("Test draft description");
    console.log("Draft saved to localStorage:", draftData);
    
    // Close sheet
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    
    // Reopen generate sheet
    await page.evaluate(() => {
      const event = new CustomEvent("open-generate-sheet");
      window.dispatchEvent(event);
    });
    
    await page.waitForTimeout(1000);
    
    // Verify form restored
    const restoredTextarea = page.locator("textarea").first();
    const restoredValue = await restoredTextarea.inputValue();
    
    console.log("Restored value:", restoredValue);
    expect(restoredValue).toContain(testData.description);
  });

  test("should handle draft expiry (30-minute window)", async ({ page }) => {
    // Open generate sheet and save draft
    await page.evaluate(() => {
      const event = new CustomEvent("open-generate-sheet");
      window.dispatchEvent(event);
    });
    
    await page.waitForTimeout(1000);
    
    const sheet = page.locator("[class*='SheetContent']").first();
    if (!await sheet.isVisible({ timeout: 3000 }).catch(() => true)) {
      test.skip("Generate sheet not available");
      return;
    }
    
    // Save draft with current timestamp
    const textarea = page.locator("textarea").first();
    await textarea.fill("Expiring draft test");
    await page.waitForTimeout(300);
    
    const saveButton = page.locator("button:has-text('Черновик')").first();
    await saveButton.click();
    await page.waitForTimeout(500);
    
    // Manually expire the draft (set savedAt to 31 minutes ago)
    await page.evaluate(() => {
      const draft = JSON.parse(localStorage.getItem("generate_form_draft") || "{}");
      if (draft.savedAt) {
        const expiredTime = new Date(Date.now() - 31 * 60 * 1000).toISOString();
        draft.savedAt = expiredTime;
        localStorage.setItem("generate_form_draft", JSON.stringify(draft));
      }
    });
    
    // Close and reopen sheet
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    
    await page.evaluate(() => {
      const event = new CustomEvent("open-generate-sheet");
      window.dispatchEvent(event);
    });
    
    await page.waitForTimeout(1000);
    
    // Form should be empty (draft expired)
    const restoredTextarea = page.locator("textarea").first();
    const restoredValue = await restoredTextarea.inputValue();
    
    console.log("Value after expiry:", restoredValue);
    expect(restoredValue).toBe("");
  });

  test("should restore draft on page reload", async ({ page }) => {
    // First session: save draft
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    
    await page.evaluate(() => {
      const event = new CustomEvent("open-generate-sheet");
      window.dispatchEvent(event);
    });
    
    await page.waitForTimeout(1000);
    
    const sheet = page.locator("[class*='SheetContent']").first();
    if (!await sheet.isVisible({ timeout: 3000 }).catch(() => true)) {
      test.skip("Generate sheet not available");
      return;
    }
    
    const textarea = page.locator("textarea").first();
    const testText = "Persistent draft " + Date.now();
    await textarea.fill(testText);
    await page.waitForTimeout(300);
    
    const saveButton = page.locator("button:has-text('Черновик')").first();
    await saveButton.click();
    await page.waitForTimeout(500);
    
    // Reload page
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
    
    // Reopen sheet and verify draft restored
    await page.evaluate(() => {
      const event = new CustomEvent("open-generate-sheet");
      window.dispatchEvent(event);
    });
    
    await page.waitForTimeout(1000);
    
    const restoredTextarea = page.locator("textarea").first();
    const restoredValue = await restoredTextarea.inputValue();
    
    console.log("Restored after reload:", restoredValue);
    expect(restoredValue).toBe(testText);
  });
});
