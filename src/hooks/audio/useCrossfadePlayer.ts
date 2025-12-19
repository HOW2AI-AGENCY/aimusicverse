/**
 * Crossfade & Gapless Playback Hook
 * 
 * Manages dual audio elements for seamless track transitions:
 * - Crossfade: smooth fade out of current track and fade in of next
 * - Gapless playback: preload next track for instant transition
 * - Debounced track switching to prevent race conditions
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { usePlayerStore } from './usePlayerState';
import { setGlobalAudioRef, getGlobalAudioRef } from './useAudioTime';
import { logger } from '@/lib/logger';

export interface CrossfadeConfig {
  /** Crossfade duration in seconds (default: 2) */
  crossfadeDuration?: number;
  /** Enable gapless playback (default: true) */
  enableGapless?: boolean;
  /** Preload threshold in seconds before track ends (default: 10) */
  preloadThreshold?: number;
  /** Debounce delay for track switching in ms (default: 150) */
  debounceDelay?: number;
}

interface TrackSwitchState {
  isTransitioning: boolean;
  isLoading: boolean;
  preloadedTrackId: string | null;
}

export function useCrossfadePlayer(config: CrossfadeConfig = {}) {
  const {
    crossfadeDuration = 2,
    enableGapless = true,
    preloadThreshold = 10,
    debounceDelay = 150,
  } = config;

  const {
    activeTrack,
    isPlaying,
    queue,
    currentIndex,
    repeat,
    volume,
    pauseTrack,
    nextTrack,
  } = usePlayerStore();

  // Dual audio elements for crossfade
  const primaryAudioRef = useRef<HTMLAudioElement | null>(null);
  const secondaryAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Track which audio element is currently active
  const activePrimaryRef = useRef(true);
  
  // Debouncing refs
  const trackChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTrackIdRef = useRef<string | null>(null);
  const pendingTrackIdRef = useRef<string | null>(null);
  
  // Animation frame refs for crossfade
  const crossfadeAnimationRef = useRef<number | null>(null);
  
  // State for external consumers
  const [switchState, setSwitchState] = useState<TrackSwitchState>({
    isTransitioning: false,
    isLoading: false,
    preloadedTrackId: null,
  });

  // Get audio source from track
  const getTrackSource = useCallback((track: { streaming_url?: string | null; local_audio_url?: string | null; audio_url?: string | null } | null): string | null => {
    if (!track) return null;
    return track.streaming_url || track.local_audio_url || track.audio_url || null;
  }, []);

  // Get next track in queue
  const getNextTrack = useCallback(() => {
    if (queue.length === 0) return null;
    const nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) {
      return repeat === 'all' ? queue[0] : null;
    }
    return queue[nextIndex];
  }, [queue, currentIndex, repeat]);

  // Initialize audio elements
  useEffect(() => {
    if (!primaryAudioRef.current) {
      primaryAudioRef.current = new Audio();
      primaryAudioRef.current.preload = 'auto';
      primaryAudioRef.current.volume = volume;
      setGlobalAudioRef(primaryAudioRef.current);
      logger.info('Primary audio element initialized for crossfade');
    }

    if (!secondaryAudioRef.current && enableGapless) {
      secondaryAudioRef.current = new Audio();
      secondaryAudioRef.current.preload = 'auto';
      secondaryAudioRef.current.volume = 0; // Start silent
      logger.info('Secondary audio element initialized for gapless playback');
    }

    return () => {
      if (primaryAudioRef.current) {
        primaryAudioRef.current.pause();
        primaryAudioRef.current.src = '';
      }
      if (secondaryAudioRef.current) {
        secondaryAudioRef.current.pause();
        secondaryAudioRef.current.src = '';
      }
      if (crossfadeAnimationRef.current) {
        cancelAnimationFrame(crossfadeAnimationRef.current);
      }
    };
  }, [enableGapless, volume]);

  // Sync volume
  useEffect(() => {
    const activeAudio = activePrimaryRef.current ? primaryAudioRef.current : secondaryAudioRef.current;
    if (activeAudio) {
      activeAudio.volume = volume;
    }
  }, [volume]);

  // Crossfade animation function
  const performCrossfade = useCallback((
    outgoingAudio: HTMLAudioElement,
    incomingAudio: HTMLAudioElement,
    onComplete: () => void
  ) => {
    setSwitchState(prev => ({ ...prev, isTransitioning: true }));
    
    const startTime = performance.now();
    const duration = crossfadeDuration * 1000;
    const initialOutVolume = outgoingAudio.volume;
    
    // Start incoming audio
    incomingAudio.volume = 0;
    incomingAudio.play().catch(err => {
      if (err.name !== 'AbortError') {
        logger.error('Crossfade incoming play failed', err);
      }
    });

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Eased fade curves for smoother transition
      const fadeOut = initialOutVolume * (1 - easeInOutCubic(progress));
      const fadeIn = volume * easeInOutCubic(progress);
      
      outgoingAudio.volume = Math.max(0, fadeOut);
      incomingAudio.volume = Math.min(volume, fadeIn);
      
      if (progress < 1) {
        crossfadeAnimationRef.current = requestAnimationFrame(animate);
      } else {
        // Crossfade complete
        outgoingAudio.pause();
        outgoingAudio.volume = 0;
        incomingAudio.volume = volume;
        
        setSwitchState(prev => ({ ...prev, isTransitioning: false }));
        onComplete();
        
        logger.debug('Crossfade completed', { duration: crossfadeDuration });
      }
    };
    
    crossfadeAnimationRef.current = requestAnimationFrame(animate);
  }, [crossfadeDuration, volume]);

  // Preload next track for gapless playback
  const preloadNextTrack = useCallback(() => {
    if (!enableGapless) return;
    
    const nextTrackData = getNextTrack();
    if (!nextTrackData) return;
    
    const nextSource = getTrackSource(nextTrackData);
    if (!nextSource) return;
    
    // Get the inactive audio element
    const preloadAudio = activePrimaryRef.current 
      ? secondaryAudioRef.current 
      : primaryAudioRef.current;
    
    if (!preloadAudio) return;
    
    // Check if already preloaded
    if (switchState.preloadedTrackId === nextTrackData.id) return;
    
    logger.debug('Preloading next track', { 
      trackId: nextTrackData.id, 
      title: nextTrackData.title 
    });
    
    preloadAudio.src = nextSource;
    preloadAudio.load();
    preloadAudio.volume = 0;
    
    setSwitchState(prev => ({ ...prev, preloadedTrackId: nextTrackData.id }));
  }, [enableGapless, getNextTrack, getTrackSource, switchState.preloadedTrackId]);

  // Monitor playback position for preloading
  useEffect(() => {
    const activeAudio = activePrimaryRef.current 
      ? primaryAudioRef.current 
      : secondaryAudioRef.current;
    
    if (!activeAudio || !enableGapless) return;

    const handleTimeUpdate = () => {
      const timeRemaining = activeAudio.duration - activeAudio.currentTime;
      if (timeRemaining <= preloadThreshold && timeRemaining > 0) {
        preloadNextTrack();
      }
    };

    activeAudio.addEventListener('timeupdate', handleTimeUpdate);
    return () => activeAudio.removeEventListener('timeupdate', handleTimeUpdate);
  }, [enableGapless, preloadThreshold, preloadNextTrack]);

  // Handle track ended with gapless transition
  useEffect(() => {
    const activeAudio = activePrimaryRef.current 
      ? primaryAudioRef.current 
      : secondaryAudioRef.current;
    
    if (!activeAudio) return;

    const handleEnded = () => {
      if (repeat === 'one') {
        activeAudio.currentTime = 0;
        activeAudio.play().catch(err => {
          if (err.name !== 'AbortError') {
            logger.error('Repeat play failed', err);
          }
        });
        return;
      }

      const nextTrackData = getNextTrack();
      if (!nextTrackData) {
        pauseTrack();
        return;
      }

      // Check if next track is preloaded for gapless transition
      if (enableGapless && switchState.preloadedTrackId === nextTrackData.id) {
        const inactiveAudio = activePrimaryRef.current 
          ? secondaryAudioRef.current 
          : primaryAudioRef.current;
        
        if (inactiveAudio && inactiveAudio.src) {
          logger.info('Performing gapless transition');
          
          // Instant crossfade for gapless
          performCrossfade(activeAudio, inactiveAudio, () => {
            // Swap active audio
            activePrimaryRef.current = !activePrimaryRef.current;
            setGlobalAudioRef(activePrimaryRef.current 
              ? primaryAudioRef.current! 
              : secondaryAudioRef.current!);
            
            setSwitchState(prev => ({ ...prev, preloadedTrackId: null }));
          });
          
          // Trigger store update
          nextTrack();
          return;
        }
      }

      // Fallback to regular next track
      nextTrack();
    };

    activeAudio.addEventListener('ended', handleEnded);
    return () => activeAudio.removeEventListener('ended', handleEnded);
  }, [repeat, enableGapless, switchState.preloadedTrackId, getNextTrack, pauseTrack, nextTrack, performCrossfade]);

  // Debounced track loading
  useEffect(() => {
    const trackId = activeTrack?.id;
    
    // Skip if no track or same track
    if (!trackId || trackId === lastTrackIdRef.current) {
      return;
    }

    // Cancel pending switch
    if (trackChangeTimeoutRef.current) {
      clearTimeout(trackChangeTimeoutRef.current);
    }

    // Cancel ongoing crossfade
    if (crossfadeAnimationRef.current) {
      cancelAnimationFrame(crossfadeAnimationRef.current);
      crossfadeAnimationRef.current = null;
    }

    pendingTrackIdRef.current = trackId;
    setSwitchState(prev => ({ ...prev, isLoading: true }));

    // Debounce track switch
    trackChangeTimeoutRef.current = setTimeout(() => {
      // Verify this is still the pending track
      if (pendingTrackIdRef.current !== trackId) {
        return;
      }

      const source = getTrackSource(activeTrack);
      if (!source) {
        setSwitchState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const activeAudio = activePrimaryRef.current 
        ? primaryAudioRef.current 
        : secondaryAudioRef.current;
      
      const inactiveAudio = activePrimaryRef.current 
        ? secondaryAudioRef.current 
        : primaryAudioRef.current;

      if (!activeAudio) {
        setSwitchState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Check if we should crossfade (if current track is playing)
      const shouldCrossfade = crossfadeDuration > 0 && 
        lastTrackIdRef.current && 
        !activeAudio.paused && 
        activeAudio.currentTime > 0 &&
        inactiveAudio;

      if (shouldCrossfade && inactiveAudio) {
        // Load new track into inactive audio
        inactiveAudio.src = source;
        inactiveAudio.load();
        
        const handleCanPlay = () => {
          performCrossfade(activeAudio, inactiveAudio, () => {
            // Swap active audio
            activePrimaryRef.current = !activePrimaryRef.current;
            setGlobalAudioRef(activePrimaryRef.current 
              ? primaryAudioRef.current! 
              : secondaryAudioRef.current!);
            
            lastTrackIdRef.current = trackId;
            setSwitchState(prev => ({ 
              ...prev, 
              isLoading: false, 
              preloadedTrackId: null 
            }));
          });
          
          inactiveAudio.removeEventListener('canplay', handleCanPlay);
        };
        
        inactiveAudio.addEventListener('canplay', handleCanPlay);
      } else {
        // Direct load without crossfade
        activeAudio.pause();
        activeAudio.src = source;
        activeAudio.load();
        
        const handleCanPlay = () => {
          if (isPlaying) {
            activeAudio.play().catch(err => {
              if (err.name !== 'AbortError') {
                logger.error('Play after load failed', err);
                pauseTrack();
              }
            });
          }
          lastTrackIdRef.current = trackId;
          setSwitchState(prev => ({ ...prev, isLoading: false }));
          activeAudio.removeEventListener('canplay', handleCanPlay);
        };
        
        activeAudio.addEventListener('canplay', handleCanPlay);
      }

      logger.debug('Track loaded with debouncing', { trackId, debounceDelay });
    }, debounceDelay);

    return () => {
      if (trackChangeTimeoutRef.current) {
        clearTimeout(trackChangeTimeoutRef.current);
      }
    };
  }, [activeTrack?.id, activeTrack, getTrackSource, isPlaying, crossfadeDuration, debounceDelay, pauseTrack, performCrossfade]);

  // Handle play/pause state
  useEffect(() => {
    const activeAudio = activePrimaryRef.current 
      ? primaryAudioRef.current 
      : secondaryAudioRef.current;
    
    if (!activeAudio || !activeAudio.src) return;
    
    // Skip during transitions
    if (switchState.isTransitioning || switchState.isLoading) return;

    if (isPlaying) {
      if (activeAudio.readyState >= 2) {
        activeAudio.play().catch(err => {
          if (err.name !== 'AbortError') {
            logger.error('Play failed', err);
            pauseTrack();
          }
        });
      }
    } else {
      activeAudio.pause();
    }
  }, [isPlaying, switchState.isTransitioning, switchState.isLoading, pauseTrack]);

  // Manual crossfade trigger
  const triggerCrossfade = useCallback(() => {
    const activeAudio = activePrimaryRef.current 
      ? primaryAudioRef.current 
      : secondaryAudioRef.current;
    const inactiveAudio = activePrimaryRef.current 
      ? secondaryAudioRef.current 
      : primaryAudioRef.current;
    
    if (!activeAudio || !inactiveAudio || !activeAudio.src) return;
    
    // Start crossfade to next track
    nextTrack();
  }, [nextTrack]);

  return {
    isTransitioning: switchState.isTransitioning,
    isLoading: switchState.isLoading,
    preloadedTrackId: switchState.preloadedTrackId,
    triggerCrossfade,
    primaryAudio: primaryAudioRef.current,
    secondaryAudio: secondaryAudioRef.current,
    activeAudio: activePrimaryRef.current 
      ? primaryAudioRef.current 
      : secondaryAudioRef.current,
  };
}

// Easing function for smooth crossfade
function easeInOutCubic(t: number): number {
  return t < 0.5 
    ? 4 * t * t * t 
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
