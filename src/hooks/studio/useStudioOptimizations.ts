/**
 * useStudioOptimizations - Combines all studio optimization hooks
 * 
 * Provides a unified interface for:
 * - Audio caching and prefetching
 * - Master clock synchronization
 * - Debounced controls
 * - Offline status
 * 
 * Optimized for minimal re-renders and maximum performance.
 */

import { useRef, useCallback, useMemo, useEffect } from 'react';
import { TrackStem } from '@/hooks/useTrackStems';
import { useStemAudioCache, getStemsByPriority } from './useStemAudioCache';
import { useMasterClock } from './useMasterClock';
import { useDebouncedStemControls } from './useDebouncedStemControls';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { precacheAudioUrls } from '@/lib/audioServiceWorker';
import { logger } from '@/lib/logger';

// Re-export for convenience
export { useAudioSync, useAutoSync } from './useAudioSync';
export { useStudioState } from './useStudioState';

interface UseStudioOptimizationsProps {
  stems: TrackStem[];
  audioRefs: Record<string, HTMLAudioElement>;
  onTimeUpdate: (time: number) => void;
  onStemVolumeChange: (stemId: string, volume: number) => void;
  onMasterVolumeChange: (volume: number) => void;
  onSeek: (time: number) => void;
}

interface StudioOptimizations {
  // Master clock controls
  isPlaying: boolean;
  play: (fromTime?: number) => Promise<boolean>;
  pause: () => void;
  seek: (time: number) => void;
  toggle: () => Promise<void>;
  getCurrentTime: () => number;
  
  // Debounced controls
  handleStemVolumeChange: (stemId: string, volume: number) => void;
  handleMasterVolumeChange: (volume: number) => void;
  handleSeek: (time: number) => void;
  
  // Audio caching
  loadStemWithCache: (stem: TrackStem, audioElement: HTMLAudioElement) => Promise<boolean>;
  prefetchStems: (stems: TrackStem[]) => void;
  isFullyLoaded: boolean;
  getLoadedCount: () => number;
  
  // Offline status
  isOnline: boolean;
  isOfflineCapable: boolean;
  isAudioAvailableOffline: (url: string) => Promise<boolean>;
  
  // Utility
  sortedStems: TrackStem[];
  prefetchForOffline: () => Promise<void>;
}

export function useStudioOptimizations({
  stems,
  audioRefs,
  onTimeUpdate,
  onStemVolumeChange,
  onMasterVolumeChange,
  onSeek,
}: UseStudioOptimizationsProps): StudioOptimizations {
  const prefetchedRef = useRef(false);

  // Sort stems by priority for loading
  const sortedStems = useMemo(() => getStemsByPriority(stems), [stems]);

  // Master clock for perfect sync
  const masterClock = useMasterClock({
    audioRefs,
    onTimeUpdate,
  });

  // Audio caching with priority loading
  const audioCache = useStemAudioCache(sortedStems);

  // Debounced controls to prevent excessive updates
  const debouncedControls = useDebouncedStemControls({
    onStemVolumeChange,
    onMasterVolumeChange,
    onSeek,
  });

  // Offline status tracking
  const offlineStatus = useOfflineStatus();

  // Prefetch audio URLs for offline playback
  const prefetchForOffline = useCallback(async () => {
    if (prefetchedRef.current || stems.length === 0) return;
    
    const urls = stems
      .map(s => s.audio_url)
      .filter((url): url is string => !!url);
    
    if (urls.length > 0) {
      prefetchedRef.current = true;
      try {
        await precacheAudioUrls(urls);
        logger.info('Prefetched stems for offline', { count: urls.length });
      } catch (error) {
        logger.error('Failed to prefetch stems', error);
      }
    }
  }, [stems]);

  // Auto-prefetch when stems are loaded (after 5s delay to not block initial load)
  useEffect(() => {
    if (stems.length === 0) return;

    const timer = setTimeout(() => {
      audioCache.prefetchStems(sortedStems);
    }, 5000);

    return () => clearTimeout(timer);
  }, [stems, sortedStems, audioCache]);

  return {
    // Master clock
    isPlaying: masterClock.isPlaying,
    play: masterClock.play,
    pause: masterClock.pause,
    seek: masterClock.seek,
    toggle: masterClock.toggle,
    getCurrentTime: masterClock.getCurrentTime,
    
    // Debounced controls
    handleStemVolumeChange: debouncedControls.handleStemVolumeChange,
    handleMasterVolumeChange: debouncedControls.handleMasterVolumeChange,
    handleSeek: debouncedControls.handleSeek,
    
    // Audio caching
    loadStemWithCache: audioCache.loadStemWithCache,
    prefetchStems: audioCache.prefetchStems,
    isFullyLoaded: audioCache.isFullyLoaded,
    getLoadedCount: audioCache.getLoadedCount,
    
    // Offline status
    isOnline: offlineStatus.isOnline,
    isOfflineCapable: offlineStatus.isOfflineCapable,
    isAudioAvailableOffline: offlineStatus.isAudioAvailableOffline,
    
    // Utility
    sortedStems,
    prefetchForOffline,
  };
}
