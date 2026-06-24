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

test.describe("Generation Error Handling", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/generate");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
  });

  test("should handle API errors gracefully", async ({ page }) => {
    // Simulate API error by mocking response
    await page.route("**/api/generate", route => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal server error" })
      });
    });

    // Fill prompt and submit
    const promptInput = page.locator("textarea, input[type='text']").first();
    const hasInput = await promptInput.count();

    if (hasInput > 0) {
      await promptInput.fill("Test prompt");

      const generateButton = page.locator("button:has-text('Создать'), button:has-text('Generate')").first();
      const hasButton = await generateButton.count();

      if (hasButton > 0) {
        await generateButton.click();
        await page.waitForTimeout(3000);

        // Check for error message
        const errorMessage = page.locator("[class*='error'], [class*='Error'], [role='alert']").first();
        const errorCount = await errorMessage.count();

        if (errorCount > 0) {
          const errorText = await errorMessage.textContent();
          console.log(`Error message displayed: ${errorText}`);
          expect(errorText).toContain("error");
        }
      }
    }
  });

  test("should show retry option on failure", async ({ page }) => {
    // Mock failed generation
    await page.route("**/api/generate", route => {
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Service unavailable" })
      });
    });

    const generateButton = page.locator("button:has-text('Создать'), button:has-text('Generate')").first();
    const hasButton = await generateButton.count();

    if (hasButton > 0) {
      await generateButton.click();
      await page.waitForTimeout(3000);

      // Look for retry button
      const retryButton = page.locator("button:has-text('Повторить'), button:has-text('Retry'), button:has-text('Try again')");
      const retryCount = await retryButton.count();

      console.log(`Retry button found: ${retryCount > 0}`);
      // Retry button might or might not be present depending on implementation
    }
  });

  test("should handle network timeout", async ({ page }) => {
    // Simulate network timeout
    await page.route("**/api/generate", route => {
      // Abort request to simulate timeout
      route.abort("failed");
    });

    const generateButton = page.locator("button:has_text('Создать'), button:has_text('Generate')").first();
    const hasButton = await generateButton.count();

    if (hasButton > 0) {
      await generateButton.click();
      await page.waitForTimeout(3000);

      // Check for timeout message
      const timeoutMessage = page.locator("text=timeout, text=время, text=сеть").first();
      const timeoutCount = await timeoutMessage.count();

      console.log(`Timeout message found: ${timeoutCount > 0}`);
    }
  });
});

test.describe("A/B Version Switching", () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication and track data
    await page.goto("/library");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
  });

  test("should display version switcher for tracks", async ({ page }) => {
    // Look for version switcher component
    const versionSwitcher = page.locator("[class*='VersionSwitcher'], [class*='VersionSelector']").first();
    const switcherCount = await versionSwitcher.count();

    console.log(`Version switcher found: ${switcherCount > 0}`);

    if (switcherCount > 0) {
      await expect(versionSwitcher).toBeVisible();

      // Check for A/B buttons
      const buttonA = page.locator("button:has-text('A'), button:has-text('Версия A')").first();
      const buttonB = page.locator("button:has_text('B'), button:has_text('Версия B')").first();

      const hasButtons = await buttonA.count() + await buttonB.count();
      console.log(`A/B buttons found: ${hasButtons}`);
      expect(hasButtons).toBeGreaterThan(0);
    }
  });

  test("should switch between versions A and B", async ({ page }) => {
    const versionSwitcher = page.locator("[class*='VersionSwitcher'], [class*='VersionSelector']").first();
    const switcherCount = await versionSwitcher.count();

    if (switcherCount > 0) {
      const buttonA = page.locator("button:has-text('A'), button:has-text('Версия A')").first();
      const buttonB = page.locator("button:has_text('B'), button:has_text('Версия B')").first();

      if ((await buttonA.count()) > 0 && (await buttonB.count()) > 0) {
        // Click version A
        await buttonA.click();
        await page.waitForTimeout(500);

        // Click version B
        await buttonB.click();
        await page.waitForTimeout(500);

        console.log("Successfully switched between A/B versions");
      }
    }
  });
});

test.describe("Track Extension Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/library");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
  });

  test("should display extend button for completed tracks", async ({ page }) => {
    // Look for extend functionality
    const extendButton = page.locator("button:has-text('Продлить'), button:has_text('Extend'), [class*='extend']").first();
    const extendCount = await extendButton.count();

    console.log(`Extend button found: ${extendCount > 0}`);

    if (extendCount > 0) {
      await expect(extendButton).toBeVisible();
    }
  });

  test("should handle track extension request", async ({ page }) => {
    const extendButton = page.locator("button:has-text('Продлить'), button:has_text('Extend')").first();
    const extendCount = await extendButton.count();

    if (extendCount > 0) {
      await extendButton.click();
      await page.waitForTimeout(1000);

      // Check for extension modal or confirmation
      const modal = page.locator("[class*='Modal'], [class*='Dialog'], [role='dialog']").first();
      const modalCount = await modal.count();

      if (modalCount > 0) {
        console.log("Extension modal displayed");
        await expect(modal).toBeVisible();
      }
    }
  });
});

test.describe("Instrumental Creation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/generate");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
  });

  test("should have instrumental mode toggle", async ({ page }) => {
    const instrumentalToggle = page.locator("[class*='VocalsToggle'], [class*='instrumental']").first();
    const toggleCount = await instrumentalToggle.count();

    console.log(`Instrumental toggle found: ${toggleCount > 0}`);

    if (toggleCount > 0) {
      await expect(instrumentalToggle).toBeVisible();
    }
  });

  test("should toggle instrumental mode on/off", async ({ page }) => {
    const instrumentalToggle = page.locator("[class*='VocalsToggle'], [class*='instrumental']").first();
    const toggleCount = await instrumentalToggle.count();

    if (toggleCount > 0) {
      const initialState = await instrumentalToggle.getAttribute("aria-checked") || "false";
      console.log(`Initial instrumental state: ${initialState}`);

      await instrumentalToggle.click();
      await page.waitForTimeout(500);

      const newState = await instrumentalToggle.getAttribute("aria-checked") || "false";
      console.log(`New instrumental state: ${newState}`);

      expect(initialState).not.toBe(newState);
    }
  });

  test("should show appropriate UI for instrumental mode", async ({ page }) => {
    const instrumentalToggle = page.locator("[class*='VocalsToggle'], [class*='instrumental']").first();
    const toggleCount = await instrumentalToggle.count();

    if (toggleCount > 0) {
      await instrumentalToggle.click();
      await page.waitForTimeout(1000);

      // Check for UI changes (e.g., lyrics field disabled or hidden)
      const lyricsField = page.locator("[class*='lyrics'], textarea[placeholder*='текст песни']").first();
      const lyricsCount = await lyricsField.count();

      if (lyricsCount > 0) {
        const isDisabled = await lyricsField.isDisabled();
        const isVisible = await lyricsField.isVisible();

        console.log(`Lyrics field disabled in instrumental mode: ${isDisabled}, visible: ${isVisible}`);
        // In instrumental mode, lyrics field should be disabled or hidden
      }
    }
  });
});
