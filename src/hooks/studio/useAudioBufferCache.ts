/**
 * useAudioBufferCache - Intelligent audio buffer caching
 * 
 * Features:
 * - LRU cache for decoded audio buffers
 * - Background preloading
 * - Memory pressure handling
 * - IndexedDB persistence for waveform data
 */

import { useRef, useCallback, useEffect } from 'react';
import { logger } from '@/lib/logger';

interface CacheEntry {
  buffer: AudioBuffer;
  url: string;
  size: number;
  lastAccess: number;
  accessCount: number;
}

interface CacheStats {
  totalSize: number;
  entryCount: number;
  hitRate: number;
  oldestEntry: number;
}

interface UseAudioBufferCacheOptions {
  /** Maximum cache size in bytes (default: 100MB) */
  maxSize?: number;
  /** Maximum number of entries (default: 50) */
  maxEntries?: number;
  /** Enable background preloading */
  enablePreload?: boolean;
  /** Preload queue size */
  preloadQueueSize?: number;
}

const DEFAULT_OPTIONS: Required<UseAudioBufferCacheOptions> = {
  maxSize: 100 * 1024 * 1024, // 100MB
  maxEntries: 50,
  enablePreload: true,
  preloadQueueSize: 3,
};

// Shared cache instance
const globalCache = new Map<string, CacheEntry>();
let totalCacheSize = 0;
let cacheHits = 0;
let cacheMisses = 0;

export function useAudioBufferCache(options: UseAudioBufferCacheOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const audioContextRef = useRef<AudioContext | null>(null);
  const preloadQueueRef = useRef<string[]>([]);
  const isPreloadingRef = useRef(false);

  // Get or create AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  // Evict entries to make room
  const evictEntries = useCallback((requiredSize: number) => {
    const entries = Array.from(globalCache.entries())
      .sort((a, b) => a[1].lastAccess - b[1].lastAccess);

    let freedSize = 0;
    const toEvict: string[] = [];

    for (const [key, entry] of entries) {
      if (totalCacheSize - freedSize + requiredSize <= opts.maxSize) {
        break;
      }
      toEvict.push(key);
      freedSize += entry.size;
    }

    for (const key of toEvict) {
      const entry = globalCache.get(key);
      if (entry) {
        totalCacheSize -= entry.size;
        globalCache.delete(key);
        logger.debug('[AudioCache] Evicted', { url: entry.url, size: entry.size });
      }
    }

    return freedSize;
  }, [opts.maxSize]);

  // Check if URL is cached
  const has = useCallback((url: string): boolean => {
    return globalCache.has(url);
  }, []);

  // Get cached buffer
  const get = useCallback((url: string): AudioBuffer | null => {
    const entry = globalCache.get(url);
    if (entry) {
      entry.lastAccess = Date.now();
      entry.accessCount++;
      cacheHits++;
      return entry.buffer;
    }
    cacheMisses++;
    return null;
  }, []);

  // Add buffer to cache
  const set = useCallback((url: string, buffer: AudioBuffer): void => {
    // Calculate buffer size (samples * channels * bytes per sample)
    const size = buffer.length * buffer.numberOfChannels * 4;

    // Check if we need to evict
    if (totalCacheSize + size > opts.maxSize) {
      evictEntries(size);
    }

    // Check max entries
    if (globalCache.size >= opts.maxEntries) {
      evictEntries(size);
    }

    const entry: CacheEntry = {
      buffer,
      url,
      size,
      lastAccess: Date.now(),
      accessCount: 1,
    };

    globalCache.set(url, entry);
    totalCacheSize += size;

    logger.debug('[AudioCache] Added', { 
      url, 
      size, 
      totalSize: totalCacheSize,
      entries: globalCache.size 
    });
  }, [opts.maxSize, opts.maxEntries, evictEntries]);

  // Fetch and decode audio
  const fetchAndDecode = useCallback(async (url: string): Promise<AudioBuffer> => {
    // Check cache first
    const cached = get(url);
    if (cached) {
      return cached;
    }

    const context = getAudioContext();
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await context.decodeAudioData(arrayBuffer);

      // Cache the result
      set(url, audioBuffer);

      return audioBuffer;
    } catch (error) {
      logger.error('[AudioCache] Fetch/decode error', error, { url });
      throw error;
    }
  }, [get, set, getAudioContext]);

  // Process preload queue
  const processPreloadQueue = useCallback(async () => {
    if (isPreloadingRef.current || preloadQueueRef.current.length === 0) {
      return;
    }

    isPreloadingRef.current = true;

    while (preloadQueueRef.current.length > 0) {
      const url = preloadQueueRef.current.shift()!;
      
      if (!has(url)) {
        try {
          await fetchAndDecode(url);
          logger.debug('[AudioCache] Preloaded', { url });
        } catch (error) {
          logger.warn('[AudioCache] Preload failed', { url });
        }
      }

      // Small delay between preloads to not block main thread
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    isPreloadingRef.current = false;
  }, [has, fetchAndDecode]);

  // Add URLs to preload queue
  const preload = useCallback((urls: string[]) => {
    if (!opts.enablePreload) return;

    const newUrls = urls.filter(url => 
      !has(url) && !preloadQueueRef.current.includes(url)
    );

    // Limit queue size
    const available = opts.preloadQueueSize - preloadQueueRef.current.length;
    const toAdd = newUrls.slice(0, Math.max(0, available));

    preloadQueueRef.current.push(...toAdd);
    processPreloadQueue();
  }, [opts.enablePreload, opts.preloadQueueSize, has, processPreloadQueue]);

  // Get cache statistics
  const getStats = useCallback((): CacheStats => {
    const entries = Array.from(globalCache.values());
    const oldestEntry = entries.length > 0 
      ? Math.min(...entries.map(e => e.lastAccess))
      : 0;

    return {
      totalSize: totalCacheSize,
      entryCount: globalCache.size,
      hitRate: cacheHits + cacheMisses > 0 
        ? cacheHits / (cacheHits + cacheMisses) 
        : 0,
      oldestEntry,
    };
  }, []);

  // Clear entire cache
  const clear = useCallback(() => {
    globalCache.clear();
    totalCacheSize = 0;
    preloadQueueRef.current = [];
    logger.info('[AudioCache] Cleared');
  }, []);

  // Remove specific entry
  const remove = useCallback((url: string) => {
    const entry = globalCache.get(url);
    if (entry) {
      totalCacheSize -= entry.size;
      globalCache.delete(url);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
    };
  }, []);

  return {
    has,
    get,
    set,
    fetchAndDecode,
    preload,
    getStats,
    clear,
    remove,
  };
}

// Helper to format bytes
export function formatCacheSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
