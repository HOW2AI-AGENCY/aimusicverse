/**
 * Optimized Audio Player Hook
 * 
 * Enhanced audio player with:
 * - Audio caching via IndexedDB + memory cache
 * - Intelligent prefetch with priority queue
 * - Network-aware quality selection
 * - Gapless playback support
 * - Smooth crossfade between tracks
 * - Progressive loading for fast start
 */

import { useEffect, useCallback, useRef } from 'react';
import { usePlayerStore } from './usePlayerState';
import { getGlobalAudioRef } from './useAudioTime';
import { getCachedAudio, cacheAudio, shouldPrefetch } from '@/lib/audioCache';
import { getPrefetchManager, prefetchNextTracks as prefetchTracks } from '@/lib/audio/prefetchManager';
import { preconnectToHost } from '@/lib/audio/streamingLoader';
import { logger } from '@/lib/logger';
import { useNetworkStatus } from './useNetworkStatus';
import { checkAudioHealth, attemptAudioRecovery } from '@/lib/audioHealthCheck';

const log = logger.child({ module: 'OptimizedAudioPlayer' });

interface UseOptimizedAudioPlayerOptions {
  enablePrefetch?: boolean;
  enableCache?: boolean;
  crossfadeDuration?: number; // in seconds
  prefetchCount?: number; // Number of tracks to prefetch
}

export function useOptimizedAudioPlayer(options: UseOptimizedAudioPlayerOptions = {}) {
  const {
    enablePrefetch = true,
    enableCache = true,
    crossfadeDuration = 0.3,
    prefetchCount = 3,
  } = options;

  const {
    activeTrack,
    queue,
    currentIndex,
    isPlaying,
  } = usePlayerStore();

  const prefetchedRef = useRef<Set<string>>(new Set());
  const currentBlobUrlRef = useRef<string | null>(null);
  const isCrossfadingRef = useRef(false);
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPrefetchIndexRef = useRef<number>(-1);
  
  // Network status monitoring
  const { isOnline, isSuitableForStreaming, shouldPrefetch: networkAllowsPrefetch } = useNetworkStatus();

  /**
   * Get audio source from track with caching and preconnect
   */
  const getAudioSource = useCallback(async (track: typeof activeTrack) => {
    if (!track) return null;
    
    const sourceUrl = track.streaming_url || track.local_audio_url || track.audio_url;
    if (!sourceUrl) return null;

    // Preconnect to host for faster loading
    preconnectToHost(sourceUrl);

    // Try to get from cache if enabled
    if (enableCache) {
      try {
        const cachedBlob = await getCachedAudio(sourceUrl);
        if (cachedBlob) {
          log.debug('Using cached audio', { trackId: track.id, size: cachedBlob.size });
          
          // Revoke old blob URL if exists
          if (currentBlobUrlRef.current) {
            URL.revokeObjectURL(currentBlobUrlRef.current);
          }
          
          // Create new blob URL
          const blobUrl = URL.createObjectURL(cachedBlob);
          currentBlobUrlRef.current = blobUrl;
          return blobUrl;
        }
      } catch (error) {
        log.warn('Cache read failed, falling back to direct URL', { error });
      }
    }

    return sourceUrl;
  }, [enableCache]);

  /**
   * Cache current audio in background with priority
   */
  const cacheCurrentAudio = useCallback(async (url: string, priority: number = 0) => {
    if (!enableCache) return;
    
    // Skip blob URLs - already in memory
    if (url.startsWith('blob:')) return;
    
    try {
      const response = await fetch(url);
      if (!response.ok) return;
      
      const blob = await response.blob();
      await cacheAudio(url, blob, priority);
      log.debug('Audio cached successfully', { url: url.substring(0, 50), size: blob.size });
    } catch (error) {
      log.warn('Failed to cache audio', { error });
    }
  }, [enableCache]);

  /**
   * Prefetch next tracks using intelligent prefetch manager
   */
  const prefetchNextTracks = useCallback(async () => {
    // Check both local and network prefetch settings
    if (!enablePrefetch || !shouldPrefetch() || !networkAllowsPrefetch) {
      log.debug('Prefetch disabled', { 
        enabled: enablePrefetch,
        shouldPrefetch: shouldPrefetch(),
        networkAllows: networkAllowsPrefetch,
      });
      return;
    }

    if (!isOnline) {
      log.debug('Cannot prefetch: offline');
      return;
    }

    if (!queue || queue.length === 0) return;
    
    // Avoid duplicate prefetch for same position
    if (lastPrefetchIndexRef.current === currentIndex) return;
    lastPrefetchIndexRef.current = currentIndex;

    // Get next tracks to prefetch
    const nextTracks = queue.slice(
      currentIndex + 1,
      Math.min(currentIndex + 1 + prefetchCount, queue.length)
    );

    if (nextTracks.length > 0) {
      // Use prefetch manager for intelligent queuing
      prefetchTracks(nextTracks, prefetchCount);
      log.debug('Queued tracks for prefetch', { count: nextTracks.length });
    }
  }, [enablePrefetch, queue, currentIndex, networkAllowsPrefetch, isOnline, prefetchCount]);

  /**
   * Apply crossfade effect when transitioning between tracks
   */
  const applyCrossfade = useCallback((audio: HTMLAudioElement, fadeOut: boolean): Promise<void> => {
    return new Promise((resolve) => {
      if (crossfadeDuration <= 0 || isCrossfadingRef.current) {
        resolve();
        return;
      }

      isCrossfadingRef.current = true;
      const startVolume = audio.volume;
      const targetVolume = fadeOut ? 0 : startVolume;
      const steps = 20;
      const stepDuration = (crossfadeDuration * 1000) / steps;
      const volumeStep = (startVolume - targetVolume) / steps;

      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        
        if (fadeOut) {
          audio.volume = Math.max(0, startVolume - (volumeStep * currentStep));
        } else {
          audio.volume = Math.min(startVolume, volumeStep * currentStep);
        }

        if (currentStep >= steps) {
          clearInterval(interval);
          audio.volume = targetVolume;
          isCrossfadingRef.current = false;
          resolve();
        }
      }, stepDuration);
    });
  }, [crossfadeDuration]);

  /**
   * Load track with caching, prefetch, and optimized loading
   */
  const loadTrack = useCallback(async (track: typeof activeTrack) => {
    const audio = getGlobalAudioRef();
    if (!audio || !track) return;

    log.debug('Loading track', { trackId: track.id, title: track.title });

    try {
      // Get audio source (from cache or direct)
      const source = await getAudioSource(track);
      if (!source) {
        log.warn('No audio source available', { trackId: track.id });
        return;
      }

      // Apply fade out before changing track (short fade for responsiveness)
      if (isPlaying && crossfadeDuration > 0 && !audio.paused) {
        await applyCrossfade(audio, true);
      }

      // Load new track
      audio.pause();
      audio.src = source;
      
      // Use 'auto' preload for cached content, 'metadata' for network
      audio.preload = source.startsWith('blob:') ? 'auto' : 'metadata';
      audio.load();

      // Cache the audio if it's a direct URL (not already a blob URL)
      if (!source.startsWith('blob:')) {
        // Cache with highest priority (currently playing)
        cacheCurrentAudio(source, 0);
      }

      // Prefetch next tracks
      prefetchNextTracks();

      // Apply fade in after loading
      if (isPlaying) {
        const handleCanPlay = () => {
          audio.play().catch(e => log.warn('Play after load failed', e));
          if (crossfadeDuration > 0) {
            applyCrossfade(audio, false);
          }
        };
        audio.addEventListener('canplay', handleCanPlay, { once: true });
      }
    } catch (error) {
      log.error('Failed to load track', error, { trackId: track?.id });
    }
  }, [getAudioSource, cacheCurrentAudio, prefetchNextTracks, applyCrossfade, isPlaying, crossfadeDuration]);

  /**
   * Effect: Load track when active track changes
   */
  useEffect(() => {
    if (activeTrack) {
      loadTrack(activeTrack);
    }

    // Cleanup blob URLs on unmount
    return () => {
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
        currentBlobUrlRef.current = null;
      }
    };
  }, [activeTrack?.id]); // Only re-run when track ID changes

  /**
   * Effect: Periodic health check and auto-recovery (reduced frequency)
   */
  useEffect(() => {
    const audio = getGlobalAudioRef();
    if (!audio) return;

    // Run health check every 45 seconds when playing (reduced from 30s)
    if (isPlaying) {
      healthCheckIntervalRef.current = setInterval(async () => {
        const report = checkAudioHealth(audio);
        
        if (!report.isHealthy) {
          log.warn('Audio health check failed, attempting recovery', {
            issues: report.issues.length,
            warnings: report.warnings.length,
          });
          
          const recovered = await attemptAudioRecovery(audio, report);
          
          if (recovered) {
            log.info('Audio recovery successful');
          } else {
            log.error('Audio recovery failed', null, {
              recommendations: report.recommendations,
            });
          }
        }
      }, 45000);
    }

    return () => {
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
        healthCheckIntervalRef.current = null;
      }
    };
  }, [isPlaying]);

  /**
   * Effect: Prefetch on queue or index change (with debounce)
   */
  useEffect(() => {
    if (queue.length > 0 && enablePrefetch) {
      // Delay prefetch to avoid blocking main thread during track changes
      const timer = setTimeout(prefetchNextTracks, 500);
      return () => clearTimeout(timer);
    }
  }, [queue.length, currentIndex, enablePrefetch, prefetchNextTracks]);

  /**
   * Effect: Cleanup prefetch manager on unmount
   */
  useEffect(() => {
    return () => {
      // Clear prefetched refs
      prefetchedRef.current.clear();
      lastPrefetchIndexRef.current = -1;
    };
  }, []);

  return {
    loadTrack,
    prefetchNextTracks,
    getPrefetchStatus: () => getPrefetchManager().getStatus(),
  };
}
