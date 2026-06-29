/**
 * Prefetch Track Covers Hook
 *
 * Prefetches cover images for upcoming tracks in the queue
 * to ensure instant display when switching tracks.
 *
 * Uses Image prefetch for browser-level caching.
 */

import { useEffect, useRef } from "react";
import { Track } from "@/types/track";
import { logger } from "@/lib/logger";
import { getTrackCoverUrl } from "@/lib/imageOptimization";

interface PrefetchOptions {
  /** Number of tracks ahead to prefetch (default: 3) */
  count?: number;
  /** Whether prefetching is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Prefetches cover images for upcoming and previous tracks in queue
 *
 * @param queue - Array of tracks in playback queue
 * @param currentIndex - Index of currently playing track
 * @param options - Prefetch configuration options
 */
export function usePrefetchTrackCovers(queue: Track[], currentIndex: number, options: PrefetchOptions = {}) {
  const { count = 3, enabled = true } = options;
  const prefetchedRef = useRef<Set<string>>(new Set());
  const maxCacheSize = 30;

  useEffect(() => {
    if (!enabled || !queue.length) return;

    // Get next N tracks
    const nextTracks = queue.slice(currentIndex + 1, currentIndex + 1 + count);

    // Get previous track for back navigation
    const prevTrack = currentIndex > 0 ? queue[currentIndex - 1] : null;

    // Combine tracks to prefetch
    const tracksToPrefetch = prevTrack ? [prevTrack, ...nextTracks] : nextTracks;

    tracksToPrefetch.forEach((track) => {
      if (!track?.cover_url) return;
      const coverUrl = getTrackCoverUrl(track.cover_url, "medium");

      // Skip already prefetched
      if (prefetchedRef.current.has(coverUrl)) return;

      // Create Image object for prefetching
      const img = new Image();

      img.onload = async () => {
        try {
          await img.decode?.();
        } catch {
          // Image is still usable when decode is unavailable or rejects.
        }
        prefetchedRef.current.add(coverUrl);
        logger.debug("Cover prefetched", {
          trackId: track.id,
          url: coverUrl.substring(0, 50),
        });
      };

      img.onerror = () => {
        logger.warn("Cover prefetch failed", { trackId: track.id });
      };

      // Start prefetch
      img.src = coverUrl;
    });

    // Clear cache if too large to prevent memory bloat
    if (prefetchedRef.current.size > maxCacheSize) {
      const entries = Array.from(prefetchedRef.current);
      // Keep last half of entries
      prefetchedRef.current = new Set(entries.slice(-maxCacheSize / 2));
      logger.debug("Cover prefetch cache trimmed", {
        oldSize: entries.length,
        newSize: prefetchedRef.current.size,
      });
    }
  }, [queue, currentIndex, count, enabled]);

  return {
    prefetchedCount: prefetchedRef.current.size,
  };
}

export default usePrefetchTrackCovers;
