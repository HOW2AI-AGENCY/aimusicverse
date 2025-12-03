/**
 * Global Audio Provider
 * 
 * Manages the singleton audio element and syncs it with Zustand store.
 * Must be mounted at app root level.
 */

import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/hooks/usePlayerState';
import { setGlobalAudioRef } from '@/hooks/useAudioTime';

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
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
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
              console.error('Playback error:', error);
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

  // Handle track ended
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (repeat === 'one') {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      } else {
        nextTrack();
      }
    };

    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      pauseTrack();
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [repeat, nextTrack, pauseTrack]);

  return <>{children}</>;
}
