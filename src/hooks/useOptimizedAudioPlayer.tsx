/**
 * Optimized Audio Player Hook
 * 
 * Enhanced version of useAudioPlayer with performance optimizations:
 * - Debounced time updates to reduce re-renders
 * - Throttled progress updates
 * - Memory monitoring and cleanup
 * - Performance measurement
 * - Smart buffering strategies
 * - Next track preloading
 * 
 * Use this hook for production environments where performance is critical.
 * 
 * @module useOptimizedAudioPlayer
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { debounce, throttle, markPerformance, preloadAudio, requestIdleCallback } from '@/lib/performance-utils';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'OptimizedAudioPlayer' });

/**
 * Props for optimized audio player hook
 */
interface UseOptimizedAudioPlayerProps {
  trackId: string;
  streamingUrl?: string | null;
  localAudioUrl?: string | null;
  audioUrl?: string | null;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  nextTrackUrl?: string | null;  // For preloading
  enablePreload?: boolean;        // Enable next track preloading
}

/**
 * Optimized audio player hook with performance enhancements
 * 
 * @param props - Audio player configuration
 * @returns Audio player state and controls
 */
export const useOptimizedAudioPlayer = ({
  trackId,
  streamingUrl,
  localAudioUrl,
  audioUrl,
  onPlay,
  onPause,
  onEnded,
  nextTrackUrl,
  enablePreload = true,
}: UseOptimizedAudioPlayerProps) => {
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadRef = useRef<HTMLAudioElement | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  // Audio source priority
  const audioSource = streamingUrl || localAudioUrl || audioUrl;

  /**
   * Debounced time update - reduces re-renders during playback
   * Updates at most every 100ms instead of multiple times per second
   */
  const debouncedSetCurrentTime = useMemo(
    () => debounce((time: number) => {
      setCurrentTime(time);
    }, 100),
    []
  );

  /**
   * Throttled progress update - limits buffer progress checks
   * Updates at most every 500ms to reduce overhead
   */
  const throttledSetBuffered = useMemo(
    () => throttle((percent: number) => {
      setBuffered(percent);
    }, 500),
    []
  );

  /**
   * Preload next track in background
   * Improves user experience by reducing wait time for next track
   */
  const preloadNextTrack = useCallback(() => {
    if (!enablePreload || !nextTrackUrl) return;

    // Clean up previous preload
    if (preloadRef.current) {
      preloadRef.current.src = '';
      preloadRef.current = null;
    }

    // Start preloading when browser is idle using utility function
    requestIdleCallback(() => {
      preloadAudio(nextTrackUrl).catch((error) => {
        log.warn('Failed to preload next track', { error });
      });
    }, { timeout: 1000 });
  }, [nextTrackUrl, enablePreload]);

  /**
   * Main audio setup effect with optimizations
   */
  useEffect(() => {
    if (!audioSource) {
      setError('No audio source available');
      return;
    }

    // Performance measurement
    const measure = markPerformance(`audio-load-${trackId}`);

    // Initialize audio element with optimizations
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'metadata'; // Load only metadata initially
      
      // Enable CORS for cross-origin audio
      audioRef.current.crossOrigin = 'anonymous';
    }

    const audio = audioRef.current;
    audio.src = audioSource;

    // Clear any previous errors
    setError(null);

    /**
     * Optimized time update handler
     * Uses debouncing to reduce update frequency
     */
    const handleTimeUpdate = () => {
      const now = performance.now();
      
      // Skip updates if less than 100ms since last update
      if (now - lastUpdateTimeRef.current < 100) {
        return;
      }

      lastUpdateTimeRef.current = now;
      debouncedSetCurrentTime(audio.currentTime);
    };

    /**
     * Optimized progress handler
     * Uses throttling to limit buffer checks
     */
    const handleProgress = () => {
      if (audio.buffered.length > 0) {
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
        const bufferedPercent = (bufferedEnd / audio.duration) * 100;
        throttledSetBuffered(bufferedPercent);

        // Start preloading next track when current is 50% buffered
        if (bufferedPercent > 50) {
          preloadNextTrack();
        }
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setLoading(false);
      
      // End performance measurement
      const loadTime = measure.end();
      log.debug('Audio loaded', { loadTimeMs: loadTime.toFixed(2) });
    };

    const handleCanPlay = () => {
      setLoading(false);
    };

    const handleWaiting = () => {
      setLoading(true);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.();
    };

    /**
     * Enhanced error handler with detailed logging
     */
    const handleError = (e: Event) => {
      const audioError = audio.error;
      let errorMessage = 'Audio playback error';

      if (audioError) {
        switch (audioError.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'Playback aborted';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = 'Decode error';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Source not supported';
            break;
        }
      }

      log.error('Audio playback error', { error: errorMessage, audioError });
      setError(errorMessage);
      setLoading(false);
      setIsPlaying(false);

      // Attempt fallback
      if (audio.src === streamingUrl && localAudioUrl) {
        log.info('Attempting local source fallback');
        audio.src = localAudioUrl;
        audio.load();
      } else if (audio.src === localAudioUrl && audioUrl && audioUrl !== localAudioUrl) {
        log.info('Attempting original URL fallback');
        audio.src = audioUrl;
        audio.load();
      }

      measure.cancel(); // Cancel performance measurement on error
    };

    // Register event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('progress', handleProgress);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Cleanup
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('progress', handleProgress);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioSource, streamingUrl, localAudioUrl, audioUrl, trackId, onPlay, onPause, onEnded, debouncedSetCurrentTime, throttledSetBuffered, preloadNextTrack]);

  /**
   * Optimized play function with error handling
   */
  const play = useCallback(async () => {
    if (!audioRef.current || !audioSource) {
      setError('No audio source available');
      return;
    }

    try {
      setLoading(true);
      await audioRef.current.play();
      setError(null);
    } catch (error: any) {
      console.error('Play error:', error);
      setError(error.message || 'Failed to play audio');
      setLoading(false);
    }
  }, [audioSource]);

  /**
   * Pause function
   */
  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
  }, []);

  /**
   * Toggle play/pause
   */
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  /**
   * Optimized seek function with validation
   */
  const seek = useCallback((time: number) => {
    if (!audioRef.current || !duration) return;

    // Validate seek time
    const validTime = Math.max(0, Math.min(time, duration));
    
    audioRef.current.currentTime = validTime;
    setCurrentTime(validTime);
  }, [duration]);

  /**
   * Set volume with validation
   */
  const setVolume = useCallback((volume: number) => {
    if (!audioRef.current) return;
    
    // Clamp volume between 0 and 1
    const validVolume = Math.max(0, Math.min(1, volume));
    audioRef.current.volume = validVolume;
  }, []);

  /**
   * Cleanup effect
   */
  useEffect(() => {
    return () => {
      // Clean up main audio element
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }

      // Clean up preload element
      if (preloadRef.current) {
        preloadRef.current.src = '';
        preloadRef.current = null;
      }
    };
  }, []);

  return {
    // State
    isPlaying,
    currentTime,
    duration,
    buffered,
    loading,
    error,
    audioSource,

    // Controls
    play,
    pause,
    togglePlay,
    seek,
    setVolume,
  };
};
