/**
 * useAudioBufferPool - React hook wrapper for buffer pool
 * Provides buffer caching for audio performance optimization
 */

import { useCallback, useRef } from 'react';
import { getBufferPool } from '@/lib/audio/bufferPool';

interface PreloadQueueItem {
  url: string;
  key: string;
}

export function useAudioBufferPool() {
  const preloadQueueRef = useRef<PreloadQueueItem[]>([]);
  const isPreloadingRef = useRef(false);
  
  const pool = getBufferPool();

  const getBuffer = useCallback((key: string): AudioBuffer | null => {
    return pool.get(key);
  }, [pool]);

  const setBuffer = useCallback((key: string, buffer: AudioBuffer): void => {
    pool.set(key, buffer);
  }, [pool]);

  const hasBuffer = useCallback((key: string): boolean => {
    return pool.has(key);
  }, [pool]);

  const queuePreload = useCallback((url: string, key: string): void => {
    // Skip if already cached
    if (pool.has(key)) return;
    
    // Add to queue
    preloadQueueRef.current.push({ url, key });
    
    // Process queue if not already processing
    if (!isPreloadingRef.current) {
      processQueue();
    }
  }, [pool]);

  const processQueue = useCallback(async () => {
    if (isPreloadingRef.current || preloadQueueRef.current.length === 0) return;
    
    isPreloadingRef.current = true;
    
    while (preloadQueueRef.current.length > 0) {
      const item = preloadQueueRef.current.shift();
      if (!item) break;
      
      // Skip if already cached during queue processing
      if (pool.has(item.key)) continue;
      
      try {
        const response = await fetch(item.url);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        pool.set(item.key, audioBuffer);
        await audioContext.close();
      } catch (error) {
        console.warn('Failed to preload audio:', item.key, error);
      }
    }
    
    isPreloadingRef.current = false;
  }, [pool]);

  const clear = useCallback(() => {
    pool.clear();
  }, [pool]);

  const getStats = useCallback(() => {
    return pool.getStats();
  }, [pool]);

  return {
    getBuffer,
    setBuffer,
    hasBuffer,
    queuePreload,
    clear,
    getStats,
  };
}
