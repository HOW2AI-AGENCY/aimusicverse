/**
 * T076: Waveform Load Benchmark Tests
 * Target: ≤500ms cached, ≤2000ms uncached (3-minute track)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { runBenchmark, measureLoadTime } from '../performance/studio-benchmarks';
import { useWaveformCache } from '@/hooks/studio/useWaveformCache';
import { generateWaveformData } from '@/lib/audio/waveformGenerator';

// Mock waveform generator
vi.mock('@/lib/audio/waveformGenerator', () => ({
  generateWaveformData: vi.fn(),
}));

describe('T076 - Waveform Load Performance', () => {
  const mockAudioBuffer = {
    duration: 180, // 3 minutes
    sampleRate: 44100,
    numberOfChannels: 2,
    getChannelData: vi.fn(() => new Float32Array(1000)),
  } as unknown as AudioBuffer;

  const mockWaveformData = {
    peaks: new Array(1000).fill(0).map(() => Math.random()),
    duration: 180,
    samplesPerPixel: 100,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (generateWaveformData as any).mockResolvedValue(mockWaveformData);
  });

  it('should load cached waveform in ≤500ms', async () => {
    const { result } = renderHook(() =>
      useWaveformCache({
        maxSize: 10,
        ttl: 60000, // 1 minute
      })
    );

    // First call (uncached)
    await act(async () => {
      await result.current.getOrGenerate('track1', () =>
        generateWaveformData(mockAudioBuffer, { samplesPerPixel: 100 })
      );
    });

    // Second call (cached)
    const { result: cachedResult, duration } = await measureLoadTime(
      () =>
        result.current.getOrGenerate('track1', () =>
          generateWaveformData(mockAudioBuffer, { samplesPerPixel: 100 })
        ),
      'Cached waveform load'
    );

    expect(duration).toBeLessThanOrEqual(500);
    expect(generateWaveformData).toHaveBeenCalledTimes(1); // Only called once due to cache
  });

  it('should load uncached waveform in ≤2000ms', async () => {
    const { result } = renderHook(() =>
      useWaveformCache({
        maxSize: 10,
        ttl: 60000,
      })
    );

    const { duration } = await measureLoadTime(
      () =>
        result.current.getOrGenerate('track2', () =>
          generateWaveformData(mockAudioBuffer, { samplesPerPixel: 100 })
        ),
      'Uncached waveform load'
    );

    expect(duration).toBeLessThanOrEqual(2000);
  });

  it('should handle parallel waveform requests efficiently', async () => {
    const { result } = renderHook(() =>
      useWaveformCache({
        maxSize: 10,
        ttl: 60000,
      })
    );

    const benchmarkResult = await runBenchmark(
      'Parallel waveform loads',
      async () => {
        // Request 5 waveforms in parallel
        const promises = Array.from({ length: 5 }, (_, i) =>
          result.current.getOrGenerate(`track${i}`, () =>
            generateWaveformData(mockAudioBuffer, { samplesPerPixel: 100 })
          )
        );
        await Promise.all(promises);
      },
      { threshold: 3000 } // 3 seconds for 5 waveforms
    );

    expect(benchmarkResult.passed).toBe(true);
  });

  it('should invalidate cache and reload efficiently', async () => {
    const { result } = renderHook(() =>
      useWaveformCache({
        maxSize: 10,
        ttl: 60000,
      })
    );

    // Load waveform
    await act(async () => {
      await result.current.getOrGenerate('track1', () =>
        generateWaveformData(mockAudioBuffer, { samplesPerPixel: 100 })
      );
    });

    // Invalidate cache
    act(() => {
      result.current.invalidate('track1');
    });

    // Reload
    const { duration } = await measureLoadTime(
      () =>
        result.current.getOrGenerate('track1', () =>
          generateWaveformData(mockAudioBuffer, { samplesPerPixel: 100 })
        ),
      'Cache invalidation reload'
    );

    expect(duration).toBeLessThanOrEqual(2000);
  });

  it('should handle cache eviction efficiently', async () => {
    const { result } = renderHook(() =>
      useWaveformCache({
        maxSize: 3, // Small cache size
        ttl: 60000,
      })
    );

    const benchmarkResult = await runBenchmark(
      'Cache eviction performance',
      async () => {
        // Load more waveforms than cache size
        for (let i = 0; i < 5; i++) {
          await result.current.getOrGenerate(`track${i}`, () =>
            generateWaveformData(mockAudioBuffer, { samplesPerPixel: 100 })
          );
        }
      },
      { threshold: 5000 }
    );

    expect(benchmarkResult.passed).toBe(true);
  });

  it('should use memory efficiently with large waveforms', async () => {
    const largeMockWaveformData = {
      peaks: new Array(10000).fill(0).map(() => Math.random()), // 10x larger
      duration: 180,
      samplesPerPixel: 10,
    };

    (generateWaveformData as any).mockResolvedValue(largeMockWaveformData);

    const { result } = renderHook(() =>
      useWaveformCache({
        maxSize: 10,
        ttl: 60000,
      })
    );

    const benchmarkResult = await runBenchmark(
      'Large waveform load',
      async () => {
        await result.current.getOrGenerate('track-large', () =>
          generateWaveformData(mockAudioBuffer, { samplesPerPixel: 10 })
        );
      },
      { threshold: 3000 }
    );

    expect(benchmarkResult.passed).toBe(true);
  });

  it('should handle different samplesPerPixel values efficiently', async () => {
    const { result } = renderHook(() =>
      useWaveformCache({
        maxSize: 10,
        ttl: 60000,
      })
    );

    const samplesPerPixels = [50, 100, 200, 500];
    const benchmarkResult = await runBenchmark(
      'Different resolution waveforms',
      async () => {
        for (const spp of samplesPerPixels) {
          await result.current.getOrGenerate(`track-spp-${spp}`, () =>
            generateWaveformData(mockAudioBuffer, { samplesPerPixel: spp })
          );
        }
      },
      { threshold: 4000 }
    );

    expect(benchmarkResult.passed).toBe(true);
  });

  it('should pre-generate waveforms efficiently', async () => {
    const { result } = renderHook(() =>
      useWaveformCache({
        maxSize: 10,
        ttl: 60000,
      })
    );

    const trackIds = ['track1', 'track2', 'track3'];

    const benchmarkResult = await runBenchmark(
      'Pre-generate waveforms',
      async () => {
        await result.current.preGenerate(trackIds, (trackId) =>
          generateWaveformData(mockAudioBuffer, { samplesPerPixel: 100 })
        );
      },
      { threshold: 5000 }
    );

    expect(benchmarkResult.passed).toBe(true);

    // Verify all waveforms are cached
    for (const trackId of trackIds) {
      const isCached = result.current.has(trackId);
      expect(isCached).toBe(true);
    }
  });

  it('should handle concurrent requests for same waveform', async () => {
    const { result } = renderHook(() =>
      useWaveformCache({
        maxSize: 10,
        ttl: 60000,
      })
    );

    // Request same waveform multiple times concurrently
    const promises = Array.from({ length: 10 }, () =>
      result.current.getOrGenerate('track1', () =>
        generateWaveformData(mockAudioBuffer, { samplesPerPixel: 100 })
      )
    );

    const { duration } = await measureLoadTime(
      () => Promise.all(promises),
      'Concurrent same waveform requests'
    );

    // Should only generate once, so should be fast
    expect(duration).toBeLessThanOrEqual(2500);
    expect(generateWaveformData).toHaveBeenCalledTimes(1);
  });

  it('should clean up expired cache entries efficiently', async () => {
    const { result } = renderHook(() =>
      useWaveformCache({
        maxSize: 10,
        ttl: 100, // Very short TTL
      })
    );

    // Load waveform
    await act(async () => {
      await result.current.getOrGenerate('track1', () =>
        generateWaveformData(mockAudioBuffer, { samplesPerPixel: 100 })
      );
    });

    // Wait for TTL to expire
    await new Promise(resolve => setTimeout(resolve, 150));

    // Trigger cleanup
    act(() => {
      result.current.cleanup();
    });

    // Should not have cached waveform
    expect(result.current.has('track1')).toBe(false);
  });
});
