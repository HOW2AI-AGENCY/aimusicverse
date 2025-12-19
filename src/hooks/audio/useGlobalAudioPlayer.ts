/**
 * Global Audio Player Hook
 * 
 * Singleton audio player that syncs with Zustand store.
 * Provides actual audio playback connected to global player state.
 */

import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/hooks/audio';
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

  // Get audio source from track
  const getAudioSource = useCallback(() => {
    if (!activeTrack) return null;
    return activeTrack.streaming_url || activeTrack.local_audio_url || activeTrack.audio_url;
  }, [activeTrack]);

  // Handle track change - load new source
  // CRITICAL: Only reload audio when track ID actually changes
  useEffect(() => {
    const audio = getGlobalAudioRef();
    if (!audio) return;
    
    const trackId = activeTrack?.id;
    
    // Skip if track hasn't changed
    if (trackId === lastTrackIdRef.current) {
      return;
    }
    
    const source = getAudioSource();
    
    // Update ref before any state changes
    lastTrackIdRef.current = trackId || null;

    if (!source) {
      // Only clear src if no track is active
      if (!trackId) {
        audio.src = '';
      }
      return;
    }

    // Load new audio source
    audio.src = source;
    audio.load();
    logger.debug('Audio source loaded for new track', { trackId, source: source.substring(0, 50) });
  }, [activeTrack?.id, getAudioSource]);

  // Handle play/pause state - with proper AbortError handling
  useEffect(() => {
    const audio = getGlobalAudioRef();
    if (!audio) return;
    
    let isCancelled = false;
    
    if (isPlaying && audio.src) {
      audio.play().catch((error: Error) => {
        // AbortError is expected when track changes or pause is called quickly
        if (error.name === 'AbortError' || isCancelled) {
          logger.debug('Play interrupted (expected)', { errorName: error.name });
          return;
        }
        logger.error('Playback error', error);
        pauseTrack();
      });
    } else {
      audio.pause();
    }
    
    return () => {
      isCancelled = true;
    };
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
