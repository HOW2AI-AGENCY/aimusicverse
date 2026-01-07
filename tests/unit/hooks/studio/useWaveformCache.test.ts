/**
 * T079: Unit tests for useWaveformCache hook
 * Tests for IndexedDB-based waveform caching with LRU memory cache
 */

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useWaveformCache } from '@/hooks/studio/useWaveformCache';

// Mock IndexedDB
const mockDB = {
  transaction: vi.fn(),
  close: vi.fn(),
};

const mockObjectStore = {
  get: vi.fn(),
  put: vi.fn(),
  clear: vi.fn(),
  index: vi.fn(),
};

const mockTransaction = {
  objectStore: vi.fn(() => mockObjectStore),
};

const mockRequest = {
  result: null,
  onsuccess: null as ((this: IDBRequest<any, any>, ev: Event) => any) | null,
  onerror: null as ((this: IDBRequest<any, any>, ev: Event) => any) | null,
};

const mockOpenRequest = {
  result: mockDB,
  onsuccess: null as ((this: IDBOpenDBRequest, ev: Event) => any) | null,
  onupgradeneeded: null as ((this: IDBOpenDBRequest, ev: IDBVersionChangeEvent) => any) | null,
  onerror: null as ((this: IDBOpenDBRequest, ev: Event) => any) | null,
};

describe('T079 - useWaveformCache', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup IndexedDB mocks
    global.indexedDB = {
      open: vi.fn(() => mockOpenRequest),
    } as unknown as IDBFactory;

    mockDB.transaction.mockReturnValue(mockTransaction);
    mockObjectStore.get.mockReturnValue(mockRequest);
    mockObjectStore.put.mockReturnValue(mockRequest);
    mockObjectStore.clear.mockReturnValue({
      oncomplete: null,
      onerror: null,
    });
    mockObjectStore.index.mockReturnValue({
      openCursor: vi.fn(() => mockRequest),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should open IndexedDB on first use', async () => {
      const { result } = renderHook(() => useWaveformCache());

      // Trigger DB access
      await waitFor(async () => {
        await result.current.get('test-key');
      });

      expect(global.indexedDB.open).toHaveBeenCalledWith('waveform-cache', 1);
    });

    it('should reuse existing database connection', async () => {
      const { result } = renderHook(() => useWaveformCache());

      // Multiple calls should use same connection
      await waitFor(async () => {
        await result.current.get('key1');
      });

      await waitFor(async () => {
        await result.current.get('key2');
      });

      expect(global.indexedDB.open).toHaveBeenCalledTimes(1);
    });
  });

  describe('Memory Cache', () => {
    it('should cache waveforms in memory', async () => {
      const { result } = renderHook(() => useWaveformCache());

      // Store a waveform
      await waitFor(async () => {
        await result.current.set('track-1', [1, 2, 3, 4, 5], 180);
      });

      // Retrieve from cache
      const entry = await result.current.get('track-1');

      expect(entry).toEqual({
        peaks: [1, 2, 3, 4, 5],
        duration: 180,
        timestamp: expect.any(Number),
      });
    });

    it('should return null for non-existent entries', async () => {
      const { result } = renderHook(() => useWaveformCache());

      const entry = await result.current.get('non-existent');

      expect(entry).toBeNull();
    });

    it('should update memory cache on access (LRU)', async () => {
      const { result } = renderHook(() => useWaveformCache());

      // Add multiple entries
      await waitFor(async () => {
        await result.current.set('track-1', [1], 10);
        await result.current.set('track-2', [2], 10);
        await result.current.set('track-3', [3], 10);
      });

      // Access track-1 to update its position
      await result.current.get('track-1');

      // Add more entries to potentially trigger eviction
      for (let i = 4; i <= 25; i++) {
        await result.current.set(`track-${i}`, [i], 10);
      }

      // track-1 should still be in cache due to recent access
      const entry = await result.current.get('track-1');
      expect(entry).not.toBeNull();
    });
  });

  describe('IndexedDB Cache', () => {
    it('should store waveforms in IndexedDB', async () => {
      const { result } = renderHook(() => useWaveformCache());

      await waitFor(async () => {
        await result.current.set('track-1', [1, 2, 3, 4, 5], 180);
      });

      expect(mockObjectStore.put).toHaveBeenCalledWith({
        key: 'track-1',
        peaks: [1, 2, 3, 4, 5],
        duration: 180,
        timestamp: expect.any(Number),
      });
    });

    it('should retrieve waveforms from IndexedDB', async () => {
      // Mock IndexedDB response
      mockRequest.result = {
        key: 'track-1',
        peaks: [1, 2, 3, 4, 5],
        duration: 180,
        timestamp: Date.now() - 1000, // 1 second ago
      };

      const { result } = renderHook(() => useWaveformCache());

      const getPromise = result.current.get('track-1');

      // Trigger onsuccess callback
      if (mockRequest.onsuccess) {
        mockRequest.onsuccess(new Event('success'));
      }

      const entry = await getPromise;

      expect(entry).toEqual({
        peaks: [1, 2, 3, 4, 5],
        duration: 180,
        timestamp: mockRequest.result.timestamp,
      });
    });

    it('should return null for expired entries', async () => {
      // Mock expired entry (> 7 days old)
      const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
      mockRequest.result = {
        key: 'track-old',
        peaks: [1, 2, 3],
        duration: 180,
        timestamp: eightDaysAgo,
      };

      const { result } = renderHook(() => useWaveformCache());

      const getPromise = result.current.get('track-old');

      if (mockRequest.onsuccess) {
        mockRequest.onsuccess(new Event('success'));
      }

      const entry = await getPromise;

      expect(entry).toBeNull();
    });
  });

  describe('Clear Operations', () => {
    it('should clear memory cache', async () => {
      const { result } = renderHook(() => useWaveformCache());

      // Add entries
      await waitFor(async () => {
        await result.current.set('track-1', [1], 10);
        await result.current.set('track-2', [2], 10);
      });

      // Clear cache
      await result.current.clear();

      // Entries should be gone
      const entry1 = await result.current.get('track-1');
      const entry2 = await result.current.get('track-2');

      expect(entry1).toBeNull();
      expect(entry2).toBeNull();
    });

    it('should clear IndexedDB cache', async () => {
      const { result } = renderHook(() => useWaveformCache());

      await result.current.clear();

      expect(mockObjectStore.clear).toHaveBeenCalled();
    });

    it('should clear only expired entries', async () => {
      const { result } = renderHook(() => useWaveformCache());

      const count = await result.current.clearExpired();

      expect(count).toBeGreaterThanOrEqual(0);
      expect(mockObjectStore.index).toHaveBeenCalledWith('timestamp');
    });
  });

  describe('Error Handling', () => {
    it('should handle IndexedDB errors gracefully', async () => {
      // Mock error in open
      global.indexedDB = {
        open: vi.fn(() => {
          throw new Error('IndexedDB not available');
        }),
      } as unknown as IDBFactory;

      const { result } = renderHook(() => useWaveformCache());

      // Should not throw
      const entry = await result.current.get('track-1');

      expect(entry).toBeNull();
    });

    it('should handle get errors gracefully', async () => {
      mockDB.transaction.mockImplementation(() => {
        throw new Error('Transaction failed');
      });

      const { result } = renderHook(() => useWaveformCache());

      const entry = await result.current.get('track-1');

      expect(entry).toBeNull();
    });

    it('should handle set errors gracefully', async () => {
      mockDB.transaction.mockImplementation(() => {
        throw new Error('Transaction failed');
      });

      const { result } = renderHook(() => useWaveformCache());

      // Should not throw
      await expect(
        result.current.set('track-1', [1, 2, 3], 180)
      ).resolves.toBeUndefined();
    });

    it('should handle clear errors gracefully', async () => {
      mockDB.transaction.mockImplementation(() => {
        throw new Error('Transaction failed');
      });

      const { result } = renderHook(() => useWaveformCache());

      // Should not throw
      await expect(
        result.current.clear()
      ).resolves.toBeUndefined();
    });
  });

  describe('Cache Performance', () => {
    it('should prioritize memory cache over IndexedDB', async () => {
      const { result } = renderHook(() => useWaveformCache());

      // Store in cache
      await waitFor(async () => {
        await result.current.set('track-1', [1, 2, 3], 180);
      });

      // Clear IndexedDB mock to ensure it's not called
      mockObjectStore.get.mockClear();

      // Retrieve should not call IndexedDB
      const entry = await result.current.get('track-1');

      expect(entry).not.toBeNull();
      expect(mockObjectStore.get).not.toHaveBeenCalled();
    });

    it('should store in memory cache even if IndexedDB fails', async () => {
      mockDB.transaction.mockImplementation(() => {
        throw new Error('IndexedDB error');
      });

      const { result } = renderHook(() => useWaveformCache());

      // Set should fail silently for IndexedDB but succeed for memory
      await result.current.set('track-1', [1, 2, 3], 180);

      // Get should still work from memory cache
      const entry = await result.current.get('track-1');

      expect(entry).toEqual({
        peaks: [1, 2, 3],
        duration: 180,
        timestamp: expect.any(Number),
      });
    });

    it('should limit memory cache size', async () => {
      const { result } = renderHook(() => useWaveformCache());

      // Add more entries than cache size (20)
      for (let i = 1; i <= 25; i++) {
        await result.current.set(`track-${i}`, [i], 10);
      }

      // First entries should be evicted due to LRU
      const entry1 = await result.current.get('track-1');
      expect(entry1).toBeNull();

      // Recent entries should still be present
      const entry25 = await result.current.get('track-25');
      expect(entry25).not.toBeNull();
    });
  });

  describe('Timestamp Management', () => {
    it('should set timestamp on cache entry', async () => {
      const { result } = renderHook(() => useWaveformCache());

      const beforeTime = Date.now();

      await waitFor(async () => {
        await result.current.set('track-1', [1, 2, 3], 180);
      });

      const afterTime = Date.now();

      const entry = await result.current.get('track-1');

      expect(entry?.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(entry?.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should preserve timestamp from IndexedDB', async () => {
      const originalTimestamp = Date.now() - 60000; // 1 minute ago

      mockRequest.result = {
        key: 'track-1',
        peaks: [1, 2, 3],
        duration: 180,
        timestamp: originalTimestamp,
      };

      const { result } = renderHook(() => useWaveformCache());

      const getPromise = result.current.get('track-1');

      if (mockRequest.onsuccess) {
        mockRequest.onsuccess(new Event('success'));
      }

      const entry = await getPromise;

      expect(entry?.timestamp).toBe(originalTimestamp);
    });
  });
});
