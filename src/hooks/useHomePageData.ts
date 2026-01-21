/**
 * useHomePageData - Unified data hook for home page
 * 
 * Consolidates all data fetching and processing logic for the Index page:
 * - Public content batch (featured, recent, popular)
 * - Infinite scroll for tracks
 * - Image preloading
 * 
 * @module hooks/useHomePageData
 */

import { useEffect, useMemo, useCallback } from "react";
import { usePublicContentBatch } from "@/hooks/usePublicContent";
import { useInfinitePublicTracks, flattenInfiniteTracksPages } from "@/hooks/useInfinitePublicTracks";
import { preloadImages } from "@/lib/imageOptimization";

interface UseHomePageDataOptions {
  /** Number of covers to preload */
  preloadCount?: number;
  /** Page size for infinite scroll */
  pageSize?: number;
}

export function useHomePageData(options: UseHomePageDataOptions = {}) {
  const { preloadCount = 4, pageSize = 20 } = options;

  // Single optimized query for all public content (genres, featured, etc.)
  const { 
    data: publicContent, 
    isLoading: contentLoading, 
    refetch: refetchContent 
  } = usePublicContentBatch();

  // Infinite scroll for "New Tracks" section
  const {
    data: infiniteRecentData,
    fetchNextPage: fetchMoreRecent,
    hasNextPage: hasMoreRecent,
    isFetchingNextPage: isLoadingMoreRecent,
  } = useInfinitePublicTracks({
    sortBy: 'recent',
    pageSize,
    enabled: !contentLoading,
  });

  // Infinite scroll for "Popular Tracks" section
  const {
    data: infinitePopularData,
    fetchNextPage: fetchMorePopular,
    hasNextPage: hasMorePopular,
    isFetchingNextPage: isLoadingMorePopular,
  } = useInfinitePublicTracks({
    sortBy: 'popular',
    pageSize,
    enabled: !contentLoading,
  });

  // Flatten infinite pages into single arrays, with batch data as fallback
  const recentTracks = useMemo(() => {
    const infiniteTracks = flattenInfiniteTracksPages(infiniteRecentData?.pages);
    return infiniteTracks.length > 0 ? infiniteTracks : (publicContent?.recentTracks || []);
  }, [infiniteRecentData?.pages, publicContent?.recentTracks]);

  const popularTracks = useMemo(() => {
    const infiniteTracks = flattenInfiniteTracksPages(infinitePopularData?.pages);
    return infiniteTracks.length > 0 ? infiniteTracks : (publicContent?.popularTracks || []);
  }, [infinitePopularData?.pages, publicContent?.popularTracks]);

  // Show skeleton only on initial batch load
  const isLoading = contentLoading && !publicContent;

  // Preload first N track cover images
  useEffect(() => {
    if (publicContent?.popularTracks?.length && preloadCount > 0) {
      const firstCovers = publicContent.popularTracks
        .slice(0, preloadCount)
        .map(t => t.cover_url)
        .filter(Boolean) as string[];

      if (firstCovers.length) {
        preloadImages(firstCovers, true).catch(() => {});
      }
    }
  }, [publicContent?.popularTracks, preloadCount]);

  // Refresh handler
  const refresh = useCallback(async () => {
    await refetchContent();
  }, [refetchContent]);

  return {
    // Data
    publicContent,
    recentTracks,
    popularTracks,
    
    // Loading states
    isLoading,
    
    // Recent tracks infinite scroll
    hasMoreRecent,
    isLoadingMoreRecent,
    fetchMoreRecent,
    
    // Popular tracks infinite scroll
    hasMorePopular,
    isLoadingMorePopular,
    fetchMorePopular,
    
    // Actions
    refresh,
  };
}
