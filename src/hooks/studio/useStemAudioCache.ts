/**
 * useStemAudioCache - Manages audio caching for stems
 * 
 * Features:
 * - Automatic caching of loaded stems
 * - Priority-based progressive loading (vocals -> bass -> drums -> others)
 * - Cache-first audio loading
 * - Background prefetching of related stems
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { getCachedAudio, cacheAudio, prefetchAudio, shouldPrefetch } from '@/lib/audioCache';
import { TrackStem } from '@/hooks/useTrackStems';
import { logger } from '@/lib/logger';

// Priority order for stem loading (most important first)
const STEM_PRIORITY: Record<string, number> = {
  vocals: 1,
  vocal: 1,
  bass: 2,
  drums: 3,
  guitar: 4,
  piano: 5,
  instrumental: 6,
  strings: 7,
  synth: 8,
  other: 9,
};

interface UseStemAudioCacheResult {
  loadStemWithCache: (stem: TrackStem, audioElement: HTMLAudioElement) => Promise<boolean>;
  prefetchStems: (stems: TrackStem[]) => void;
  getLoadedCount: () => number;
  isFullyLoaded: boolean;
}

export function useStemAudioCache(stems: TrackStem[]): UseStemAudioCacheResult {
  const loadedStemsRef = useRef<Set<string>>(new Set());
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);
  const prefetchedRef = useRef<Set<string>>(new Set());

  // Sort stems by priority for progressive loading
  const sortedStems = [...stems].sort((a, b) => {
    const priorityA = STEM_PRIORITY[a.stem_type.toLowerCase()] || 10;
    const priorityB = STEM_PRIORITY[b.stem_type.toLowerCase()] || 10;
    return priorityA - priorityB;
  });

  /**
   * Load a stem with cache-first strategy
   */
  const loadStemWithCache = useCallback(async (
    stem: TrackStem, 
    audioElement: HTMLAudioElement
  ): Promise<boolean> => {
    try {
      // Check cache first
      const cachedBlob = await getCachedAudio(stem.audio_url);
      
      if (cachedBlob) {
        // Use cached blob
        const blobUrl = URL.createObjectURL(cachedBlob);
        audioElement.src = blobUrl;
        
        // Clean up blob URL when audio is loaded
        audioElement.addEventListener('loadedmetadata', () => {
          loadedStemsRef.current.add(stem.id);
          logger.debug('Stem loaded from cache', { 
            stemId: stem.id, 
            type: stem.stem_type 
          });
        }, { once: true });
        
        return true;
      }

      // Not in cache - load from network and cache for future
      audioElement.src = stem.audio_url;
      
      audioElement.addEventListener('canplaythrough', async () => {
        loadedStemsRef.current.add(stem.id);
        
        // Cache in background (don't await)
        try {
          const response = await fetch(stem.audio_url);
          if (response.ok) {
            const blob = await response.blob();
            await cacheAudio(stem.audio_url, blob);
            logger.debug('Stem cached after load', { 
              stemId: stem.id, 
              type: stem.stem_type,
              size: blob.size 
            });
          }
        } catch (cacheError) {
          // Caching failure is not critical
          logger.warn('Failed to cache stem', { stemId: stem.id, error: cacheError });
        }
      }, { once: true });

      return true;
    } catch (error) {
      logger.error('Failed to load stem with cache', { stemId: stem.id, error });
      return false;
    }
  }, []);

  /**
   * Prefetch stems in priority order (background)
   */
  const prefetchStems = useCallback((stemsToLoad: TrackStem[]) => {
    if (!shouldPrefetch()) {
      logger.debug('Skipping prefetch due to network conditions');
      return;
    }

    // Sort by priority and prefetch
    const sorted = [...stemsToLoad].sort((a, b) => {
      const priorityA = STEM_PRIORITY[a.stem_type.toLowerCase()] || 10;
      const priorityB = STEM_PRIORITY[b.stem_type.toLowerCase()] || 10;
      return priorityA - priorityB;
    });

    // Prefetch in batches to avoid overwhelming the network
    const BATCH_SIZE = 2;
    let batchIndex = 0;

    const prefetchBatch = () => {
      const batch = sorted.slice(batchIndex * BATCH_SIZE, (batchIndex + 1) * BATCH_SIZE);
      
      batch.forEach(stem => {
        if (!prefetchedRef.current.has(stem.audio_url)) {
          prefetchedRef.current.add(stem.audio_url);
          prefetchAudio(stem.audio_url).catch(() => {
            // Prefetch failure is not critical
          });
        }
      });

      batchIndex++;
      if (batchIndex * BATCH_SIZE < sorted.length) {
        // Prefetch next batch after a short delay
        setTimeout(prefetchBatch, 1000);
      }
    };

    prefetchBatch();
  }, []);

  /**
   * Get count of fully loaded stems
   */
  const getLoadedCount = useCallback(() => {
    return loadedStemsRef.current.size;
  }, []);

  // Check if all stems are loaded
  useEffect(() => {
    const checkFullyLoaded = () => {
      const allLoaded = stems.every(stem => loadedStemsRef.current.has(stem.id));
      setIsFullyLoaded(allLoaded);
    };

    // Check periodically
    const interval = setInterval(checkFullyLoaded, 500);
    return () => clearInterval(interval);
  }, [stems]);

  return {
    loadStemWithCache,
    prefetchStems,
    getLoadedCount,
    isFullyLoaded,
  };
}

/**
 * Get stems sorted by loading priority
 */
export function getStemsByPriority(stems: TrackStem[]): TrackStem[] {
  return [...stems].sort((a, b) => {
    const priorityA = STEM_PRIORITY[a.stem_type.toLowerCase()] || 10;
    const priorityB = STEM_PRIORITY[b.stem_type.toLowerCase()] || 10;
    return priorityA - priorityB;
  });
}
