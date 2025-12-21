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
import { getWaveform, saveWaveform } from '@/lib/waveformCache';
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

      // Not in cache - load from network
      audioElement.src = stem.audio_url;
      
      // Start caching in background immediately (don't block playback)
      audioElement.addEventListener('loadstart', () => {
        loadedStemsRef.current.add(stem.id);
        
        // Background cache - fire and forget
        fetch(stem.audio_url)
          .then(response => {
            if (response.ok) {
              return response.blob();
            }
            throw new Error('Fetch failed');
          })
          .then(blob => cacheAudio(stem.audio_url, blob))
          .catch(() => {
            // Caching failure is not critical
          });
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

    // Prefetch all at once - browsers handle connection pooling
    sorted.forEach(stem => {
      if (!prefetchedRef.current.has(stem.audio_url)) {
        prefetchedRef.current.add(stem.audio_url);
        
        // Prefetch audio
        prefetchAudio(stem.audio_url).catch(() => {});
        
        // Pre-generate waveform data in background
        prefetchWaveform(stem.audio_url);
      }
    });
  }, []);
  
  /**
   * Pre-generate waveform data for faster display
   */
  const prefetchWaveform = async (url: string) => {
    try {
      const cached = await getWaveform(url);
      if (cached) return; // Already cached
      
      // Generate peaks in background
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      audioContext.close();
      
      const channelData = audioBuffer.getChannelData(0);
      const samples = 100;
      const blockSize = Math.floor(channelData.length / samples);
      const peaks: number[] = [];
      
      for (let i = 0; i < samples; i++) {
        const start = i * blockSize;
        const end = Math.min(start + blockSize, channelData.length);
        let max = 0;
        for (let j = start; j < end; j++) {
          const abs = Math.abs(channelData[j]);
          if (abs > max) max = abs;
        }
        peaks.push(max);
      }
      
      // Normalize and cache
      const maxPeak = Math.max(...peaks, 0.01);
      const normalized = peaks.map(p => p / maxPeak);
      await saveWaveform(url, normalized);
    } catch {
      // Prefetch failure is not critical
    }
  };

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
