/**
 * Global Audio Player Hook
 * 
 * Singleton audio player that syncs with Zustand store.
 * Provides actual audio playback connected to global player state.
 * Includes audio caching with 14-day expiry for optimized playback.
 * Plays from cache when available for instant playback.
 */

import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { getGlobalAudioRef } from '@/hooks/audio/useAudioTime';
import { logger } from '@/lib/logger';
import { cleanupExpiredEntries, prefetchQueue, shouldPrefetch, getCachedAudio, cacheAudio } from '@/lib/audioCache';

// Run cache cleanup on module load (once per session)
let cacheCleanupRun = false;
if (!cacheCleanupRun) {
  cacheCleanupRun = true;
  // Delay cleanup to not block initial load
  setTimeout(() => {
    cleanupExpiredEntries().catch(() => {});
  }, 5000);
}

export function useGlobalAudioPlayer() {
  const {
    activeTrack,
    isPlaying,
    repeat,
    pauseTrack,
    nextTrack,
    queue,
    currentIndex,
  } = usePlayerStore();

  const lastTrackIdRef = useRef<string | null>(null);
  const lastAudioSourceRef = useRef<string | null>(null);

  // Get audio source from track
  const getAudioSource = useCallback(() => {
    if (!activeTrack) return null;
    return activeTrack.streaming_url || activeTrack.local_audio_url || activeTrack.audio_url;
  }, [activeTrack]);
  
  // Prefetch next tracks when current track changes
  useEffect(() => {
    if (!activeTrack || queue.length === 0 || !shouldPrefetch()) return;
    
    const audioUrls = queue
      .map(t => t.streaming_url || t.audio_url)
      .filter((url): url is string => !!url);
    
    if (audioUrls.length > 0) {
      prefetchQueue(audioUrls, currentIndex);
    }
  }, [activeTrack?.id, queue, currentIndex]);

  // Handle track change - load new source
  // CRITICAL: Reload audio when track ID OR audio source changes (for version switching)
  // Prioritize cached audio for instant playback
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

    // Try to load from cache first for instant playback
    const loadAudio = async () => {
      try {
        const cachedBlob = await getCachedAudio(source);
        
        if (cachedBlob) {
          // Play from cache - instant playback
          const blobUrl = URL.createObjectURL(cachedBlob);
          logger.debug('Playing from cache', { 
            trackId, 
            source: source.substring(0, 50) 
          });
          audio.src = blobUrl;
          audio.load();
          
          // Cleanup blob URL when audio changes
          const cleanup = () => {
            URL.revokeObjectURL(blobUrl);
          };
          audio.addEventListener('emptied', cleanup, { once: true });
        } else {
          // Load from network and cache for future use
          logger.debug('Loading from network', { 
            trackId, 
            sourceChanged, 
            trackChanged,
            source: source.substring(0, 50) 
          });
          audio.src = source;
          audio.load();
          
          // Cache the audio in background after it loads
          fetch(source)
            .then(response => {
              if (response.ok) return response.blob();
              throw new Error('Failed to fetch audio');
            })
            .then(blob => cacheAudio(source, blob))
            .catch(err => logger.debug('Cache fetch failed', { error: err.message }));
        }
      } catch (error) {
        // Fallback to direct load if cache fails
        logger.debug('Cache error, loading directly', { error });
        audio.src = source;
        audio.load();
      }
    };
    
    loadAudio();
  }, [activeTrack?.id, getAudioSource]);

  // NOTE: Play/pause is handled by GlobalAudioProvider to avoid race conditions
  // This hook only provides utility functions and audio element access

  // Handle track ended - backup handler (GlobalAudioProvider is primary)
  useEffect(() => {
    const audio = getGlobalAudioRef();
    if (!audio) return;

    const handleEnded = () => {
      if (repeat === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => nextTrack());
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
