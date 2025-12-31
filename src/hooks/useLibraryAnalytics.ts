/**
 * useLibraryAnalytics - Analytics tracking for Library page
 * 
 * Tracks:
 * - Track listing views
 * - Search and filter usage
 * - Track interactions (play, like, delete)
 * - Scroll depth and pagination
 */

import { useCallback, useRef, useEffect } from 'react';
import { trackFeature, recordMetric } from '@/lib/telemetry';
import { logger } from '@/lib/logger';

interface LibrarySession {
  startTime: number;
  tracksViewed: number;
  searchCount: number;
  filterChanges: number;
  playCount: number;
  likeCount: number;
  deleteCount: number;
  pagesLoaded: number;
  maxScrollDepth: number;
}

interface UseLibraryAnalyticsOptions {
  userId?: string;
}

export function useLibraryAnalytics({ userId }: UseLibraryAnalyticsOptions = {}) {
  const sessionRef = useRef<LibrarySession>({
    startTime: Date.now(),
    tracksViewed: 0,
    searchCount: 0,
    filterChanges: 0,
    playCount: 0,
    likeCount: 0,
    deleteCount: 0,
    pagesLoaded: 1,
    maxScrollDepth: 0,
  });

  // Log session start
  useEffect(() => {
    trackFeature('library:session', 'start', { userId });
    logger.info('Library session started', { userId });

    return () => {
      logSessionEnd();
    };
  }, [userId]);

  const logSessionEnd = useCallback(() => {
    const session = sessionRef.current;
    const durationMs = Date.now() - session.startTime;

    trackFeature('library:session', 'complete', {
      durationMs,
      tracksViewed: session.tracksViewed,
      searchCount: session.searchCount,
      filterChanges: session.filterChanges,
      playCount: session.playCount,
      likeCount: session.likeCount,
      deleteCount: session.deleteCount,
      pagesLoaded: session.pagesLoaded,
      maxScrollDepth: session.maxScrollDepth,
    });

    recordMetric('library:session_duration', durationMs, 'ms');

    logger.info('Library session ended', {
      durationSec: Math.round(durationMs / 1000),
      stats: {
        plays: session.playCount,
        likes: session.likeCount,
        searches: session.searchCount,
        pages: session.pagesLoaded,
      },
    });
  }, []);

  // Track search
  const trackSearch = useCallback((query: string, resultsCount: number) => {
    sessionRef.current.searchCount++;
    trackFeature('library:search', 'complete', {
      queryLength: query.length,
      resultsCount,
    });
  }, []);

  // Track filter change
  const trackFilterChange = useCallback((filterType: string, value: string) => {
    sessionRef.current.filterChanges++;
    trackFeature('library:filter', 'complete', {
      filterType,
      value,
    });
  }, []);

  // Track sort change
  const trackSortChange = useCallback((sortBy: string) => {
    trackFeature('library:sort', 'complete', { sortBy });
  }, []);

  // Track view mode change
  const trackViewModeChange = useCallback((mode: 'grid' | 'list') => {
    trackFeature('library:view_mode', 'complete', { mode });
  }, []);

  // Track play action
  const trackPlayAction = useCallback((trackId: string, position: number) => {
    sessionRef.current.playCount++;
    sessionRef.current.tracksViewed++;
    trackFeature('library:play', 'complete', {
      trackId,
      position,
    });
  }, []);

  // Track like action
  const trackLikeAction = useCallback((trackId: string, isLiked: boolean) => {
    sessionRef.current.likeCount++;
    trackFeature('library:like', 'complete', {
      trackId,
      action: isLiked ? 'like' : 'unlike',
    });
  }, []);

  // Track delete action
  const trackDeleteAction = useCallback((trackId: string) => {
    sessionRef.current.deleteCount++;
    trackFeature('library:delete', 'complete', { trackId });
  }, []);

  // Track pagination
  const trackLoadMore = useCallback((page: number, loadTimeMs: number) => {
    sessionRef.current.pagesLoaded = page;
    recordMetric('library:page_load', loadTimeMs, 'ms', { page: String(page) });
    trackFeature('library:pagination', 'complete', { page });
  }, []);

  // Track scroll depth (as percentage)
  const trackScrollDepth = useCallback((depth: number) => {
    if (depth > sessionRef.current.maxScrollDepth) {
      sessionRef.current.maxScrollDepth = depth;
      // Only track at certain thresholds
      if (depth >= 25 && depth < 30 ||
          depth >= 50 && depth < 55 ||
          depth >= 75 && depth < 80 ||
          depth >= 100) {
        trackFeature('library:scroll_depth', 'complete', { depth: Math.round(depth) });
      }
    }
  }, []);

  // Track tracks loaded
  const trackTracksLoaded = useCallback((count: number, loadTimeMs: number) => {
    recordMetric('library:tracks_loaded', count, 'count');
    recordMetric('library:initial_load', loadTimeMs, 'ms');
  }, []);

  // Get current session stats
  const getSessionStats = useCallback(() => {
    const session = sessionRef.current;
    return {
      durationMs: Date.now() - session.startTime,
      tracksViewed: session.tracksViewed,
      searchCount: session.searchCount,
      filterChanges: session.filterChanges,
      playCount: session.playCount,
      likeCount: session.likeCount,
      deleteCount: session.deleteCount,
      pagesLoaded: session.pagesLoaded,
      maxScrollDepth: session.maxScrollDepth,
    };
  }, []);

  return {
    // Search & Filter
    trackSearch,
    trackFilterChange,
    trackSortChange,
    trackViewModeChange,

    // Track interactions
    trackPlayAction,
    trackLikeAction,
    trackDeleteAction,

    // Pagination & scroll
    trackLoadMore,
    trackScrollDepth,
    trackTracksLoaded,

    // Session
    getSessionStats,
    logSessionEnd,
  };
}
