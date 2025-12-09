/**
 * Global Audio Provider
 * 
 * Manages the singleton audio element and syncs it with Zustand store.
 * Must be mounted at app root level.
 */

import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/hooks/audio';
import { setGlobalAudioRef } from '@/hooks/audio';
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

  // Get audio source from track
  const getAudioSource = useCallback(() => {
    if (!activeTrack) return null;
    return activeTrack.streaming_url || activeTrack.local_audio_url || activeTrack.audio_url;
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

    // Handle play/pause state
    if (isPlaying && audio.src) {
      // Use a small timeout to ensure source is ready after load
      const playAttempt = () => {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            // Only log actual errors, not abort errors from track changes
            if (error.name !== 'AbortError') {
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
          if (isPlaying) {
            playAttempt();
          }
          audio.removeEventListener('canplay', handleCanPlay);
        };
        audio.addEventListener('canplay', handleCanPlay);
        
        // Cleanup listener if effect re-runs
        return () => {
          audio.removeEventListener('canplay', handleCanPlay);
        };
      } else {
        playAttempt();
      }
    } else if (!isPlaying) {
      audio.pause();
    }
  }, [activeTrack?.id, isPlaying, getAudioSource, pauseTrack]);

  // Handle track ended and errors
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      logger.debug('Track ended', { trackId: activeTrack?.id });
      if (repeat === 'one') {
        audio.currentTime = 0;
        audio.play().catch((err) => logger.warn('Repeat play failed', err));
      } else {
        nextTrack();
      }
    };

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
      });
      
      // Show user-friendly error message
      toast.error(errorInfo.ru, {
        description: errorInfo.action,
      });
      
      pauseTrack();
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [repeat, nextTrack, pauseTrack, activeTrack]);

  return <>{children}</>;
}
