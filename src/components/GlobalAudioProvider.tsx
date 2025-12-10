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
import { usePlayerStore } from '@/hooks/audio';
import { setGlobalAudioRef, resumeAudioContext } from '@/hooks/audio';
import { useOptimizedAudioPlayer } from '@/hooks/audio/useOptimizedAudioPlayer';
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

export function GlobalAudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastTrackIdRef = useRef<string | null>(null);

  const {
    activeTrack,
    isPlaying,
    repeat,
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
      setGlobalAudioRef(audioRef.current);
      logger.debug('Audio element initialized');
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        logger.debug('Audio element cleaned up');
      }
    };
  }, []);

  // Get audio source from track with validation
  const getAudioSource = useCallback(() => {
    if (!activeTrack) return null;
    
    const source = activeTrack.streaming_url || activeTrack.local_audio_url || activeTrack.audio_url;
    
    // Validate source URL
    if (!source) return null;
    
    // Check for valid URL format
    try {
      // For blob URLs, just check prefix
      if (source.startsWith('blob:')) {
        return source;
      }
      
      // For data URLs, check format
      if (source.startsWith('data:')) {
        return source.startsWith('data:audio/') ? source : null;
      }
      
      // For HTTP(S) URLs, validate
      const url = new URL(source);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        logger.warn('Invalid audio URL protocol', { protocol: url.protocol, trackId: activeTrack.id });
        return null;
      }
      
      return source;
    } catch (err) {
      logger.error('Invalid audio URL', err instanceof Error ? err : new Error(String(err)), {
        source: source.substring(0, 100),
        trackId: activeTrack.id,
      });
      return null;
    }
  }, [activeTrack]);

  // Combined effect for track changes and play/pause state
  // This prevents race conditions between separate effects
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const source = getAudioSource();
    const trackChanged = activeTrack?.id !== lastTrackIdRef.current;

    // Handle no source
    if (!source) {
      audio.pause();
      audio.src = '';
      lastTrackIdRef.current = null;
      return;
    }

    // Load new track if changed
    if (trackChanged) {
      lastTrackIdRef.current = activeTrack?.id || null;
      logger.debug('Loading new track', { 
        trackId: activeTrack?.id,
        title: activeTrack?.title 
      });
      
      // Pause before changing source to prevent conflicts
      audio.pause();
      audio.src = source;
      audio.load();
    }

    // Track if cleanup has been called to prevent stale play attempts
    let isCleanedUp = false;

    // Handle play/pause state
    if (isPlaying && audio.src) {
      const playAttempt = async () => {
        // Don't attempt play if effect has been cleaned up
        if (isCleanedUp) return;
        
        // CRITICAL: Resume AudioContext before playing
        // This ensures Web Audio API is ready if visualizer is active
        try {
          await resumeAudioContext();
        } catch (err) {
          logger.warn('AudioContext resume failed before playback', err);
          // Continue anyway - audio might still work without visualizer
        }
        
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            // Only log actual errors, not abort errors from track changes
            if (error.name !== 'AbortError' && !isCleanedUp) {
              logger.warn('Playback interrupted', { 
                errorName: error.name,
                trackId: activeTrack?.id 
              });
              pauseTrack();
            }
          });
        }
      };

      if (trackChanged) {
        // Wait for canplay event after loading new track
        const handleCanPlay = () => {
          if (isPlaying && !isCleanedUp) {
            playAttempt();
          }
          audio.removeEventListener('canplay', handleCanPlay);
        };
        audio.addEventListener('canplay', handleCanPlay);
        
        // Cleanup listener if effect re-runs
        return () => {
          isCleanedUp = true;
          audio.removeEventListener('canplay', handleCanPlay);
        };
      } else {
        playAttempt();
      }
    } else if (!isPlaying) {
      audio.pause();
    }

    // Mark as cleaned up on effect cleanup
    return () => {
      isCleanedUp = true;
    };
  }, [activeTrack?.id, activeTrack?.title, isPlaying, getAudioSource, pauseTrack]);

  // Handle track ended and errors with retry logic
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      logger.debug('Track ended', { trackId: activeTrack?.id });
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
          
          toast.info('Повторная попытка загрузки...', {
            description: `Попытка ${retryCount} из ${MAX_RETRIES}`,
          });
        }, retryDelay);
        
        return;
      }
      
      // Max retries reached or non-retryable error
      // Show user-friendly error message
      toast.error(errorInfo.ru, {
        description: errorInfo.action,
      });
      
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
