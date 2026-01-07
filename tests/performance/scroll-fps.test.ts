/**
 * T074: Scroll FPS Benchmark Tests
 * Target: ≥55 FPS with 1000+ timeline items
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { measureScrollFPS, getAverageFPS, runBenchmark } from '../performance/studio-benchmarks';
import { useVirtualizedTimeline } from '@/hooks/studio/useVirtualizedTimeline';

describe('T074 - Scroll FPS Performance', () => {
  let scrollContainer: HTMLElement;

  beforeEach(() => {
    // Create a scrollable container with many items
    scrollContainer = document.createElement('div');
    scrollContainer.style.height = '500px';
    scrollContainer.style.overflow = 'auto';
    document.body.appendChild(scrollContainer);

    // Add 1000 timeline items
    for (let i = 0; i < 1000; i++) {
      const item = document.createElement('div');
      item.style.height = '50px';
      item.textContent = `Item ${i}`;
      scrollContainer.appendChild(item);
    }
  });

  afterEach(() => {
    document.body.removeChild(scrollContainer);
  });

  it('should maintain ≥55 FPS when scrolling 1000 items', async () => {
    const samples = measureScrollFPS(scrollContainer, 2000);
    const avgFPS = getAverageFPS(samples);

    expect(avgFPS).toBeGreaterThanOrEqual(55);
  });

  it('should maintain ≥55 FPS with rapid scroll changes', async () => {
    const result = await runBenchmark(
      'Rapid scroll changes',
      async () => {
        // Simulate rapid scroll position changes
        for (let i = 0; i < 100; i++) {
          scrollContainer.scrollTop = Math.random() * scrollContainer.scrollHeight;
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      },
      { threshold: 1000 } // 1 second threshold
    );

    expect(result.passed).toBe(true);
  });

  it('should handle scroll-to-index without FPS drop', async () => {
    const { result } = renderHook(() =>
      useVirtualizedTimeline({
        itemCount: 1000,
        itemHeight: 50,
      })
    );

    const benchmarkResult = await runBenchmark(
      'Scroll to index performance',
      async () => {
        // Scroll to various indices
        const indices = [100, 200, 500, 800, 900];
        for (const index of indices) {
          result.current.scrollToIndex(index);
          await new Promise(resolve => setTimeout(resolve, 16)); // Wait for one frame
        }
      },
      { threshold: 500 } // 500ms for 5 scroll operations
    );

    expect(benchmarkResult.passed).toBe(true);
  });

  it('should maintain FPS during continuous scroll', async () => {
    let scrollCount = 0;
    const maxScrolls = 100;
    const fpsSamples: number[] = [];

    const measureFrame = () => {
      if (scrollCount < maxScrolls) {
        scrollContainer.scrollTop += 10;
        scrollCount++;

        const fpsSamples = measureScrollFPS(scrollContainer, 100);
        fpsSamples.push(...fpsSamples.map(s => s.fps));
      }
    };

    // Start scroll interval
    const scrollInterval = setInterval(measureFrame, 16);

    // Wait for scrolling to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    clearInterval(scrollInterval);

    const avgFPS = fpsSamples.length > 0
      ? fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length
      : 0;

    expect(avgFPS).toBeGreaterThanOrEqual(55);
  });

  it('should handle scroll snap without significant FPS drop', async () => {
    // Add scroll snap behavior
    scrollContainer.style.scrollSnapType = 'y mandatory';

    const result = await runBenchmark(
      'Scroll snap performance',
      async () => {
        for (let i = 0; i < 50; i++) {
          scrollContainer.scrollTop += 50; // Snap to next item
          await new Promise(resolve => setTimeout(resolve, 20));
        }
      },
      { threshold: 1000 }
    );

    expect(result.passed).toBe(true);
  });

  it('should maintain FPS with large items (height > 100px)', async () => {
    // Clear previous items
    scrollContainer.innerHTML = '';

    // Add 500 large items
    for (let i = 0; i < 500; i++) {
      const item = document.createElement('div');
      item.style.height = '150px';
      item.textContent = `Large Item ${i}`;
      scrollContainer.appendChild(item);
    }

    const samples = measureScrollFPS(scrollContainer, 2000);
    const avgFPS = getAverageFPS(samples);

    expect(avgFPS).toBeGreaterThanOrEqual(55);
  });

  it('should handle variable-height items without FPS drop', async () => {
    // Clear previous items
    scrollContainer.innerHTML = '';

    // Add 1000 variable-height items (30px to 100px)
    for (let i = 0; i < 1000; i++) {
      const item = document.createElement('div');
      const height = 30 + Math.random() * 70;
      item.style.height = `${height}px`;
      item.textContent = `Variable Item ${i}`;
      scrollContainer.appendChild(item);
    }

    const result = await runBenchmark(
      'Variable height scroll',
      async () => {
        for (let i = 0; i < 100; i++) {
          scrollContainer.scrollTop += 100;
          await new Promise(resolve => setTimeout(resolve, 16));
        }
      },
      { threshold: 1500 }
    );

    expect(result.passed).toBe(true);
  });
});
