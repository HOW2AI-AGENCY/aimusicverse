/**
 * T084: E2E Mixer Optimization Tests
 * Tests: Mixer re-render reduction, smooth volume changes, efficient state updates
 */

import { test, expect, Page } from '@playwright/test';

const STUDIO_URL = '/studio-v2/unified/test-track-id';

/**
 * Count render counts for mixer components
 */
async function getMixerRenderCounts(page: Page) {
  return await page.evaluate(() => {
    const counts: Record<string, number> = {};

    // Check if components have render tracking
    const mixerElements = document.querySelectorAll('[data-render-count]');
    mixerElements.forEach(el => {
      const componentId = el.getAttribute('data-component-id') || 'unknown';
      const renderCount = parseInt(el.getAttribute('data-render-count') || '0');
      counts[componentId] = renderCount;
    });

    return counts;
  });
}

/**
 * Measure FPS during volume slider drag
 */
async function measureVolumeChangeFPS(page: Page, stemIndex: number) {
  const fpsData = await page.evaluate(
    async ({ idx }) => {
      const slider = document.querySelector(`[data-testid="stem-volume-${idx}"]`);
      if (!slider) return { fps: 0, frames: 0 };

      let frameCount = 0;
      let startTime = performance.now();

      const measureFrame = () => {
        frameCount++;
        requestAnimationFrame(measureFrame);
      };

      requestAnimationFrame(measureFrame);

      // Simulate dragging slider
      const sliderElement = slider as HTMLInputElement;
      for (let i = 0; i < 20; i++) {
        sliderElement.value = (0.5 + Math.sin(i * 0.3) * 0.5).toFixed(2);
        sliderElement.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, 16));
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      return {
        fps: Math.round((frameCount * 1000) / duration),
        frames: frameCount,
      };
    },
    { idx: stemIndex }
  );

  return fpsData;
}

test.describe('T084 - Mixer Re-render Optimization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(STUDIO_URL);
    await page.waitForSelector('[data-testid="unified-studio"]', { timeout: 10000 });
  });

  test('should render mixer with 10 stems in <500ms', async ({ page }) => {
    const startTime = Date.now();

    // Load mixer with stems
    await page.evaluate(() => {
      const event = new CustomEvent('stems-loaded', {
        detail: {
          stems: Array.from({ length: 10 }, (_, i) => ({
            id: `stem-${i}`,
            name: `Stem ${i}`,
            url: `https://example.com/stem${i}.mp3`,
          })),
        },
      });
      window.dispatchEvent(event);
    });

    await page.waitForSelector('[data-testid="stem-mixer"]', { timeout: 5000 });

    const renderTime = Date.now() - startTime;

    expect(renderTime).toBeLessThan(500);
  });

  test('should re-render ≤2 times per volume change', async ({ page }) => {
    // Enable render tracking
    await page.evaluate(() => {
      (window as any).__trackRenders = true;
    });

    // Get initial render count
    const initialCounts = await getMixerRenderCounts(page);

    // Change volume for stem 0
    await page.click('[data-testid="stem-volume-0"]');
    await page.fill('[data-testid="stem-volume-0"]', '0.75');
    await page.keyboard.press('Enter');

    // Wait for state to update
    await page.waitForTimeout(100);

    // Get final render count
    const finalCounts = await getMixerRenderCounts(page);

    // Calculate re-renders
    const stem0Initial = initialCounts['stem-channel-0'] || 0;
    const stem0Final = finalCounts['stem-channel-0'] || 0;
    const reRenderCount = stem0Final - stem0Initial;

    expect(reRenderCount).toBeLessThanOrEqual(2);
  });

  test('should not re-render other stems when one stem volume changes', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__trackRenders = true;
    });

    const initialCounts = await getMixerRenderCounts(page);

    // Change volume for stem 0
    await page.fill('[data-testid="stem-volume-0"]', '0.6');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);

    const finalCounts = await getMixerRenderCounts(page);

    // Stem 1 should not have re-rendered
    const stem1Initial = initialCounts['stem-channel-1'] || 0;
    const stem1Final = finalCounts['stem-channel-1'] || 0;

    expect(stem1Final).toBe(stem1Initial);
  });

  test('should batch multiple rapid volume changes', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__trackRenders = true;
    });

    const initialCounts = await getMixerRenderCounts(page);

    // Rapidly change volume
    for (let i = 0; i < 10; i++) {
      await page.fill('[data-testid="stem-volume-0']", (0.5 + i * 0.05).toFixed(2));
    }

    await page.waitForTimeout(200);

    const finalCounts = await getMixerRenderCounts(page);

    const stem0Initial = initialCounts['stem-channel-0'] || 0;
    const stem0Final = finalCounts['stem-channel-0'] || 0;
    const reRenderCount = stem0Final - stem0Initial;

    // Should batch updates efficiently
    expect(reRenderCount).toBeLessThan(5);
  });

  test('should maintain ≥55 FPS during volume slider drag', async ({ page }) => {
    await page.click('[data-testid="mixer-tab"]');

    const { fps } = await measureVolumeChangeFPS(page, 0);

    expect(fps).toBeGreaterThanOrEqual(55);
  });

  test('should toggle mute without re-rendering all stems', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__trackRenders = true;
    });

    const initialCounts = await getMixerRenderCounts(page);

    // Toggle mute for stem 0
    await page.click('[data-testid="stem-mute-0"]');
    await page.waitForTimeout(100);

    const finalCounts = await getMixerRenderCounts(page);

    // Other stems should not re-render
    const stem1Initial = initialCounts['stem-channel-1'] || 0;
    const stem1Final = finalCounts['stem-channel-1'] || 0;

    expect(stem1Final).toBe(stem1Initial);
  });

  test('should toggle solo efficiently', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__trackRenders = true;
    });

    const startTime = Date.now();

    // Toggle solo for multiple stems
    await page.click('[data-testid="stem-solo-0"]');
    await page.click('[data-testid="stem-solo-1"]');
    await page.click('[data-testid="stem-solo-2"]');

    const duration = Date.now() - startTime;

    // Should complete quickly
    expect(duration).toBeLessThan(200);
  });

  test('should handle pan changes efficiently', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__trackRenders = true;
    });

    const initialCounts = await getMixerRenderCounts(page);

    // Change pan for stem 0
    await page.fill('[data-testid="stem-pan-0"]', '-0.5');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);

    const finalCounts = await getMixerRenderCounts(page);

    const stem0Initial = initialCounts['stem-channel-0'] || 0;
    const stem0Final = finalCounts['stem-channel-0'] || 0;
    const reRenderCount = stem0Final - stem0Initial;

    expect(reRenderCount).toBeLessThanOrEqual(2);
  });

  test('should update master volume efficiently', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__trackRenders = true;
    });

    const startTime = Date.now();

    // Change master volume
    await page.fill('[data-testid="master-volume"]', '0.8');
    await page.keyboard.press('Enter');

    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(100);
  });

  test('should debounce rapid volume changes from slider', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__trackRenders = true;
    });

    const initialCounts = await getMixerRenderCounts(page);

    // Simulate rapid slider events
    const slider = page.locator('[data-testid="stem-volume-0"]');

    for (let i = 0; i < 20; i++) {
      await slider.fill((0.5 + Math.sin(i * 0.5) * 0.5).toFixed(2));
    }

    await page.waitForTimeout(300); // Wait for debounce

    const finalCounts = await getMixerRenderCounts(page);

    const stem0Initial = initialCounts['stem-channel-0'] || 0;
    const stem0Final = finalCounts['stem-channel-0'] || 0;
    const reRenderCount = stem0Final - stem0Initial;

    // Debouncing should reduce renders
    expect(reRenderCount).toBeLessThan(10);
  });

  test('should reset mixer state efficiently', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__trackRenders = true;
    });

    // Modify mixer state
    await page.fill('[data-testid="stem-volume-0"]', '0.3');
    await page.click('[data-testid="stem-mute-1"]');
    await page.click('[data-testid="stem-solo-2"]');

    await page.waitForTimeout(100);

    // Reset
    const startTime = Date.now();
    await page.click('[data-testid="mixer-reset"]');
    const duration = Date.now() - startTime;

    // Should reset quickly
    expect(duration).toBeLessThan(200);

    // Verify reset values
    const volume = await page.inputValue('[data-testid="stem-volume-0"]');
    expect(volume).toBe('1.00');
  });

  test('should handle 10+ stems without performance degradation', async ({ page }) => {
    // Load 10 stems
    await page.evaluate(() => {
      const event = new CustomEvent('stems-loaded', {
        detail: {
          stems: Array.from({ length: 10 }, (_, i) => ({
            id: `stem-${i}`,
            name: `Stem ${i}`,
            url: `https://example.com/stem${i}.mp3`,
          })),
        },
      });
      window.dispatchEvent(event);
    });

    await page.waitForTimeout(500);

    // Measure interaction time
    const startTime = Date.now();

    // Change volume for first stem
    await page.fill('[data-testid="stem-volume-0"]', '0.7');
    await page.keyboard.press('Enter');

    const duration = Date.now() - startTime;

    // Should still be fast with 10 stems
    expect(duration).toBeLessThan(100);
  });

  test('should use React.memo for stem channels', async ({ page }) => {
    // This test verifies that stem channels are memoized
    await page.evaluate(() => {
      (window as any).__trackRenders = true;
    });

    const initialCounts = await getMixerRenderCounts(page);

    // Rerender by changing unrelated state
    await page.click('[data-testid="lyrics-tab"]');
    await page.waitForTimeout(100);

    const finalCounts = await getMixerRenderCounts(page);

    // Stem channels should not re-render (memoization)
    const stem0Initial = initialCounts['stem-channel-0'] || 0;
    const stem0Final = finalCounts['stem-channel-0'] || 0;

    expect(stem0Final).toBe(stem0Initial);
  });

  test('should smoothly animate volume meter', async ({ page }) => {
    await page.click('[data-testid="play-button"]');

    // Track volume meter updates
    const meterUpdates = await page.evaluate(async () => {
      const meter = document.querySelector('[data-testid="volume-meter-0"]') as HTMLElement;
      if (!meter) return 0;

      let updates = 0;
      const previousValues: number[] = [];

      for (let i = 0; i < 20; i++) {
        const currentValue = parseFloat(meter.getAttribute('data-level') || '0');
        if (previousValues.length > 0) {
          const delta = Math.abs(currentValue - previousValues[previousValues.length - 1]);
          // Check for smooth transitions (no jumps > 0.2)
          if (delta > 0.2) {
            return -1; // Jump detected
          }
        }
        previousValues.push(currentValue);
        updates++;
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      return updates;
    });

    // Should have smooth updates
    expect(meterUpdates).toBeGreaterThan(0);
    expect(meterUpdates).not.toBe(-1); // No jumps
  });
});
