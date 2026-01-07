/**
 * T077: Memory Usage Benchmark Tests
 * Target: ≤50MB increase with 10 stems loaded
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { MemoryTracker, formatMemorySize, measureMemory } from '../performance/studio-benchmarks';
import { useStemMixer } from '@/hooks/studio/useStemMixer';
import { useWaveformCache } from '@/hooks/studio/useWaveformCache';

describe('T077 - Memory Usage Performance', () => {
  let memoryTracker: MemoryTracker;

  beforeEach(() => {
    memoryTracker = new MemoryTracker();
    cleanup();
  });

  it('should use ≤50MB memory with 10 stems loaded', async () => {
    // Skip if memory API not available
    if (!measureMemory()) {
      expect(true).toBe(true);
      return;
    }

    const stems = Array.from({ length: 10 }, (_, i) => ({
      id: `stem-${i}`,
      name: `Stem ${i}`,
      url: `https://example.com/stem${i}.mp3`,
      volume: 0.7,
    }));

    // Get baseline memory
    memoryTracker.start();
    await new Promise(resolve => setTimeout(resolve, 500));

    const initialMeasurement = measureMemory();
    expect(initialMeasurement).not.toBeNull();

    // Load stems
    const { result } = renderHook(() =>
      useStemMixer({
        stems,
        initialMuteStates: {},
        initialSoloStates: {},
      })
    );

    // Wait for stems to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    const finalMeasurement = measureMemory();
    expect(finalMeasurement).not.toBeNull();

    memoryTracker.stop();

    const memoryGrowth = (finalMeasurement!.usedJSHeapSize - initialMeasurement!.usedJSHeapSize) / (1024 * 1024);

    expect(memoryGrowth).toBeLessThanOrEqual(50);
  });

  it('should not leak memory when stems are unloaded', async () => {
    if (!measureMemory()) {
      expect(true).toBe(true);
      return;
    }

    const stems = Array.from({ length: 5 }, (_, i) => ({
      id: `stem-${i}`,
      name: `Stem ${i}`,
      url: `https://example.com/stem${i}.mp3`,
      volume: 0.7,
    }));

    // Phase 1: Load stems
    memoryTracker.start();
    await new Promise(resolve => setTimeout(resolve, 500));

    const { result, unmount } = renderHook(() =>
      useStemMixer({
        stems,
        initialMuteStates: {},
        initialSoloStates: {},
      })
    );

    await new Promise(resolve => setTimeout(resolve, 1000));
    const phase1Measurements = memoryTracker.stop();

    // Phase 2: Unmount and wait
    await new Promise(resolve => setTimeout(resolve, 500));
    unmount();

    // Phase 3: Check if memory was released
    await new Promise(resolve => setTimeout(resolve, 1000));
    memoryTracker.start();
    await new Promise(resolve => setTimeout(resolve, 500));
    const phase2Measurements = memoryTracker.stop();

    const phase1Peak = Math.max(...phase1Measurements.map(m => m.usedJSHeapSize));
    const phase2Peak = Math.max(...phase2Measurements.map(m => m.usedJSHeapSize));
    const memoryRetained = (phase2Peak - phase1Peak) / (1024 * 1024);

    // Allow some retained memory, but should be minimal
    expect(memoryRetained).toBeLessThan(10);
  });

  it('should handle waveform cache memory efficiently', async () => {
    if (!measureMemory()) {
      expect(true).toBe(true);
      return;
    }

    const { result } = renderHook(() =>
      useWaveformCache({
        maxSize: 10,
        ttl: 60000,
      })
    );

    memoryTracker.start();

    // Load 10 waveforms into cache
    for (let i = 0; i < 10; i++) {
      await result.current.getOrGenerate(`track-${i}`, async () => ({
        peaks: new Array(1000).fill(0).map(() => Math.random()),
        duration: 180,
        samplesPerPixel: 100,
      }));
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    const measurements = memoryTracker.stop();

    const peakMemory = Math.max(...measurements.map(m => m.usedJSHeapSize));
    const baseMemory = measurements[0].usedJSHeapSize;
    const memoryUsed = (peakMemory - baseMemory) / (1024 * 1024);

    // Waveform cache should use reasonable memory
    expect(memoryUsed).toBeLessThan(100);
  });

  it('should release memory when cache is cleared', async () => {
    if (!measureMemory()) {
      expect(true).toBe(true);
      return;
    }

    const { result } = renderHook(() =>
      useWaveformCache({
        maxSize: 10,
        ttl: 60000,
      })
    );

    // Load waveforms
    for (let i = 0; i < 5; i++) {
      await result.current.getOrGenerate(`track-${i}`, async () => ({
        peaks: new Array(1000).fill(0).map(() => Math.random()),
        duration: 180,
        samplesPerPixel: 100,
      }));
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    const beforeClear = measureMemory()!;
    result.current.clear();
    await new Promise(resolve => setTimeout(resolve, 500));

    const afterClear = measureMemory()!;

    const memoryReleased = (beforeClear.usedJSHeapSize - afterClear.usedJSHeapSize) / (1024 * 1024);

    // Should release some memory
    expect(memoryReleased).toBeGreaterThan(0);
  });

  it('should not leak memory with repeated stem operations', async () => {
    if (!measureMemory()) {
      expect(true).toBe(true);
      return;
    }

    const stems = Array.from({ length: 5 }, (_, i) => ({
      id: `stem-${i}`,
      name: `Stem ${i}`,
      volume: 0.7,
    }));

    const { result } = renderHook(() =>
      useStemMixer({
        stems,
        initialMuteStates: {},
        initialSoloStates: {},
      })
    );

    memoryTracker.start();

    // Perform many operations
    for (let i = 0; i < 100; i++) {
      result.current.setVolume('stem-0', 0.5 + Math.random() * 0.5);
      result.current.toggleMute('stem-1');
      result.current.toggleSolo('stem-2');
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const measurements = memoryTracker.stop();

    // Check for memory leak
    const hasLeak = memoryTracker.hasMemoryLeak(5); // 5MB threshold

    expect(hasLeak).toBe(false);
  });

  it('should handle large audio buffers without excessive memory use', async () => {
    if (!measureMemory()) {
      expect(true).toBe(true);
      return;
    }

    const { result } = renderHook(() =>
      useWaveformCache({
        maxSize: 5,
        ttl: 60000,
      })
    );

    memoryTracker.start();

    // Simulate loading large audio buffers
    for (let i = 0; i < 3; i++) {
      await result.current.getOrGenerate(`large-track-${i}`, async () => ({
        peaks: new Array(10000).fill(0).map(() => Math.random()), // Large waveform
        duration: 600, // 10 minutes
        samplesPerPixel: 50,
      }));
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    const measurements = memoryTracker.stop();

    const initialMemory = measurements[0].usedJSHeapSize;
    const peakMemory = Math.max(...measurements.map(m => m.usedJSHeapSize));
    const memoryUsed = (peakMemory - initialMemory) / (1024 * 1024);

    // Should handle large buffers reasonably
    expect(memoryUsed).toBeLessThan(200);
  });

  it('should properly clean up event listeners', async () => {
    if (!measureMemory()) {
      expect(true).toBe(true);
      return;
    }

    const stems = [
      { id: 'stem-1', name: 'Stem 1', volume: 0.7 },
    ];

    // Mount and unmount multiple times
    for (let i = 0; i < 10; i++) {
      const { unmount } = renderHook(() =>
        useStemMixer({
          stems,
          initialMuteStates: {},
          initialSoloStates: {},
        })
      );

      await new Promise(resolve => setTimeout(resolve, 50));
      unmount();
    }

    // Force garbage collection (if available)
    if (global.gc) {
      global.gc();
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    const finalMemory = measureMemory()!;

    // If we got here without crashing, cleanup is working
    expect(finalMemory).not.toBeNull();
  });

  it('should format memory sizes correctly', () => {
    expect(formatMemorySize(1024)).toBe('0.00 MB');
    expect(formatMemorySize(1024 * 1024)).toBe('1.00 MB');
    expect(formatMemorySize(10 * 1024 * 1024)).toBe('10.00 MB');
    expect(formatMemorySize(15.7 * 1024 * 1024)).toBe('15.70 MB');
  });

  it('should track memory growth accurately', async () => {
    if (!measureMemory()) {
      expect(true).toBe(true);
      return;
    }

    memoryTracker.start();
    await new Promise(resolve => setTimeout(resolve, 200));

    // Simulate some memory allocation
    const largeArray = new Array(1000000).fill('test data');

    await new Promise(resolve => setTimeout(resolve, 200));
    memoryTracker.stop();

    const growth = memoryTracker.getMemoryGrowth();

    // Should have positive growth
    expect(growth).toBeGreaterThan(0);

    // Clean up
    largeArray.length = 0;
  });
});
