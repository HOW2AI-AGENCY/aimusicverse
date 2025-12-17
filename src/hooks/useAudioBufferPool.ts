/**
 * useAudioBufferPool - Optimized audio buffer management with LRU cache
 * Handles preloading, caching, and memory management for audio buffers
 */

import { useCallback, useRef, useEffect } from 'react';
import * as Tone from 'tone';

interface BufferEntry {
  buffer: Tone.ToneAudioBuffer;
  lastAccessed: number;
  size: number;
}

// Global buffer pool with LRU eviction
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB max
const MAX_ENTRIES = 20;

class AudioBufferPool {
  private cache = new Map<string, BufferEntry>();
  private totalSize = 0;
  private preloadQueue: string[] = [];
  private isPreloading = false;

  get(key: string): Tone.ToneAudioBuffer | null {
    const entry = this.cache.get(key);
    if (entry) {
      entry.lastAccessed = Date.now();
      return entry.buffer;
    }
    return null;
  }

  set(key: string, buffer: Tone.ToneAudioBuffer): void {
    const size = buffer.length * 4; // Approximate size in bytes

    // Evict if necessary
    while (
      (this.totalSize + size > MAX_CACHE_SIZE || this.cache.size >= MAX_ENTRIES) &&
      this.cache.size > 0
    ) {
      this.evictOldest();
    }

    this.cache.set(key, {
      buffer,
      lastAccessed: Date.now(),
      size,
    });
    this.totalSize += size;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey);
      if (entry) {
        this.totalSize -= entry.size;
        entry.buffer.dispose();
        this.cache.delete(oldestKey);
      }
    }
  }

  async preload(url: string, key: string): Promise<boolean> {
    if (this.cache.has(key)) return true;

    try {
      const buffer = await Tone.ToneAudioBuffer.fromUrl(url);
      this.set(key, buffer);
      return true;
    } catch (e) {
      console.warn('Preload failed:', e);
      return false;
    }
  }

  queuePreload(url: string, key: string): void {
    if (this.cache.has(key)) return;
    this.preloadQueue.push(JSON.stringify({ url, key }));
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isPreloading || this.preloadQueue.length === 0) return;

    this.isPreloading = true;

    // Use requestIdleCallback for non-critical preloading
    const processNext = () => {
      if (this.preloadQueue.length === 0) {
        this.isPreloading = false;
        return;
      }

      const item = this.preloadQueue.shift();
      if (item) {
        try {
          const { url, key } = JSON.parse(item);
          this.preload(url, key).finally(() => {
            if ('requestIdleCallback' in window) {
              (window as any).requestIdleCallback(processNext, { timeout: 5000 });
            } else {
              setTimeout(processNext, 100);
            }
          });
        } catch {
          processNext();
        }
      }
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(processNext, { timeout: 5000 });
    } else {
      setTimeout(processNext, 100);
    }
  }

  clear(): void {
    for (const entry of this.cache.values()) {
      entry.buffer.dispose();
    }
    this.cache.clear();
    this.totalSize = 0;
  }

  getStats(): { entries: number; size: number } {
    return {
      entries: this.cache.size,
      size: this.totalSize,
    };
  }
}

// Singleton instance
const globalBufferPool = new AudioBufferPool();

export function useAudioBufferPool() {
  const poolRef = useRef(globalBufferPool);

  const getBuffer = useCallback((key: string) => {
    return poolRef.current.get(key);
  }, []);

  const setBuffer = useCallback((key: string, buffer: Tone.ToneAudioBuffer) => {
    poolRef.current.set(key, buffer);
  }, []);

  const preloadBuffer = useCallback(async (url: string, key: string) => {
    return poolRef.current.preload(url, key);
  }, []);

  const queuePreload = useCallback((url: string, key: string) => {
    poolRef.current.queuePreload(url, key);
  }, []);

  const getStats = useCallback(() => {
    return poolRef.current.getStats();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't clear global pool on component unmount
      // Only clear on app unmount or manual clear
    };
  }, []);

  return {
    getBuffer,
    setBuffer,
    preloadBuffer,
    queuePreload,
    getStats,
    clearPool: () => poolRef.current.clear(),
  };
}
