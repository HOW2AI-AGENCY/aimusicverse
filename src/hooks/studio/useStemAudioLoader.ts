/**
 * Stem Audio Loader - Optimized audio loading with streaming and lazy initialization
 * 
 * Features:
 * - Lazy audio element creation
 * - Priority-based loading (vocals first)
 * - Progress tracking per stem
 * - Streaming playback (play while loading)
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { TrackStem } from '@/hooks/useStudioData';
import { getCachedAudio, cacheAudio } from '@/lib/audioCache';
import { logger } from '@/lib/logger';

// Priority order for stem loading
const STEM_PRIORITY: Record<string, number> = {
  vocals: 1,
  vocal: 1,
  bass: 2,
  drums: 3,
  guitar: 4,
  piano: 5,
  keyboard: 5,
  instrumental: 6,
  other: 10,
};

export interface StemLoadingState {
  isLoading: boolean;
  progress: number; // 0-100
  isReady: boolean;
  error: Error | null;
}

export interface UseStemAudioLoaderResult {
  audioRefs: Record<string, HTMLAudioElement>;
  loadingStates: Record<string, StemLoadingState>;
  overallProgress: number;
  isFullyLoaded: boolean;
  initializeStem: (stem: TrackStem) => HTMLAudioElement;
  preloadAllStems: (stems: TrackStem[]) => void;
}

export function useStemAudioLoader(): UseStemAudioLoaderResult {
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, StemLoadingState>>({});
  
  // Update loading state for a stem
  const updateLoadingState = useCallback((stemId: string, update: Partial<StemLoadingState>) => {
    setLoadingStates(prev => ({
      ...prev,
      [stemId]: {
        ...prev[stemId],
        ...update,
      },
    }));
  }, []);
  
  // Initialize a single stem audio element (lazy)
  const initializeStem = useCallback((stem: TrackStem): HTMLAudioElement => {
    // Return existing if already created
    if (audioRefs.current[stem.id]) {
      return audioRefs.current[stem.id];
    }
    
    const audio = new Audio();
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    
    // Initialize loading state
    updateLoadingState(stem.id, {
      isLoading: true,
      progress: 0,
      isReady: false,
      error: null,
    });
    
    // Track loading progress
    audio.addEventListener('progress', () => {
      if (audio.buffered.length > 0 && audio.duration > 0) {
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
        const progress = Math.round((bufferedEnd / audio.duration) * 100);
        updateLoadingState(stem.id, { progress });
      }
    });
    
    // Ready to play
    audio.addEventListener('canplaythrough', () => {
      updateLoadingState(stem.id, {
        isLoading: false,
        progress: 100,
        isReady: true,
      });
      
      // Cache in background
      if (stem.audio_url) {
        fetch(stem.audio_url)
          .then(res => res.ok ? res.blob() : null)
          .then(blob => blob && cacheAudio(stem.audio_url, blob))
          .catch(() => {}); // Ignore cache errors
      }
    }, { once: true });
    
    // Can start playing (enough data)
    audio.addEventListener('canplay', () => {
      updateLoadingState(stem.id, { isReady: true });
    }, { once: true });
    
    // Metadata loaded (duration available)
    audio.addEventListener('loadedmetadata', () => {
      updateLoadingState(stem.id, { progress: 10 });
    }, { once: true });
    
    // Error handling
    audio.addEventListener('error', () => {
      updateLoadingState(stem.id, {
        isLoading: false,
        error: new Error('Failed to load audio'),
      });
      logger.error('Stem audio load error', { stemId: stem.id });
    });
    
    // Try cache first, then network
    const loadAudio = async () => {
      try {
        const cached = await getCachedAudio(stem.audio_url);
        if (cached) {
          audio.src = URL.createObjectURL(cached);
          updateLoadingState(stem.id, { progress: 50 });
          logger.debug('Stem loaded from cache', { stemId: stem.id });
          return;
        }
      } catch (e) {
        // Cache miss, load from network
      }
      
      audio.src = stem.audio_url;
    };
    
    loadAudio();
    audioRefs.current[stem.id] = audio;
    
    return audio;
  }, [updateLoadingState]);
  
  // Preload all stems with priority ordering
  const preloadAllStems = useCallback((stems: TrackStem[]) => {
    // Sort by priority
    const sorted = [...stems].sort((a, b) => {
      const pA = STEM_PRIORITY[a.stem_type.toLowerCase()] || 10;
      const pB = STEM_PRIORITY[b.stem_type.toLowerCase()] || 10;
      return pA - pB;
    });
    
    // Initialize all (browser handles connection pooling)
    sorted.forEach(stem => initializeStem(stem));
  }, [initializeStem]);
  
  // Calculate overall progress
  const overallProgress = Object.values(loadingStates).length > 0
    ? Math.round(
        Object.values(loadingStates).reduce((sum, s) => sum + (s.progress || 0), 0) /
        Object.values(loadingStates).length
      )
    : 0;
  
  // Check if all stems are loaded
  const isFullyLoaded = Object.values(loadingStates).length > 0 &&
    Object.values(loadingStates).every(s => s.isReady || s.error);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        if (audio.src.startsWith('blob:')) {
          URL.revokeObjectURL(audio.src);
        }
        audio.src = '';
      });
      audioRefs.current = {};
    };
  }, []);
  
  return {
    audioRefs: audioRefs.current,
    loadingStates,
    overallProgress,
    isFullyLoaded,
    initializeStem,
    preloadAllStems,
  };
}
