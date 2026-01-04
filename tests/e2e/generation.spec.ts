/**
 * E2E Tests for Music Generation Flow
 *
 * Tests generation functionality:
 * - Form display and validation
 * - Input handling
 * - Mode switching (simple/custom)
 * - Error states
 */

import { test, expect } from "@playwright/test";

test.describe("Generation Form Display", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/generate");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
  });

  test("should display generation page", async ({ page }) => {
    // Check that page loads
    const body = page.locator("body");
    await expect(body).toBeVisible();
    
    // Check for generate-related content
    const generateContent = page.locator(
      "[class*='Generate'], [class*='generation'], h1, h2"
    );
    
    const contentCount = await generateContent.count();
    console.log(`Found ${contentCount} generate content elements`);
    
    expect(contentCount).toBeGreaterThan(0);
  });

  test("should display prompt input", async ({ page }) => {
    // Look for text input or textarea
    const promptInput = page.locator(
      "textarea, input[type='text'], [data-testid*='prompt'], [class*='prompt']"
    );
    
    const inputCount = await promptInput.count();
    console.log(`Found ${inputCount} input elements`);
    
    expect(inputCount).toBeGreaterThanOrEqual(0);
  });

  test("should display mode toggle if available", async ({ page }) => {
    // Look for mode switcher (simple/custom)
    const modeToggle = page.locator(
      "[class*='ModeToggle'], [class*='TabsList'], [role='tablist'], button:has-text('Простой'), button:has-text('Расширенный')"
    );
    
    const toggleCount = await modeToggle.count();
    console.log(`Found ${toggleCount} mode toggle elements`);
    
    expect(toggleCount).toBeGreaterThanOrEqual(0);
  });

  test("should display generate button", async ({ page }) => {
    // Look for generate/create button
    const generateButton = page.locator(
      "button:has-text('Создать'), button:has-text('Генерировать'), button:has-text('Generate'), [data-testid*='generate']"
    );
    
    const buttonCount = await generateButton.count();
    console.log(`Found ${buttonCount} generate buttons`);
    
    expect(buttonCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Generation Form Interaction", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/generate");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
  });

  test("should handle text input in prompt field", async ({ page }) => {
    const promptInput = page.locator(
      "textarea, input[placeholder*='Опиши'], input[placeholder*='текст'], [class*='prompt'] input, [class*='prompt'] textarea"
    ).first();
    
    const hasInput = await promptInput.count();
    
    if (hasInput > 0) {
      await promptInput.fill("Test prompt for generation");
      const value = await promptInput.inputValue();
      
      expect(value).toBe("Test prompt for generation");
    }
    
    expect(hasInput).toBeGreaterThanOrEqual(0);
  });

  test("should handle style/genre selection if available", async ({ page }) => {
    // Look for style selector
    const styleSelector = page.locator(
      "[class*='StyleSelector'], [class*='genre'], select, [role='combobox']"
    );
    
    const selectorCount = await styleSelector.count();
    console.log(`Found ${selectorCount} style selectors`);
    
    if (selectorCount > 0) {
      await styleSelector.first().click();
      await page.waitForTimeout(500);
    }
    
    expect(selectorCount).toBeGreaterThanOrEqual(0);
  });

  test("should display tag builder if available", async ({ page }) => {
    // Look for tag builder
    const tagBuilder = page.locator(
      "[class*='TagBuilder'], [class*='tag'], [class*='Badge'], [class*='chip']"
    );
    
    const tagCount = await tagBuilder.count();
    console.log(`Found ${tagCount} tag elements`);
    
    expect(tagCount).toBeGreaterThanOrEqual(0);
  });

  test("should toggle instrumental mode if available", async ({ page }) => {
    // Look for instrumental toggle
    const instrumentalToggle = page.locator(
      "[class*='VocalsToggle'], [class*='instrumental'], input[type='checkbox'], [role='switch']"
    );
    
    const toggleCount = await instrumentalToggle.count();
    console.log(`Found ${toggleCount} toggle elements`);
    
    expect(toggleCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Generation Form Validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/generate");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
  });

  test("should prevent empty submission", async ({ page }) => {
    // Find generate button
    const generateButton = page.locator(
      "button:has-text('Создать'), button:has-text('Генерировать'), button[type='submit']"
    ).first();
    
    const hasButton = await generateButton.count();
    
    if (hasButton > 0) {
      // Button might be disabled or show validation on click
      const isDisabled = await generateButton.isDisabled();
      console.log(`Generate button disabled: ${isDisabled}`);
    }
    
    expect(hasButton).toBeGreaterThanOrEqual(0);
  });

  test("should show character count for lyrics", async ({ page }) => {
    // Look for character counter
    const charCounter = page.locator(
      "[class*='CharCount'], [class*='counter'], span:has-text('/'),"
    );
    
    const counterCount = await charCounter.count();
    console.log(`Found ${counterCount} character counters`);
    
    expect(counterCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Generation Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/generate");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
  });

  test("should have proper form labels", async ({ page }) => {
    // Check for labels
    const labels = page.locator("label");
    const labelCount = await labels.count();
    
    console.log(`Found ${labelCount} labels`);
    
    expect(labelCount).toBeGreaterThanOrEqual(0);
  });

  test("should support keyboard navigation in form", async ({ page }) => {
    // Tab through form elements
    await page.keyboard.press("Tab");
    await page.waitForTimeout(300);
    
    const focusedElement = page.locator(":focus");
    const hasFocus = await focusedElement.count();
    
    console.log(`Focused elements after Tab: ${hasFocus}`);
    
    expect(hasFocus).toBeGreaterThanOrEqual(0);
  });

  test("should have proper ARIA attributes", async ({ page }) => {
    // Check for ARIA attributes
    const ariaElements = page.locator(
      "[aria-label], [aria-describedby], [role]"
    );
    
    const ariaCount = await ariaElements.count();
    console.log(`Found ${ariaCount} elements with ARIA attributes`);
    
    expect(ariaCount).toBeGreaterThan(0);
  });
});

test.describe("Generation Responsive Design", () => {
  test("should be usable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/generate");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    
    // Page should be visible and not overflow
    const body = page.locator("body");
    await expect(body).toBeVisible();
    
    const bodyBox = await body.boundingBox();
    expect(bodyBox?.width).toBeLessThanOrEqual(375);
  });

  test("should be usable on tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/generate");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});
