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
 *
 * NOTE: audio.src is now owned exclusively by useAudioTrackLoader
 * (GlobalAudioProvider). This hook only handles cache + prefetch.
 * Dead stubs are kept at their original hook positions so React
 * Refresh never hits "Should have a queue" across hot reloads.
 */

import { useEffect, useCallback, useRef } from "react";
import { usePlayerStore } from "./usePlayerState";
import { getGlobalAudioRef } from "./useAudioTime";
import { cacheAudio, shouldPrefetch } from "@/lib/audioCache";
import { getPrefetchManager, prefetchNextTracks as prefetchTracks } from "@/lib/audio/prefetchManager";
import { logger } from "@/lib/logger";
import { useNetworkStatus } from "./useNetworkStatus";
import { checkAudioHealth, attemptAudioRecovery } from "@/lib/audioHealthCheck";

const log = logger.child({ module: "OptimizedAudioPlayer" });

interface UseOptimizedAudioPlayerOptions {
  enablePrefetch?: boolean;
  enableCache?: boolean;
  crossfadeDuration?: number; // in seconds
  prefetchCount?: number; // Number of tracks to prefetch
}

export function useOptimizedAudioPlayer(options: UseOptimizedAudioPlayerOptions = {}) {
  const { enablePrefetch = true, enableCache = true, crossfadeDuration = 0.3, prefetchCount = 3 } = options;

  const { activeTrack, queue, currentIndex, isPlaying } = usePlayerStore();

  const prefetchedRef = useRef<Set<string>>(new Set());
  const _deadBlobUrlRef = useRef<string | null>(null);
  const _deadCrossfadingRef = useRef(false);
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPrefetchIndexRef = useRef<number>(-1);

  // Network status monitoring
  const { isOnline, isSuitableForStreaming, shouldPrefetch: networkAllowsPrefetch } = useNetworkStatus();

  // --- Dead stubs kept at original hook positions for HMR stability ---
  /** @deprecated audio.src is owned by useAudioTrackLoader */
  const _deadGetAudioSource = useCallback(async (_track: typeof activeTrack) => null, []);

  /**
   * Cache current audio in background with priority
   */
  const cacheCurrentAudio = useCallback(
    async (url: string, priority: number = 0) => {
      if (!enableCache) return;

      // Skip blob URLs - already in memory
      if (url.startsWith("blob:")) return;

      try {
        const response = await fetch(url);
        if (!response.ok) return;

        const blob = await response.blob();
        await cacheAudio(url, blob, priority);
        log.debug("Audio cached successfully", { url: url.substring(0, 50), size: blob.size });
      } catch (error) {
        log.warn("Failed to cache audio", { error });
      }
    },
    [enableCache],
  );

  /**
   * Prefetch next tracks using intelligent prefetch manager
   */
  const prefetchNextTracks = useCallback(async () => {
    // Check both local and network prefetch settings
    if (!enablePrefetch || !shouldPrefetch() || !networkAllowsPrefetch) {
      log.debug("Prefetch disabled", {
        enabled: enablePrefetch,
        shouldPrefetch: shouldPrefetch(),
        networkAllows: networkAllowsPrefetch,
      });
      return;
    }

    if (!isOnline) {
      log.debug("Cannot prefetch: offline");
      return;
    }

    if (!queue || queue.length === 0) return;

    // Avoid duplicate prefetch for same position
    if (lastPrefetchIndexRef.current === currentIndex) return;
    lastPrefetchIndexRef.current = currentIndex;

    // Get next tracks to prefetch
    const nextTracks = queue.slice(currentIndex + 1, Math.min(currentIndex + 1 + prefetchCount, queue.length));

    if (nextTracks.length > 0) {
      // Use prefetch manager for intelligent queuing
      prefetchTracks(nextTracks, prefetchCount);
      log.debug("Queued tracks for prefetch", { count: nextTracks.length });
    }
  }, [enablePrefetch, queue, currentIndex, networkAllowsPrefetch, isOnline, prefetchCount]);

  /** @deprecated crossfade was only used by old loadTrack */
  const _deadApplyCrossfade = useCallback(async (_audio: HTMLAudioElement, _out: boolean) => {}, []);

  /**
   * Load track — cache + prefetch side-effects only. Does NOT set audio.src
   * (useAudioTrackLoader owns that).
   */
  const loadTrack = useCallback(
    async (track: typeof activeTrack) => {
      const audio = getGlobalAudioRef();
      if (!audio || !track) return;

      log.debug("Optimized audio side-effects for track", { trackId: track.id, title: track.title });

      try {
        const sourceUrl = track.streaming_url || track.local_audio_url || track.audio_url;
        if (sourceUrl && !sourceUrl.startsWith("blob:")) {
          cacheCurrentAudio(sourceUrl, 0);
        }

        prefetchNextTracks();
      } catch (error) {
        log.error("Optimized audio side-effects failed", error, { trackId: track?.id });
      }
    },
    [cacheCurrentAudio, prefetchNextTracks],
  );

  /**
   * Effect: Run cache + prefetch side-effects when active track changes.
   * Does NOT set audio.src — see useAudioTrackLoader for that.
   */
  useEffect(() => {
    if (activeTrack) {
      loadTrack(activeTrack);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrack?.id, loadTrack]);

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
          log.warn("Audio health check failed, attempting recovery", {
            issues: report.issues.length,
            warnings: report.warnings.length,
          });

          const recovered = await attemptAudioRecovery(audio, report);

          if (recovered) {
            log.info("Audio recovery successful");
          } else {
            log.error("Audio recovery failed", null, {
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
    const set = prefetchedRef.current;
    return () => {
      // Clear prefetched refs
      set.clear();
      lastPrefetchIndexRef.current = -1;
    };
  }, []);

  return {
    loadTrack,
    prefetchNextTracks,
    getPrefetchStatus: () => getPrefetchManager().getStatus(),
  };
}
