/**
 * T079: Unit tests for useWaveformCache hook
 * Tests for IndexedDB-based waveform caching with LRU memory cache
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { useWaveformCache } from '@/hooks/studio/useWaveformCache';

describe('T079 - useWaveformCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Memory Cache', () => {
    it('should cache waveforms in memory and retrieve them', async () => {
      const { result } = renderHook(() => useWaveformCache());
      const peaks = [1, 2, 3, 4, 5];

      await act(async () => {
        await result.current.set('track-1', peaks, 180);
      });

      let entry: any;
      await act(async () => {
        entry = await result.current.get('track-1');
      });

      expect(entry).not.toBeNull();
      expect(entry?.peaks).toEqual(peaks);
      expect(entry?.duration).toBe(180);
    });

    it('should return null for non-existent entries', async () => {
      const { result } = renderHook(() => useWaveformCache());

      let entry: any;
      await act(async () => {
        entry = await result.current.get('non-existent');
      });

      expect(entry).toBeNull();
    });
  });

  describe('IndexedDB Cache', () => {
    it('should store and retrieve waveforms via IndexedDB', async () => {
      const { result } = renderHook(() => useWaveformCache());
      const peaks = [10, 20, 30];

      await act(async () => {
        await result.current.set('idb-track', peaks, 240);
      });

      let entry: any;
      await act(async () => {
        entry = await result.current.get('idb-track');
      });

      expect(entry).not.toBeNull();
      expect(entry?.peaks).toEqual(peaks);
    });
  });

  describe('Clear Operations', () => {
    it('should clear all cache entries', async () => {
      const { result } = renderHook(() => useWaveformCache());

      await act(async () => {
        await result.current.set('track-a', [1, 2], 60);
        await result.current.set('track-b', [3, 4], 120);
      });

      await act(async () => {
        await result.current.clear();
      });

      let entryA: any;
      let entryB: any;
      await act(async () => {
        entryA = await result.current.get('track-a');
        entryB = await result.current.get('track-b');
      });

      expect(entryA).toBeNull();
      expect(entryB).toBeNull();
    });
  });

  describe('Timestamp Management', () => {
    it('should set timestamp on cache entry', async () => {
      const before = Date.now();
      const { result } = renderHook(() => useWaveformCache());

      await act(async () => {
        await result.current.set('ts-track', [1], 30);
      });

      let entry: any;
      await act(async () => {
        entry = await result.current.get('ts-track');
      });

      expect(entry?.timestamp).toBeGreaterThanOrEqual(before);
      expect(entry?.timestamp).toBeLessThanOrEqual(Date.now());
    });
  });
});
