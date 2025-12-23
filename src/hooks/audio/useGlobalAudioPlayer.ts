/**
 * Global Audio Player Hook
 * 
 * Singleton audio player that syncs with Zustand store.
 * Provides actual audio playback connected to global player state.
 */

import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { getGlobalAudioRef } from '@/hooks/audio/useAudioTime';
import { logger } from '@/lib/logger';

export function useGlobalAudioPlayer() {
  const {
    activeTrack,
    isPlaying,
    repeat,
    pauseTrack,
    nextTrack,
  } = usePlayerStore();

  const lastTrackIdRef = useRef<string | null>(null);
  const lastAudioSourceRef = useRef<string | null>(null);

  // Get audio source from track
  const getAudioSource = useCallback(() => {
    if (!activeTrack) return null;
    return activeTrack.streaming_url || activeTrack.local_audio_url || activeTrack.audio_url;
  }, [activeTrack]);

  // Handle track change - load new source
  // CRITICAL: Reload audio when track ID OR audio source changes (for version switching)
  useEffect(() => {
    const audio = getGlobalAudioRef();
    if (!audio) return;
    
    const trackId = activeTrack?.id;
    const source = getAudioSource();
    
    // Skip if neither track ID nor audio source has changed
    const sourceChanged = source !== lastAudioSourceRef.current;
    const trackChanged = trackId !== lastTrackIdRef.current;
    
    if (!sourceChanged && !trackChanged) {
      return;
    }
    
    // Update refs before any state changes
    lastTrackIdRef.current = trackId || null;
    lastAudioSourceRef.current = source || null;

    if (!source) {
      // Only clear src if no track is active
      if (!trackId) {
        audio.src = '';
      }
      return;
    }

    // Load new audio source
    logger.debug('Audio source loading', { 
      trackId, 
      sourceChanged, 
      trackChanged,
      source: source.substring(0, 50) 
    });
    audio.src = source;
    audio.load();
  }, [activeTrack?.id, getAudioSource]);

  // Handle play/pause state with race condition protection
  const playPromiseRef = useRef<Promise<void> | null>(null);
  
  useEffect(() => {
    const audio = getGlobalAudioRef();
    if (!audio) return;
    
    const handlePlayPause = async () => {
      // Wait for any pending play promise to resolve
      if (playPromiseRef.current) {
        try {
          await playPromiseRef.current;
        } catch {
          // Ignore errors from previous play attempts
        }
        playPromiseRef.current = null;
      }
      
      if (isPlaying && audio.src) {
        try {
          playPromiseRef.current = audio.play();
          await playPromiseRef.current;
        } catch (error) {
          // Only log non-abort errors (AbortError is expected when interrupted)
          if (error instanceof Error && error.name !== 'AbortError') {
            logger.error('Playback error', error);
            pauseTrack();
          }
        } finally {
          playPromiseRef.current = null;
        }
      } else {
        audio.pause();
      }
    };
    
    handlePlayPause();
  }, [isPlaying, pauseTrack]);

  // Handle track ended
  useEffect(() => {
    const audio = getGlobalAudioRef();
    if (!audio) return;

    const handleEnded = () => {
      if (repeat === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else {
        nextTrack();
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [repeat, nextTrack]);

  // Playback controls
  const seek = useCallback((time: number) => {
    const audio = getGlobalAudioRef();
    if (audio && audio.src) {
      audio.currentTime = time;
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    const audio = getGlobalAudioRef();
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, volume));
    }
  }, []);

  // Get current playback state
  const getCurrentTime = useCallback(() => {
    const audio = getGlobalAudioRef();
    return audio ? audio.currentTime : 0;
  }, []);

  const getDuration = useCallback(() => {
    const audio = getGlobalAudioRef();
    return audio ? (audio.duration || 0) : 0;
  }, []);

  const getBuffered = useCallback(() => {
    const audio = getGlobalAudioRef();
    if (audio && audio.buffered.length > 0 && audio.duration) {
      return (audio.buffered.end(audio.buffered.length - 1) / audio.duration) * 100;
    }
    return 0;
  }, []);

  return {
    seek,
    setVolume,
    getCurrentTime,
    getDuration,
    getBuffered,
    audioElement: getGlobalAudioRef(),
  };
}
