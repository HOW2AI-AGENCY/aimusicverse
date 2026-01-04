/**
 * Global Audio Provider
 * 
 * Manages the singleton audio element and syncs it with Zustand store.
 * Must be mounted at app root level.
 * 
 * Optimizations:
 * - Debounced time updates to reduce re-renders
 * - Audio prefetching for next tracks
 * - Enhanced error handling
 */

import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { setGlobalAudioRef } from '@/hooks/audio/useAudioTime';
import { useOptimizedAudioPlayer } from '@/hooks/audio/useOptimizedAudioPlayer';
import { usePlaybackPosition } from '@/hooks/audio/usePlaybackPosition';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import { playerAnalytics, recordError } from '@/lib/telemetry';

// Audio error messages by error code
const AUDIO_ERROR_MESSAGES: Record<number, { ru: string; action?: string }> = {
  1: { ru: 'Загрузка аудио прервана', action: 'Попробуйте еще раз' },
  2: { ru: 'Сетевая ошибка при загрузке', action: 'Проверьте подключение' },
  3: { ru: 'Ошибка декодирования аудио', action: 'Файл может быть поврежден' },
  4: { ru: 'Формат аудио не поддерживается', action: 'Попробуйте другой трек' },
};

export function GlobalAudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastTrackIdRef = useRef<string | null>(null);
  // Suppress errors during initial startup to avoid stale data toasts
  const mountTimeRef = useRef(Date.now());
  const isStartupPeriod = () => Date.now() - mountTimeRef.current < 2000;

  const {
    activeTrack,
    isPlaying,
    repeat,
    volume,
    pauseTrack,
    nextTrack,
  } = usePlayerStore();

  // Use optimized audio player with caching and prefetch
  const { prefetchNextTracks } = useOptimizedAudioPlayer({
    enablePrefetch: true,
    enableCache: true,
    crossfadeDuration: 0.3,
  });

  // Use playback position persistence
  usePlaybackPosition();

  // Initialize audio element once
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'auto';

      // CRITICAL: Set initial volume from store
      audioRef.current.volume = volume;
      audioRef.current.muted = false;

      // Log audio element state for debugging
      logger.info('Audio element initialized', {
        volume: audioRef.current.volume,
        muted: audioRef.current.muted,
        readyState: audioRef.current.readyState
      });

      setGlobalAudioRef(audioRef.current);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        logger.debug('Audio element cleaned up');
      }
    };
  }, []);

  // Sync volume from store to audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && volume !== audio.volume) {
      audio.volume = volume;
      logger.debug('Volume synced from store', { volume });
    }
  }, [volume]);

  // Get audio source from track with validation and detailed logging
  const getAudioSource = useCallback(() => {
    if (!activeTrack) {
      logger.debug('No active track');
      return null;
    }

    const source = activeTrack.streaming_url || activeTrack.local_audio_url || activeTrack.audio_url;

    // Validate source URL
    if (!source) {
      logger.warn('Track has no audio source', {
        trackId: activeTrack.id,
        title: activeTrack.title,
        status: activeTrack.status
      });

      // Show user-friendly error
      toast.error('Трек не готов к воспроизведению', {
        description: activeTrack.status === 'processing'
          ? 'Трек еще генерируется, подождите...'
          : 'Файл трека отсутствует'
      });

      return null;
    }

    // Check for valid URL format
    try {
      // For blob URLs, just check prefix
      if (source.startsWith('blob:')) {
        logger.debug('Using blob URL', { trackId: activeTrack.id });
        return source;
      }

      // For data URLs, check format
      if (source.startsWith('data:')) {
        if (source.startsWith('data:audio/')) {
          logger.debug('Using data URL', { trackId: activeTrack.id });
          return source;
        }
        logger.warn('Invalid data URL format', { trackId: activeTrack.id });
        return null;
      }

      // For HTTP(S) URLs, validate
      const url = new URL(source);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        logger.warn('Invalid audio URL protocol', { protocol: url.protocol, trackId: activeTrack.id });
        // Don't show toast during startup to avoid stale data errors
        if (!isStartupPeriod()) {
          toast.error('Неверный формат URL аудио');
        }
        return null;
      }

      logger.debug('Using HTTP(S) URL', {
        trackId: activeTrack.id,
        protocol: url.protocol,
        hostname: url.hostname
      });
      return source;
    } catch (err) {
      logger.error('Invalid audio URL', err instanceof Error ? err : new Error(String(err)), {
        source: source.substring(0, 100),
        trackId: activeTrack.id,
      });
      // Don't show toast during startup to avoid stale data errors
      if (!isStartupPeriod()) {
        toast.error('Ошибка URL аудио', {
          description: 'Неверный формат ссылки на аудиофайл'
        });
      }
      return null;
    }
  }, [activeTrack]);

  // Stable ref for isPlaying to avoid effect re-runs
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  
  // Ref to track if we're currently loading a new track
  const isLoadingRef = useRef(false);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  // Effect for loading new tracks - only triggers on track change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const source = getAudioSource();
    
    // Handle no source
    if (!source) {
      logger.debug('No source available, clearing audio');
      audio.pause();
      audio.src = '';
      lastTrackIdRef.current = null;
      isLoadingRef.current = false;
      return;
    }

    const trackChanged = activeTrack?.id !== lastTrackIdRef.current;
    
    // Only load if track actually changed
    if (trackChanged) {
      lastTrackIdRef.current = activeTrack?.id || null;
      isLoadingRef.current = true;
      
      logger.debug('Loading new track', { 
        trackId: activeTrack?.id,
        title: activeTrack?.title 
      });
      
      // Cancel any pending play promise
      playPromiseRef.current = null;
      
      // Pause before changing source to prevent conflicts
      audio.pause();
      audio.src = source;
      audio.load();
      
      // Mark loading complete when audio is ready
      const handleCanPlayThrough = () => {
        isLoadingRef.current = false;
        audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      };
      audio.addEventListener('canplaythrough', handleCanPlayThrough);
      
      // Also mark ready on loadeddata for faster response
      const handleLoadedData = () => {
        if (audio.readyState >= 2) {
          isLoadingRef.current = false;
        }
        audio.removeEventListener('loadeddata', handleLoadedData);
      };
      audio.addEventListener('loadeddata', handleLoadedData);
    }
  }, [activeTrack?.id, activeTrack?.title, getAudioSource]);

  // Separate effect for play/pause control - avoids race conditions
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;

    let isCleanedUp = false;
    let playTimeoutId: NodeJS.Timeout | null = null;

    const attemptPlay = async () => {
      if (isCleanedUp) return;

      // CRITICAL: Wait for loading to complete before playing
      if (isLoadingRef.current) {
        logger.debug('Waiting for audio to load before playing');
        // Wait for loadeddata or canplaythrough
        const waitForLoad = new Promise<void>((resolve) => {
          const checkReady = () => {
            if (!isLoadingRef.current || audio.readyState >= 2) {
              resolve();
              return;
            }
            setTimeout(checkReady, 50);
          };
          checkReady();
        });
        
        await Promise.race([
          waitForLoad,
          new Promise(resolve => setTimeout(resolve, 3000)) // 3s timeout
        ]);
      }

      // Log detailed audio state before play attempt
      logger.debug('Attempting to play', {
        trackId: activeTrack?.id,
        readyState: audio.readyState,
        volume: audio.volume,
        muted: audio.muted,
        paused: audio.paused,
      });

      // CRITICAL FIX: Sync volume from store
      if (audio.volume !== volume) {
        logger.debug('Syncing volume from store', { storeVolume: volume, audioVolume: audio.volume });
        audio.volume = volume;
      }
      
      // Ensure volume is audible
      if (audio.volume === 0) {
        logger.warn('Volume was 0, setting to store value or 1.0');
        audio.volume = volume > 0 ? volume : 1.0;
      }
      if (audio.muted) {
        logger.warn('Audio was muted, unmuting');
        audio.muted = false;
      }

      // Resume AudioContext
      try {
        const { resumeAudioContext, ensureAudioRoutedToDestination } = await import('@/lib/audioContextManager');
        const contextResumed = await resumeAudioContext(3);
        if (!contextResumed) {
          await ensureAudioRoutedToDestination();
        }
      } catch {
        logger.warn('AudioContext resume issue');
      }

      // Wait for any pending play promise
      if (playPromiseRef.current) {
        try {
          await playPromiseRef.current;
        } catch {
          // Ignore
        }
        playPromiseRef.current = null;
      }

      try {
        playPromiseRef.current = audio.play();
        await playPromiseRef.current;
        logger.info('Playback started successfully', { trackId: activeTrack?.id });
        playerAnalytics.trackPlay(activeTrack?.id || '', 'global_provider');
      } catch (error: unknown) {
        const err = error as { name?: string };
        if (err.name === 'AbortError' || isCleanedUp) {
          // Ignore abort errors from track changes
          return;
        }
        
        logger.error('Playback failed', error, {
          errorName: err.name,
          trackId: activeTrack?.id,
        });

        if (err.name === 'NotAllowedError') {
          // Don't show toast during startup to avoid stale data errors
          if (!isStartupPeriod()) {
            toast.error('Воспроизведение заблокировано', {
              description: 'Нажмите на экран и попробуйте снова',
            });
          }
        } else if (err.name === 'NotSupportedError') {
          // Don't show toast during startup to avoid stale data errors
          if (!isStartupPeriod()) {
            toast.error('Формат аудио не поддерживается');
          }
        }

        pauseTrack();
      } finally {
        playPromiseRef.current = null;
      }
    };

    if (isPlaying) {
      // Wait for audio to be ready if needed
      if (audio.readyState >= 2 && !isLoadingRef.current) {
        attemptPlay();
      } else {
        const handleCanPlay = () => {
          if (!isCleanedUp && isPlayingRef.current) {
            attemptPlay();
          }
          audio.removeEventListener('canplay', handleCanPlay);
        };
        audio.addEventListener('canplay', handleCanPlay);
        
        // Cleanup timeout to prevent stale handlers
        playTimeoutId = setTimeout(() => {
          audio.removeEventListener('canplay', handleCanPlay);
          // If still not ready after 5s, try anyway
          if (!isCleanedUp && isPlayingRef.current && audio.src) {
            isLoadingRef.current = false;
            attemptPlay();
          }
        }, 5000);

        return () => {
          isCleanedUp = true;
          audio.removeEventListener('canplay', handleCanPlay);
          if (playTimeoutId) clearTimeout(playTimeoutId);
        };
      }
    } else {
      // Cancel any pending play
      if (playPromiseRef.current) {
        playPromiseRef.current = null;
      }
      audio.pause();
    }

    return () => {
      isCleanedUp = true;
      if (playTimeoutId) clearTimeout(playTimeoutId);
    };
  }, [isPlaying, activeTrack?.id, volume, pauseTrack]);

  // Handle track ended and errors with retry logic
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      logger.debug('Track ended', { trackId: activeTrack?.id });
      playerAnalytics.trackComplete(activeTrack?.id || '', audio.currentTime, audio.duration);
      if (repeat === 'one') {
        // Ensure audio is still available and valid before repeating
        if (audio.src && audio.duration > 0) {
          audio.currentTime = 0;
          // Only play if we're still in playing state
          if (isPlaying) {
            audio.play().catch((err) => {
              logger.warn('Repeat play failed', err);
              // If repeat play fails, try moving to next track
              if (err.name !== 'AbortError') {
                nextTrack();
              }
            });
          }
        } else {
          // Source is invalid, move to next track
          logger.warn('Cannot repeat track: invalid source');
          nextTrack();
        }
      } else {
        nextTrack();
      }
    };

    // Track retry attempts for failed loads
    let retryCount = 0;
    const MAX_RETRIES = 3;
    let retryTimeoutId: NodeJS.Timeout | null = null;

    const handleError = () => {
      // Ignore errors when src is empty or not set
      if (!audio.src || audio.src === '' || audio.src === window.location.href) {
        return;
      }
      
      const errorCode = audio.error?.code || 0;
      const errorInfo = AUDIO_ERROR_MESSAGES[errorCode] || { 
        ru: 'Ошибка воспроизведения' 
      };
      
      logger.error('Audio playback error', null, {
        errorCode,
        errorMessage: audio.error?.message,
        trackId: activeTrack?.id,
        title: activeTrack?.title,
        source: audio.src?.substring(0, 100),
        retryCount,
      });
      
      // Record error in telemetry
      playerAnalytics.trackError(activeTrack?.id || '', `audio_error_${errorCode}`);
      recordError(`audio:${errorCode}`, audio.error?.message || 'Unknown audio error', {
        trackId: activeTrack?.id,
        retryCount,
      });
      
      // During startup, suppress toasts to avoid stale data errors
      const suppressToast = isStartupPeriod();
      
      // Retry logic for network errors (code 2)
      if (errorCode === 2 && retryCount < MAX_RETRIES) {
        retryCount++;
        logger.debug(`Retrying audio load (attempt ${retryCount}/${MAX_RETRIES})`);
        
        // Exponential backoff: 1s, 2s, 4s
        const retryDelay = Math.pow(2, retryCount - 1) * 1000;
        
        retryTimeoutId = setTimeout(() => {
          const currentSrc = audio.src;
          audio.load();
          
          // Attempt to resume playback if it was playing
          if (isPlaying) {
            audio.play().catch((playErr) => {
              logger.warn('Retry play failed', playErr);
            });
          }
          
          if (!suppressToast) {
            toast.info('Повторная попытка загрузки...', {
              description: `Попытка ${retryCount} из ${MAX_RETRIES}`,
            });
          }
        }, retryDelay);
        
        return;
      }
      
      // Max retries reached or non-retryable error
      // Show user-friendly error message (but not during startup)
      if (!suppressToast) {
        toast.error(errorInfo.ru, {
          description: errorInfo.action,
        });
      }
      
      pauseTrack();
      
      // Auto-skip to next track after 2 seconds for better UX
      retryTimeoutId = setTimeout(() => {
        logger.debug('Auto-skipping to next track after error');
        nextTrack();
      }, 2000);
    };

    const handleStalled = () => {
      logger.warn('Audio playback stalled', { 
        trackId: activeTrack?.id,
        currentTime: audio.currentTime,
        buffered: audio.buffered.length,
      });
      
      // Try to recover by reloading
      const currentTime = audio.currentTime;
      audio.load();
      audio.currentTime = currentTime;
      
      if (isPlaying) {
        audio.play().catch((err) => {
          logger.error('Failed to recover from stall', err);
        });
      }
    };

    const handleSuspend = () => {
      logger.debug('Audio loading suspended', { 
        trackId: activeTrack?.id,
        networkState: audio.networkState,
        readyState: audio.readyState,
      });
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('stalled', handleStalled);
    audio.addEventListener('suspend', handleSuspend);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('stalled', handleStalled);
      audio.removeEventListener('suspend', handleSuspend);
      
      // Clear retry timeout on cleanup
      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId);
      }
    };
  }, [repeat, nextTrack, pauseTrack, activeTrack, isPlaying]);

  return <>{children}</>;
}
