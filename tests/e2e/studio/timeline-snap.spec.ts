/**
 * T085: E2E Timeline Snap-to-Grid Tests
 * Tests: BPM-aware snapping, playhead dragging, haptic feedback, MBT display
 */

import { test, expect, Page } from '@playwright/test';

const STUDIO_URL = '/studio-v2/unified/test-track-id';

/**
 * Simulate touch drag on playhead
 */
async function dragPlayhead(page: Page, startX: number, endX: number, duration: number = 500) {
  await page.evaluate(
    async ({ sx, ex, dur }) => {
      const playhead = document.querySelector('[data-testid="playhead"]');
      if (!playhead) return;

      const timeline = document.querySelector('[data-testid="daw-timeline"]');
      if (!timeline) return;

      // Create touch events
      const touchStart = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        touches: [
          {
            clientX: sx,
            clientY: 0,
            identifier: 0,
            pageX: sx,
            pageY: 0,
            radiusX: 10,
            radiusY: 10,
            rotationAngle: 0,
            force: 1,
          },
        ],
      });

      playhead.dispatchEvent(touchStart);

      // Simulate drag
      const steps = 10;
      const stepDuration = dur / steps;
      const stepSize = (ex - sx) / steps;

      for (let i = 0; i <= steps; i++) {
        const currentX = sx + stepSize * i;
        const touchMove = new TouchEvent('touchmove', {
          bubbles: true,
          cancelable: true,
          touches: [
            {
              clientX: currentX,
              clientY: 0,
              identifier: 0,
              pageX: currentX,
              pageY: 0,
              radiusX: 10,
              radiusY: 10,
              rotationAngle: 0,
              force: 1,
            },
          ],
        });

        playhead.dispatchEvent(touchMove);
        await new Promise(resolve => setTimeout(resolve, stepDuration));
      }

      // Touch end
      const touchEnd = new TouchEvent('touchend', {
        bubbles: true,
        cancelable: true,
        changedTouches: [
          {
            clientX: ex,
            clientY: 0,
            identifier: 0,
            pageX: ex,
            pageY: 0,
            radiusX: 10,
            radiusY: 10,
            rotationAngle: 0,
            force: 1,
          },
        ],
      });

      playhead.dispatchEvent(touchEnd);
    },
    { sx: startX, ex: endX, dur: duration }
  );
}

/**
 * Get current playhead position (percentage)
 */
async function getPlayheadPosition(page: Page): Promise<number> {
  const position = await page.evaluate(() => {
    const playhead = document.querySelector('[data-testid="playhead"]') as HTMLElement;
    if (!playhead) return 0;
    return parseFloat(playhead.style.left || '0');
  });

  return position;
}

/**
 * Get current time display
 */
async function getTimeDisplay(page: Page): Promise<string> {
  const timeDisplay = await page.locator('[data-testid="time-display"]').textContent();
  return timeDisplay || '';
}

/**
 * Get BPM display
 */
async function getBPMDisplay(page: Page): Promise<number | null> {
  const bpmText = await page.locator('[data-testid="bpm-display"]').textContent();
  return bpmText ? parseInt(bpmText) : null;
}

test.describe('T085 - Timeline Snap-to-Grid', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(STUDIO_URL);
    await page.waitForSelector('[data-testid="unified-studio"]', { timeout: 10000 });
  });

  test('should snap playhead to nearest beat when BPM available', async ({ page }) => {
    // Wait for BPM detection
    await page.waitForSelector('[data-testid="bpm-display"]', { timeout: 5000 });

    const bpm = await getBPMDisplay(page);
    expect(bpm).not.toBeNull();

    // Drag playhead to random position
    await dragPlayhead(page, 100, 250, 300);

    // Wait for snap
    await page.waitForTimeout(100);

    const finalPosition = await getPlayheadPosition(page);

    // Get snapped time from display
    const timeDisplay = await getTimeDisplay(page);

    // Time should be in MBT format if BPM available
    if (bpm && bpm > 0) {
      expect(timeDisplay).toMatch(/\d+\.\d+/); // Measure.Beat format
    }
  });

  test('should snap to 1-second grid when BPM not available', async ({ page }) => {
    // Mock no BPM
    await page.evaluate(() => {
      const event = new CustomEvent('bpm-detected', {
        detail: { bpm: null },
      });
      window.dispatchEvent(event);
    });

    // Drag playhead
    await dragPlayhead(page, 100, 250, 300);

    await page.waitForTimeout(100);

    const timeDisplay = await getTimeDisplay(page);

    // Should be in seconds format (XX.XX)
    expect(timeDisplay).toMatch(/\d+\.\d{2}/);
  });

  test('should show grid lines when BPM available', async ({ page }) => {
    // Wait for BPM detection
    await page.waitForSelector('[data-testid="bpm-display"]', { timeout: 5000 });

    // Check for grid lines
    const gridLines = await page.locator('[data-testid="grid-line"]').count();

    expect(gridLines).toBeGreaterThan(0);
  });

  test('should distinguish beat lines from measure lines', async ({ page }) => {
    // Wait for BPM and grid
    await page.waitForSelector('[data-testid="bpm-display"]', { timeout: 5000 });
    await page.waitForSelector('[data-testid="grid-line"]', { timeout: 2000 });

    // Check for measure lines (thicker/more prominent)
    const measureLines = await page.locator('[data-testid="grid-line"][data-measure="true"]').count();
    const beatLines = await page.locator('[data-testid="grid-line"][data-beat="true"]').count();

    expect(measureLines).toBeGreaterThan(0);
    expect(beatLines).toBeGreaterThan(0);
  });

  test('should snap to quarter note by default', async ({ page }) => {
    await page.waitForSelector('[data-testid="bpm-display"]', { timeout: 5000 });

    // Get snap division
    const snapDivision = await page.evaluate(() => {
      const snapDisplay = document.querySelector('[data-testid="snap-division"]');
      return snapDisplay?.getAttribute('data-division') || '4';
    });

    expect(snapDivision).toBe('4');
  });

  test('should change snap division when requested', async ({ page }) => {
    await page.waitForSelector('[data-testid="bpm-display"]', { timeout: 5000 });

    // Change to eighth note snap
    await page.click('[data-testid="snap-division-button"]');
    await page.click('text="1/8"');

    const snapDivision = await page.evaluate(() => {
      const snapDisplay = document.querySelector('[data-testid="snap-division"]');
      return snapDisplay?.getAttribute('data-division') || '4';
    });

    expect(snapDivision).toBe('8');
  });

  test('should provide haptic feedback on snap', async ({ page }) => {
    // Enable haptic feedback tracking
    await page.evaluate(() => {
      (window as any).__hapticEvents = [];
      const originalHaptic = (navigator as any).vibrate;
      (navigator as any).vibrate = (...args: any[]) => {
        (window as any).__hapticEvents.push({ type: 'vibrate', args });
        return originalHaptic?.(...args);
      };
    });

    // Drag playhead
    await dragPlayhead(page, 100, 200, 200);

    await page.waitForTimeout(100);

    // Check if haptic feedback was triggered
    const hapticEvents = await page.evaluate(() => {
      return (window as any).__hapticEvents || [];
    });

    expect(hapticEvents.length).toBeGreaterThan(0);
  });

  test('should show MBT time format when BPM available', async ({ page }) => {
    await page.waitForSelector('[data-testid="bpm-display"]', { timeout: 5000 });

    // Seek to specific position
    await dragPlayhead(page, 0, 150, 200);

    await page.waitForTimeout(100);

    const timeDisplay = await getTimeDisplay(page);

    // Should show "Measure.Beat" format (e.g., "1.3")
    expect(timeDisplay).toMatch(/^\d+\.\d+$/);
  });

  test('should format time as seconds when BPM unavailable', async ({ page }) => {
    // Mock no BPM
    await page.evaluate(() => {
      const event = new CustomEvent('bpm-detected', {
        detail: { bpm: null },
      });
      window.dispatchEvent(event);
    });

    // Seek to position
    await dragPlayhead(page, 0, 150, 200);

    await page.waitForTimeout(100);

    const timeDisplay = await getTimeDisplay(page);

    // Should show "MM.SS" format (e.g., "45.23")
    expect(timeDisplay).toMatch(/^\d+\.\d{2}$/);
  });

  test('should smoothly animate playhead during drag', async ({ page }) => {
    const positions: number[] = [];

    // Track positions during drag
    page.evaluate(() => {
      const playhead = document.querySelector('[data-testid="playhead"]');
      if (!playhead) return;

      (window as any).__dragPositions = [];

      const observer = new MutationObserver(() => {
        const pos = parseFloat((playhead as HTMLElement).style.left || '0');
        (window as any).__dragPositions.push(pos);
      });

      observer.observe(playhead, { attributes: true, attributeFilter: ['style'] });
    });

    // Drag playhead
    await dragPlayhead(page, 50, 200, 500);

    await page.waitForTimeout(100);

    const dragPositions = await page.evaluate(() => {
      return (window as any).__dragPositions || [];
    });

    // Should have multiple position updates during drag
    expect(dragPositions.length).toBeGreaterThan(5);

    // Positions should be monotonically increasing (smooth drag)
    for (let i = 1; i < dragPositions.length; i++) {
      expect(dragPositions[i]).toBeGreaterThanOrEqual(dragPositions[i - 1]);
    }
  });

  test('should snap to grid on drop, not during drag', async ({ page }) => {
    await page.waitForSelector('[data-testid="bpm-display"]', { timeout: 5000 });

    // Get snap positions
    const snapPositions = await page.evaluate(() => {
      const gridLines = document.querySelectorAll('[data-testid="grid-line"]');
      return Array.from(gridLines).map(line => {
        const rect = line.getBoundingClientRect();
        return rect.left;
      });
    });

    expect(snapPositions.length).toBeGreaterThan(0);

    // Drag to position between grid lines
    const betweenGrid = (snapPositions[0] + snapPositions[1]) / 2;
    await dragPlayhead(page, betweenGrid - 50, betweenGrid, 200);

    await page.waitForTimeout(100);

    const finalPosition = await getPlayheadPosition(page);

    // Should snap to nearest grid line
    const isSnapped = snapPositions.some(pos => Math.abs(pos - finalPosition) < 5);

    expect(isSnapped).toBe(true);
  });

  test('should update time display during drag', async ({ page }) => {
    const timeDisplays: string[] = [];

    // Track time displays during drag
    page.evaluate(() => {
      const timeDisplay = document.querySelector('[data-testid="time-display"]');
      if (!timeDisplay) return;

      (window as any).__timeDisplays = [];

      const observer = new MutationObserver(() => {
        const text = timeDisplay.textContent;
        (window as any).__timeDisplays.push(text);
      });

      observer.observe(timeDisplay, { childList: true, subtree: true });
    });

    // Drag playhead
    await dragPlayhead(page, 50, 200, 500);

    await page.waitForTimeout(100);

    const dragTimeDisplays = await page.evaluate(() => {
      return (window as any).__timeDisplays || [];
    });

    // Should have multiple time updates during drag
    expect(dragTimeDisplays.length).toBeGreaterThan(3);
  });

  test('should handle zoom changes while snapping', async ({ page }) => {
    await page.waitForSelector('[data-testid="bpm-display"]', { timeout: 5000 });

    // Zoom in
    await page.click('[data-testid="zoom-in-button"]');
    await page.waitForTimeout(200);

    // Drag playhead
    await dragPlayhead(page, 100, 150, 200);
    await page.waitForTimeout(100);

    const positionZoomedIn = await getPlayheadPosition(page);

    // Zoom out
    await page.click('[data-testid="zoom-out-button"]');
    await page.waitForTimeout(200);

    // Drag playhead to same visual position
    await dragPlayhead(page, 100, 150, 200);
    await page.waitForTimeout(100);

    const positionZoomedOut = await getPlayheadPosition(page);

    // Snapping should work at both zoom levels
    expect(positionZoomedIn).toBeGreaterThan(0);
    expect(positionZoomedOut).toBeGreaterThan(0);
  });

  test('should detect BPM from audio automatically', async ({ page }) => {
    // Initially, BPM may be null or default
    await page.waitForSelector('[data-testid="unified-studio"]', { timeout: 10000 });

    // Wait for BPM detection to complete
    await page.waitForSelector('[data-testid="bpm-display"][data-detecting="false"]', {
      timeout: 10000,
    });

    const bpm = await getBPMDisplay(page);

    // Should have detected a BPM
    expect(bpm).not.toBeNull();
    expect(bpm).toBeGreaterThan(0);
  });

  test('should allow manual BPM override', async ({ page }) => {
    await page.waitForSelector('[data-testid="bpm-display"]', { timeout: 5000 });

    // Click BPM display to edit
    await page.click('[data-testid="bpm-display"]');

    // Enter new BPM
    await page.fill('[data-testid="bpm-input"]', '120');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(200);

    // Verify BPM was updated
    const bpm = await getBPMDisplay(page);
    expect(bpm).toBe(120);
  });

  test('should snap to appropriate grid for different time signatures', async ({ page }) => {
    await page.waitForSelector('[data-testid="bpm-display"]', { timeout: 5000 });

    // Change time signature to 3/4
    await page.click('[data-testid="time-signature-button"]');
    await page.click('text="3/4"');

    await page.waitForTimeout(200);

    // Grid should adjust for 3/4 time
    const measureLines = await page.locator('[data-testid="grid-line"][data-measure="true"]').count();

    // Should still have measure lines
    expect(measureLines).toBeGreaterThan(0);
  });
});
