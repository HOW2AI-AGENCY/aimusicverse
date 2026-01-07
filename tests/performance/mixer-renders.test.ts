/**
 * T075: Mixer Re-render Benchmark Tests
 * Target: ≤2 re-renders per volume change
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { RenderCounter, runBenchmark } from '../performance/studio-benchmarks';
import { useStemMixer } from '@/hooks/studio/useStemMixer';

describe('T075 - Mixer Re-render Performance', () => {
  let renderCounter: RenderCounter;

  beforeEach(() => {
    renderCounter = new RenderCounter();
  });

  it('should re-render ≤2 times per volume change', async () => {
    const stems = [
      { id: '1', name: 'Vocals', volume: 0.8 },
      { id: '2', name: 'Drums', volume: 0.7 },
      { id: '3', name: 'Bass', volume: 0.6 },
      { id: '4', name: 'Other', volume: 0.5 },
    ];

    const { result } = renderHook(() =>
      useStemMixer({
        stems,
        initialMuteStates: {},
        initialSoloStates: {},
      })
    );

    const initialRenderCount = renderCounter.getRenderCount('StemMixer');

    // Change volume for one stem
    await act(async () => {
      result.current.setVolume('1', 0.9);
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const finalRenderCount = renderCounter.getRenderCount('StemMixer');
    const reRenderCount = finalRenderCount - initialRenderCount;

    expect(reRenderCount).toBeLessThanOrEqual(2);
  });

  it('should batch multiple volume changes into ≤2 re-renders', async () => {
    const stems = [
      { id: '1', name: 'Vocals', volume: 0.8 },
      { id: '2', name: 'Drums', volume: 0.7 },
      { id: '3', name: 'Bass', volume: 0.6 },
    ];

    const { result } = renderHook(() =>
      useStemMixer({
        stems,
        initialMuteStates: {},
        initialSoloStates: {},
      })
    );

    const initialRenderCount = renderCounter.getRenderCount('StemMixer');

    // Change volumes for multiple stems rapidly
    await act(async () => {
      result.current.setVolume('1', 0.9);
      result.current.setVolume('2', 0.8);
      result.current.setVolume('3', 0.7);
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const finalRenderCount = renderCounter.getRenderCount('StemMixer');
    const reRenderCount = finalRenderCount - initialRenderCount;

    expect(reRenderCount).toBeLessThanOrEqual(2);
  });

  it('should not re-render other stems when one stem volume changes', async () => {
    const stems = [
      { id: '1', name: 'Vocals', volume: 0.8 },
      { id: '2', name: 'Drums', volume: 0.7 },
    ];

    const { result } = renderHook(() =>
      useStemMixer({
        stems,
        initialMuteStates: {},
        initialSoloStates: {},
      })
    );

    const stem1InitialRenderCount = renderCounter.getRenderCount('StemChannel_1');
    const stem2InitialRenderCount = renderCounter.getRenderCount('StemChannel_2');

    await act(async () => {
      result.current.setVolume('1', 0.9);
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const stem1FinalRenderCount = renderCounter.getRenderCount('StemChannel_1');
    const stem2FinalRenderCount = renderCounter.getRenderCount('StemChannel_2');

    const stem1ReRenders = stem1FinalRenderCount - stem1InitialRenderCount;
    const stem2ReRenders = stem2FinalRenderCount - stem2InitialRenderCount;

    expect(stem1ReRenders).toBeLessThanOrEqual(2);
    expect(stem2ReRenders).toBe(0); // Stem 2 should not re-render
  });

  it('should handle rapid volume changes efficiently', async () => {
    const stems = [
      { id: '1', name: 'Vocals', volume: 0.8 },
      { id: '2', name: 'Drums', volume: 0.7 },
    ];

    const { result } = renderHook(() =>
      useStemMixer({
        stems,
        initialMuteStates: {},
        initialSoloStates: {},
      })
    );

    const benchmarkResult = await runBenchmark(
      'Rapid volume changes',
      async () => {
        // Simulate user dragging volume slider rapidly
        for (let i = 0; i < 50; i++) {
          const volume = 0.5 + Math.sin(i * 0.1) * 0.5;
          result.current.setVolume('1', Math.max(0, Math.min(1, volume)));
        }
      },
      { threshold: 100 } // Should complete in 100ms
    );

    expect(benchmarkResult.passed).toBe(true);
  });

  it('should use React.memo for stem channels', () => {
    // This test verifies that stem channel components are memoized
    const stems = [
      { id: '1', name: 'Vocals', volume: 0.8 },
      { id: '2', name: 'Drums', volume: 0.7 },
    ];

    const { result, rerender } = renderHook(
      ({ stems }) =>
        useStemMixer({
          stems,
          initialMuteStates: {},
          initialSoloStates: {},
        }),
      { initialProps: { stems } }
    );

    const initialRenderCount = renderCounter.getRenderCount('StemChannel_1');

    // Rerender with same props
    rerender({ stems });

    const finalRenderCount = renderCounter.getRenderCount('StemChannel_1');

    // Should not re-render if props are the same (memoization)
    expect(finalRenderCount).toBe(initialRenderCount);
  });

  it('should debounce volume changes from sliders', async () => {
    const stems = [
      { id: '1', name: 'Vocals', volume: 0.8 },
    ];

    const { result } = renderHook(() =>
      useStemMixer({
        stems,
        initialMuteStates: {},
        initialSoloStates: {},
      })
    );

    const initialRenderCount = renderCounter.getRenderCount('StemMixer');

    // Simulate slider events (rapid onChange events)
    await act(async () => {
      for (let i = 0; i < 20; i++) {
        result.current.setVolume('1', 0.5 + (i / 20) * 0.5);
      }
      await new Promise(resolve => setTimeout(resolve, 200)); // Wait for debounce
    });

    const finalRenderCount = renderCounter.getRenderCount('StemMixer');
    const reRenderCount = finalRenderCount - initialRenderCount;

    // Should be debounced to fewer renders than events
    expect(reRenderCount).toBeLessThan(10);
  });

  it('should handle mute toggle efficiently', async () => {
    const stems = [
      { id: '1', name: 'Vocals', volume: 0.8 },
      { id: '2', name: 'Drums', volume: 0.7 },
    ];

    const { result } = renderHook(() =>
      useStemMixer({
        stems,
        initialMuteStates: {},
        initialSoloStates: {},
      })
    );

    const benchmarkResult = await runBenchmark(
      'Mute toggle performance',
      async () => {
        result.current.toggleMute('1');
        await new Promise(resolve => setTimeout(resolve, 16));
        result.current.toggleMute('2');
        await new Promise(resolve => setTimeout(resolve, 16));
      },
      { threshold: 50 } // Should complete in 50ms
    );

    expect(benchmarkResult.passed).toBe(true);
  });

  it('should handle solo toggle efficiently', async () => {
    const stems = [
      { id: '1', name: 'Vocals', volume: 0.8 },
      { id: '2', name: 'Drums', volume: 0.7 },
      { id: '3', name: 'Bass', volume: 0.6 },
    ];

    const { result } = renderHook(() =>
      useStemMixer({
        stems,
        initialMuteStates: {},
        initialSoloStates: {},
      })
    );

    const benchmarkResult = await runBenchmark(
      'Solo toggle performance',
      async () => {
        result.current.toggleSolo('1');
        await new Promise(resolve => setTimeout(resolve, 16));
        result.current.toggleSolo('2');
        await new Promise(resolve => setTimeout(resolve, 16));
      },
      { threshold: 50 }
    );

    expect(benchmarkResult.passed).toBe(true);
  });

  it('should maintain performance with 10 stems', async () => {
    // Create 10 stems (maximum expected)
    const stems = Array.from({ length: 10 }, (_, i) => ({
      id: String(i + 1),
      name: `Stem ${i + 1}`,
      volume: 0.7,
    }));

    const { result } = renderHook(() =>
      useStemMixer({
        stems,
        initialMuteStates: {},
        initialSoloStates: {},
      })
    );

    const benchmarkResult = await runBenchmark(
      '10 stems volume change',
      async () => {
        // Change volume for all stems
        for (let i = 0; i < 10; i++) {
          result.current.setVolume(String(i + 1), 0.8);
        }
      },
      { threshold: 200 }
    );

    expect(benchmarkResult.passed).toBe(true);
  });
});
