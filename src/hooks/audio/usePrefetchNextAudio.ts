import { useEffect, useRef } from 'react';
import { Track } from '@/types/track';
import { logger } from '@/lib/logger';

interface PrefetchAudioOptions {
  enabled?: boolean;
}

/**
 * Prefetches audio for the next track in queue
 * for instant track switching without buffering
 */
export function usePrefetchNextAudio(
  queue: Track[],
  currentIndex: number,
  options: PrefetchAudioOptions = {}
) {
  const { enabled = true } = options;
  const preloadedAudioRef = useRef<HTMLAudioElement | null>(null);
  const preloadedUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !queue.length) return;
    
    const nextTrack = queue[currentIndex + 1];
    if (!nextTrack) {
      // No next track - clear preload
      if (preloadedAudioRef.current) {
        preloadedAudioRef.current.src = '';
        preloadedAudioRef.current = null;
        preloadedUrlRef.current = null;
      }
      return;
    }
    
    const nextUrl = nextTrack.streaming_url || nextTrack.audio_url;
    if (!nextUrl || nextUrl === preloadedUrlRef.current) return;
    
    // Create new Audio for preload
    const audio = new Audio();
    audio.preload = 'auto';
    
    audio.addEventListener('canplaythrough', () => {
      logger.debug('Next audio preloaded', { 
        trackId: nextTrack.id,
        title: nextTrack.title 
      });
    }, { once: true });
    
    audio.addEventListener('error', () => {
      logger.warn('Next audio preload failed', { trackId: nextTrack.id });
    }, { once: true });
    
    audio.src = nextUrl;
    audio.load();
    
    // Save reference
    preloadedAudioRef.current = audio;
    preloadedUrlRef.current = nextUrl;
    
    // Cleanup
    return () => {
      if (preloadedAudioRef.current) {
        preloadedAudioRef.current.src = '';
      }
    };
  }, [queue, currentIndex, enabled]);

  return {
    preloadedUrl: preloadedUrlRef.current,
    isPreloaded: !!preloadedAudioRef.current,
  };
}
