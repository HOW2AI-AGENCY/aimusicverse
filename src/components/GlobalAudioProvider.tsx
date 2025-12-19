/**
 * Global Audio Provider
 * 
 * Manages the singleton audio element and syncs it with Zustand store.
 * Uses crossfade player for smooth transitions between tracks.
 * 
 * Features:
 * - Crossfade between tracks
 * - Gapless playback with preloading
 * - Debounced track switching
 * - Enhanced error handling
 */

import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/hooks/audio';
import { setGlobalAudioRef, getGlobalAudioRef } from '@/hooks/audio';
import { usePlaybackPosition } from '@/hooks/audio/usePlaybackPosition';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

// Audio error messages by error code
const AUDIO_ERROR_MESSAGES: Record<number, { ru: string; action?: string }> = {
  1: { ru: 'Загрузка аудио прервана', action: 'Попробуйте еще раз' },
  2: { ru: 'Сетевая ошибка при загрузке', action: 'Проверьте подключение' },
  3: { ru: 'Ошибка декодирования аудио', action: 'Файл может быть поврежден' },
  4: { ru: 'Формат аудио не поддерживается', action: 'Попробуйте другой трек' },
};

// Crossfade configuration
const CROSSFADE_CONFIG = {
  crossfadeDuration: 2,       // seconds
  enableGapless: true,
  preloadThreshold: 10,       // seconds before end
  debounceDelay: 150,         // ms
};

// Easing function for smooth crossfade
function easeInOutCubic(t: number): number {
  return t < 0.5 
    ? 4 * t * t * t 
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function GlobalAudioProvider({ children }: { children: React.ReactNode }) {
  // Dual audio elements for crossfade
  const primaryAudioRef = useRef<HTMLAudioElement | null>(null);
  const secondaryAudioRef = useRef<HTMLAudioElement | null>(null);
  const activePrimaryRef = useRef(true);
  
  // Track state refs
  const lastTrackIdRef = useRef<string | null>(null);
  const pendingTrackIdRef = useRef<string | null>(null);
  const preloadedTrackIdRef = useRef<string | null>(null);
  
  // Debouncing and animation refs
  const trackChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const crossfadeAnimationRef = useRef<number | null>(null);
  const isTransitioningRef = useRef(false);
  const isLoadingRef = useRef(false);
  
  // Suppress errors during initial startup
  const mountTimeRef = useRef(Date.now());
  const isStartupPeriod = () => Date.now() - mountTimeRef.current < 2000;

  const {
    activeTrack,
    isPlaying,
    repeat,
    volume,
    queue,
    currentIndex,
    pauseTrack,
    nextTrack,
  } = usePlayerStore();

  // Use playback position persistence
  usePlaybackPosition();

  // Get next track in queue
  const getNextTrack = useCallback(() => {
    if (queue.length === 0) return null;
    const nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) {
      return repeat === 'all' ? queue[0] : null;
    }
    return queue[nextIndex];
  }, [queue, currentIndex, repeat]);

  // Get audio source from track with validation
  const getTrackSource = useCallback((track: typeof activeTrack): string | null => {
    if (!track) return null;

    const source = track.streaming_url || track.local_audio_url || track.audio_url;
    if (!source) {
      logger.warn('Track has no audio source', { trackId: track.id });
      return null;
    }

    // Validate URL
    try {
      if (source.startsWith('blob:') || source.startsWith('data:audio/')) {
        return source;
      }
      const url = new URL(source);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return null;
      }
      return source;
    } catch {
      return null;
    }
  }, []);

  // Initialize dual audio elements
  useEffect(() => {
    if (!primaryAudioRef.current) {
      primaryAudioRef.current = new Audio();
      primaryAudioRef.current.preload = 'auto';
      primaryAudioRef.current.volume = volume;
      primaryAudioRef.current.muted = false;
      setGlobalAudioRef(primaryAudioRef.current);
      logger.info('Primary audio element initialized for crossfade');
    }

    if (!secondaryAudioRef.current && CROSSFADE_CONFIG.enableGapless) {
      secondaryAudioRef.current = new Audio();
      secondaryAudioRef.current.preload = 'auto';
      secondaryAudioRef.current.volume = 0;
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
      if (trackChangeTimeoutRef.current) {
        clearTimeout(trackChangeTimeoutRef.current);
      }
    };
  }, []);

  // Sync volume
  useEffect(() => {
    const activeAudio = activePrimaryRef.current 
      ? primaryAudioRef.current 
      : secondaryAudioRef.current;
    if (activeAudio && !isTransitioningRef.current) {
      activeAudio.volume = volume;
    }
  }, [volume]);

  // Crossfade animation
  const performCrossfade = useCallback((
    outgoingAudio: HTMLAudioElement,
    incomingAudio: HTMLAudioElement,
    onComplete: () => void
  ) => {
    isTransitioningRef.current = true;
    
    const startTime = performance.now();
    const duration = CROSSFADE_CONFIG.crossfadeDuration * 1000;
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
      
      const fadeOut = initialOutVolume * (1 - easeInOutCubic(progress));
      const fadeIn = volume * easeInOutCubic(progress);
      
      outgoingAudio.volume = Math.max(0, fadeOut);
      incomingAudio.volume = Math.min(volume, fadeIn);
      
      if (progress < 1) {
        crossfadeAnimationRef.current = requestAnimationFrame(animate);
      } else {
        outgoingAudio.pause();
        outgoingAudio.volume = 0;
        incomingAudio.volume = volume;
        isTransitioningRef.current = false;
        onComplete();
        logger.debug('Crossfade completed');
      }
    };
    
    crossfadeAnimationRef.current = requestAnimationFrame(animate);
  }, [volume]);

  // Preload next track
  const preloadNextTrack = useCallback(() => {
    if (!CROSSFADE_CONFIG.enableGapless) return;
    
    const nextTrackData = getNextTrack();
    if (!nextTrackData) return;
    
    const nextSource = getTrackSource(nextTrackData);
    if (!nextSource) return;
    
    if (preloadedTrackIdRef.current === nextTrackData.id) return;
    
    const preloadAudio = activePrimaryRef.current 
      ? secondaryAudioRef.current 
      : primaryAudioRef.current;
    
    if (!preloadAudio) return;
    
    logger.debug('Preloading next track', { trackId: nextTrackData.id, title: nextTrackData.title });
    
    preloadAudio.src = nextSource;
    preloadAudio.load();
    preloadAudio.volume = 0;
    preloadedTrackIdRef.current = nextTrackData.id;
  }, [getNextTrack, getTrackSource]);

  // Monitor playback for preloading
  useEffect(() => {
    const activeAudio = activePrimaryRef.current 
      ? primaryAudioRef.current 
      : secondaryAudioRef.current;
    
    if (!activeAudio || !CROSSFADE_CONFIG.enableGapless) return;

    const handleTimeUpdate = () => {
      const timeRemaining = activeAudio.duration - activeAudio.currentTime;
      if (timeRemaining <= CROSSFADE_CONFIG.preloadThreshold && timeRemaining > 0) {
        preloadNextTrack();
      }
    };

    activeAudio.addEventListener('timeupdate', handleTimeUpdate);
    return () => activeAudio.removeEventListener('timeupdate', handleTimeUpdate);
  }, [preloadNextTrack]);

  // Handle track ended
  useEffect(() => {
    const activeAudio = activePrimaryRef.current 
      ? primaryAudioRef.current 
      : secondaryAudioRef.current;
    
    if (!activeAudio) return;

    const handleEnded = () => {
      logger.debug('Track ended', { trackId: activeTrack?.id });
      
      if (repeat === 'one') {
        activeAudio.currentTime = 0;
        activeAudio.play().catch(err => {
          if (err.name !== 'AbortError') {
            logger.error('Repeat play failed', err);
            nextTrack();
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
      if (CROSSFADE_CONFIG.enableGapless && preloadedTrackIdRef.current === nextTrackData.id) {
        const inactiveAudio = activePrimaryRef.current 
          ? secondaryAudioRef.current 
          : primaryAudioRef.current;
        
        if (inactiveAudio && inactiveAudio.src) {
          logger.info('Performing gapless transition');
          
          performCrossfade(activeAudio, inactiveAudio, () => {
            activePrimaryRef.current = !activePrimaryRef.current;
            setGlobalAudioRef(activePrimaryRef.current 
              ? primaryAudioRef.current! 
              : secondaryAudioRef.current!);
            preloadedTrackIdRef.current = null;
          });
          
          nextTrack();
          return;
        }
      }

      nextTrack();
    };

    activeAudio.addEventListener('ended', handleEnded);
    return () => activeAudio.removeEventListener('ended', handleEnded);
  }, [repeat, activeTrack?.id, getNextTrack, pauseTrack, nextTrack, performCrossfade]);

  // Debounced track loading
  useEffect(() => {
    const trackId = activeTrack?.id;
    
    if (!trackId || trackId === lastTrackIdRef.current) {
      return;
    }

    // Cancel pending operations
    if (trackChangeTimeoutRef.current) {
      clearTimeout(trackChangeTimeoutRef.current);
    }
    if (crossfadeAnimationRef.current) {
      cancelAnimationFrame(crossfadeAnimationRef.current);
      crossfadeAnimationRef.current = null;
    }

    pendingTrackIdRef.current = trackId;
    isLoadingRef.current = true;

    // Debounce track switch
    trackChangeTimeoutRef.current = setTimeout(() => {
      if (pendingTrackIdRef.current !== trackId) return;

      const source = getTrackSource(activeTrack);
      if (!source) {
        isLoadingRef.current = false;
        if (!isStartupPeriod()) {
          toast.error('Трек не готов к воспроизведению');
        }
        return;
      }

      const activeAudio = activePrimaryRef.current 
        ? primaryAudioRef.current 
        : secondaryAudioRef.current;
      
      const inactiveAudio = activePrimaryRef.current 
        ? secondaryAudioRef.current 
        : primaryAudioRef.current;

      if (!activeAudio) {
        isLoadingRef.current = false;
        return;
      }

      // Determine if we should crossfade
      const shouldCrossfade = CROSSFADE_CONFIG.crossfadeDuration > 0 && 
        lastTrackIdRef.current && 
        !activeAudio.paused && 
        activeAudio.currentTime > 0 &&
        inactiveAudio;

      if (shouldCrossfade && inactiveAudio) {
        // Load new track into inactive audio and crossfade
        inactiveAudio.src = source;
        inactiveAudio.load();
        
        const handleCanPlay = () => {
          performCrossfade(activeAudio, inactiveAudio, () => {
            activePrimaryRef.current = !activePrimaryRef.current;
            setGlobalAudioRef(activePrimaryRef.current 
              ? primaryAudioRef.current! 
              : secondaryAudioRef.current!);
            lastTrackIdRef.current = trackId;
            isLoadingRef.current = false;
            preloadedTrackIdRef.current = null;
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
          isLoadingRef.current = false;
          activeAudio.removeEventListener('canplay', handleCanPlay);
        };
        
        activeAudio.addEventListener('canplay', handleCanPlay);
      }

      logger.debug('Track loaded with debouncing', { trackId });
    }, CROSSFADE_CONFIG.debounceDelay);

    return () => {
      if (trackChangeTimeoutRef.current) {
        clearTimeout(trackChangeTimeoutRef.current);
      }
    };
  }, [activeTrack?.id, activeTrack, getTrackSource, isPlaying, pauseTrack, performCrossfade]);

  // Handle play/pause state
  useEffect(() => {
    const activeAudio = activePrimaryRef.current 
      ? primaryAudioRef.current 
      : secondaryAudioRef.current;
    
    if (!activeAudio || !activeAudio.src) return;
    if (isTransitioningRef.current || isLoadingRef.current) return;

    if (isPlaying) {
      if (activeAudio.readyState >= 2) {
        // Ensure volume is correct before playing
        activeAudio.volume = volume;
        activeAudio.muted = false;
        
        activeAudio.play().catch(err => {
          if (err.name !== 'AbortError') {
            logger.error('Play failed', err);
            
            if (err.name === 'NotAllowedError') {
              toast.error('Воспроизведение заблокировано', {
                description: 'Нажмите на экран и попробуйте снова',
              });
            }
            
            pauseTrack();
          }
        });
      }
    } else {
      activeAudio.pause();
    }
  }, [isPlaying, volume, pauseTrack]);

  // Error handling
  useEffect(() => {
    const setupErrorHandlers = (audio: HTMLAudioElement, label: string) => {
      let retryCount = 0;
      const MAX_RETRIES = 3;
      let retryTimeoutId: NodeJS.Timeout | null = null;

      const handleError = () => {
        if (!audio.src || audio.src === '' || audio.src === window.location.href) {
          return;
        }
        
        const errorCode = audio.error?.code || 0;
        const errorInfo = AUDIO_ERROR_MESSAGES[errorCode] || { ru: 'Ошибка воспроизведения' };
        
        logger.error(`Audio error (${label})`, null, {
          errorCode,
          trackId: activeTrack?.id,
          retryCount,
        });
        
        // Retry for network errors
        if (errorCode === 2 && retryCount < MAX_RETRIES) {
          retryCount++;
          const retryDelay = Math.pow(2, retryCount - 1) * 1000;
          
          retryTimeoutId = setTimeout(() => {
            audio.load();
            if (isPlaying) {
              audio.play().catch(() => {});
            }
          }, retryDelay);
          return;
        }
        
        if (!isStartupPeriod()) {
          toast.error(errorInfo.ru, { description: errorInfo.action });
        }
        
        pauseTrack();
        
        // Auto-skip after error
        retryTimeoutId = setTimeout(() => {
          nextTrack();
        }, 2000);
      };

      const handleStalled = () => {
        logger.warn(`Audio stalled (${label})`);
        const currentTime = audio.currentTime;
        audio.load();
        audio.currentTime = currentTime;
        if (isPlaying) {
          audio.play().catch(() => {});
        }
      };

      audio.addEventListener('error', handleError);
      audio.addEventListener('stalled', handleStalled);

      return () => {
        audio.removeEventListener('error', handleError);
        audio.removeEventListener('stalled', handleStalled);
        if (retryTimeoutId) clearTimeout(retryTimeoutId);
      };
    };

    const cleanups: (() => void)[] = [];
    
    if (primaryAudioRef.current) {
      cleanups.push(setupErrorHandlers(primaryAudioRef.current, 'primary'));
    }
    if (secondaryAudioRef.current) {
      cleanups.push(setupErrorHandlers(secondaryAudioRef.current, 'secondary'));
    }

    return () => cleanups.forEach(fn => fn());
  }, [activeTrack?.id, isPlaying, pauseTrack, nextTrack]);

  return <>{children}</>;
}
