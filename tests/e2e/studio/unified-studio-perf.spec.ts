/**
 * T083: E2E Performance Test for Unified Studio
 * Tests: Load time, interaction latency, memory usage, scroll FPS
 */

import { test, expect, Page } from '@playwright/test';

const STUDIO_URL = '/studio-v2/unified/test-track-id';

/**
 * Measure page load performance
 */
async function measureLoadPerformance(page: Page) {
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');

    return {
      // Core Web Vitals
      domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
      loadComplete: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
      firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,

      // Resource timing
      totalResources: performance.getEntriesByType('resource').length,
      jsResources: performance.getEntriesByType('resource').filter((r: any) => r.name.endsWith('.js')).length,
    };
  });

  return metrics;
}

/**
 * Measure FPS during scroll
 */
async function measureScrollFPS(page: Page, selector: string, duration: number = 2000) {
  const fpsSamples = await page.evaluate(
    async ({ sel, dur }) => {
      const element = document.querySelector(sel);
      if (!element) return [];

      const samples: number[] = [];
      let frameCount = 0;
      let lastTimestamp = performance.now();
      const startTime = lastTimestamp;

      const measureFrame = () => {
        const now = performance.now();
        frameCount++;

        if (now - lastTimestamp >= 100) {
          const fps = Math.round((frameCount * 1000) / (now - lastTimestamp));
          samples.push(fps);
          frameCount = 0;
          lastTimestamp = now;
        }

        if (now - startTime < dur) {
          requestAnimationFrame(measureFrame);
        }
      };

      requestAnimationFrame(measureFrame);

      // Simulate scroll
      element.scrollTop = 0;
      const scrollStep = 50;
      const scrollInterval = setInterval(() => {
        element.scrollTop += scrollStep;
        if (performance.now() - startTime >= dur) {
          clearInterval(scrollInterval);
        }
      }, 16);

      // Wait for scroll to complete
      await new Promise(resolve => setTimeout(resolve, dur + 100));

      return samples;
    },
    { sel: selector, dur: duration }
  );

  const avgFPS = fpsSamples.length > 0
    ? fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length
    : 0;

  return { avgFPS, samples: fpsSamples };
}

/**
 * Measure interaction latency
 */
async function measureInteractionLatency(page: Page, selector: string, action: 'click' | 'tap') {
  const latency = await page.evaluate(
    async ({ sel, act }) => {
      return new Promise<number>((resolve) => {
        const element = document.querySelector(sel);
        if (!element) {
          resolve(-1);
          return;
        }

        const startTime = performance.now();

        const handleInteraction = () => {
          const endTime = performance.now();
          resolve(endTime - startTime);
        };

        element.addEventListener(act === 'click' ? 'click' : 'touchstart', handleInteraction, { once: true });

        // Trigger interaction
        if (act === 'click') {
          (element as HTMLElement).click();
        } else {
          const touchEvent = new TouchEvent('touchstart', {
            bubbles: true,
            cancelable: true,
          });
          element.dispatchEvent(touchEvent);
        }

        // Timeout after 5 seconds
        setTimeout(() => resolve(-1), 5000);
      });
    },
    { sel: selector, act: action }
  );

  return latency;
}

test.describe('T083 - Unified Studio Performance', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to studio
    await page.goto(STUDIO_URL);

    // Wait for studio to load
    await page.waitForSelector('[data-testid="unified-studio"]', { timeout: 10000 });
  });

  test('should load studio in <3 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(STUDIO_URL);
    await page.waitForSelector('[data-testid="unified-studio"]', { timeout: 10000 });

    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });

  test('should achieve First Contentful Paint in <1.5s', async ({ page }) => {
    const metrics = await measureLoadPerformance(page);

    expect(metrics.firstContentfulPaint).toBeLessThan(1500);
  });

  test('should maintain ≥55 FPS when scrolling timeline', async ({ page }) => {
    // Scroll the timeline
    const timelineSelector = '[data-testid="daw-timeline"]';

    const { avgFPS } = await measureScrollFPS(page, timelineSelector, 2000);

    expect(avgFPS).toBeGreaterThanOrEqual(55);
  });

  test('should maintain ≥55 FPS when scrolling lyrics', async ({ page }) => {
    const lyricsSelector = '[data-testid="lyrics-panel"]';

    const { avgFPS } = await measureScrollFPS(page, lyricsSelector, 2000);

    expect(avgFPS).toBeGreaterThanOrEqual(55);
  });

  test('should respond to play button click in <100ms', async ({ page }) => {
    const playButton = '[data-testid="play-button"]';

    // Wait for button to be ready
    await page.waitForSelector(playButton, { state: 'visible' });

    const latency = await measureInteractionLatency(page, playButton, 'click');

    expect(latency).toBeGreaterThan(0);
    expect(latency).toBeLessThan(100);
  });

  test('should respond to timeline touch in <100ms', async ({ page }) => {
    const timelineSelector = '[data-testid="daw-timeline"]';

    await page.waitForSelector(timelineSelector, { state: 'visible' });

    const latency = await measureInteractionLatency(page, timelineSelector, 'tap');

    expect(latency).toBeGreaterThan(0);
    expect(latency).toBeLessThan(100);
  });

  test('should use <100MB memory after 1 minute of interaction', async ({ page }) => {
    // Get initial memory
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    if (initialMemory === 0) {
      test.skip(true, 'Memory API not available');
      return;
    }

    // Simulate 1 minute of interaction
    const actions = [
      () => page.click('[data-testid="play-button"]'),
      () => page.click('[data-testid="pause-button"]'),
      () => page.tap('[data-testid="daw-timeline"]'),
      () => page.click('[data-testid="lyrics-tab"]'),
      () => page.click('[data-testid="mixer-tab"]'),
    ];

    for (let i = 0; i < 12; i++) { // 5 actions * 12 iterations = ~1 minute
      for (const action of actions) {
        await action();
        await page.waitForTimeout(5000); // 5 seconds between actions
      }
    }

    // Get final memory
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    const memoryGrowthMB = (finalMemory - initialMemory) / (1024 * 1024);

    expect(memoryGrowthMB).toBeLessThan(100);
  });

  test('should not have memory leaks after repeated play/pause', async ({ page }) => {
    const iterations = 20;
    const memorySamples: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const memory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      if (memory > 0) {
        memorySamples.push(memory);
      }

      await page.click('[data-testid="play-button"]');
      await page.waitForTimeout(500);
      await page.click('[data-testid="pause-button"]');
      await page.waitForTimeout(500);
    }

    if (memorySamples.length === 0) {
      test.skip(true, 'Memory API not available');
      return;
    }

    // Check for consistent growth (memory leak)
    const initialMemory = memorySamples[0];
    const finalMemory = memorySamples[memorySamples.length - 1];
    const growthMB = (finalMemory - initialMemory) / (1024 * 1024);

    // Allow some growth but not excessive
    expect(growthMB).toBeLessThan(20);
  });

  test('should load JS bundle <500KB', async ({ page }) => {
    const metrics = await measureLoadPerformance(page);

    // Total JS size should be reasonable
    const jsSize = await page.evaluate(() => {
      const scripts = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return scripts
        .filter(s => s.name.endsWith('.js'))
        .reduce((total, s) => total + (s.transferSize || 0), 0);
    });

    // 500KB = 500 * 1024 bytes
    expect(jsSize).toBeLessThan(500 * 1024);
  });

  test('should handle rapid UI interactions without jank', async ({ page }) => {
    const frameDrops: number[] = [];

    // Measure frame drops during rapid interactions
    const interactionFrameDrops = await page.evaluate(async () => {
      let droppedFrames = 0;
      let lastFrameTime = performance.now();

      const measureFrame = () => {
        const currentTime = performance.now();
        const frameDuration = currentTime - lastFrameTime;

        // Frame time > 16.67ms indicates dropped frame (60fps target)
        if (frameDuration > 16.67) {
          droppedFrames++;
        }

        lastFrameTime = currentTime;
        requestAnimationFrame(measureFrame);
      };

      measureFrame();

      // Perform rapid interactions
      const actions = [
        () => (document.querySelector('[data-testid="play-button"]') as HTMLElement)?.click(),
        () => (document.querySelector('[data-testid="lyrics-tab"]') as HTMLElement)?.click(),
        () => (document.querySelector('[data-testid="mixer-tab"]') as HTMLElement)?.click(),
        () => (document.querySelector('[data-testid="effects-tab"]') as HTMLElement)?.click(),
      ];

      for (let i = 0; i < 10; i++) {
        for (const action of actions) {
          action();
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      return droppedFrames;
    });

    // Allow <10% dropped frames
    const totalFrames = 40; // 4 actions * 10 iterations
    const droppedFramePercentage = (interactionFrameDrops / totalFrames) * 100;

    expect(droppedFramePercentage).toBeLessThan(10);
  });

  test('should maintain responsiveness with 10+ stems loaded', async ({ page }) => {
    // Mock loading 10 stems
    await page.evaluate(() => {
      // Simulate loading stems
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

    // Wait for stems to render
    await page.waitForSelector('[data-testid="stem-mixer"]', { timeout: 5000 });

    // Measure interaction latency with 10 stems
    const startTime = Date.now();
    await page.click('[data-testid="stem-volume-0"]');
    const latency = Date.now() - startTime;

    expect(latency).toBeLessThan(100);
  });

  test('should smoothly animate playhead movement', async ({ page }) => {
    await page.click('[data-testid="play-button"]');

    // Track playhead position over time
    const positions = await page.evaluate(async () => {
      const positions: number[] = [];
      const playhead = document.querySelector('[data-testid="playhead"]') as HTMLElement;

      if (!playhead) return positions;

      for (let i = 0; i < 10; i++) {
        positions.push(parseFloat(playhead.style.left || '0'));
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return positions;
    });

    // Playhead should move consistently (no jumps)
    for (let i = 1; i < positions.length; i++) {
      const delta = positions[i] - positions[i - 1];
      // Allow small variation but no large jumps
      expect(Math.abs(delta)).toBeLessThan(5); // 5% max jump
    }
  });
});
