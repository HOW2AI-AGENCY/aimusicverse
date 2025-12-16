/**
 * React Query optimization utilities
 * Sprint 025 - Performance Optimization
 */

import { QueryClient, type QueryKey } from '@tanstack/react-query';

// ============================================
// Optimized stale times for different data types
// ============================================

export const STALE_TIMES = {
  // User-specific data - refresh on demand
  USER_DATA: 5 * 60 * 1000, // 5 minutes
  
  // Tracks and library - cache longer
  TRACKS: 30 * 1000, // 30 seconds (has realtime updates)
  
  // Public content - cache longer
  PUBLIC_CONTENT: 2 * 60 * 1000, // 2 minutes
  
  // Static data - very long cache
  STATIC: 30 * 60 * 1000, // 30 minutes
  
  // Real-time data - short cache
  REALTIME: 10 * 1000, // 10 seconds
  
  // Admin/analytics - medium cache
  ANALYTICS: 60 * 1000, // 1 minute
} as const;

export const GC_TIMES = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 10 * 60 * 1000, // 10 minutes
  LONG: 30 * 60 * 1000, // 30 minutes
} as const;

// ============================================
// Query key factories for consistent naming
// ============================================

export const queryKeys = {
  // User
  user: (userId: string | undefined) => ['user', userId] as const,
  profile: (userId: string | undefined) => ['profile', userId] as const,
  credits: (userId: string | undefined) => ['credits', userId] as const,
  
  // Tracks
  tracks: (userId: string | undefined, filters?: Record<string, any>) => 
    filters ? ['tracks', userId, filters] as const : ['tracks', userId] as const,
  track: (trackId: string) => ['track', trackId] as const,
  trackVersions: (trackId: string) => ['track-versions', trackId] as const,
  trackStems: (trackId: string) => ['track-stems', trackId] as const,
  trackCounts: (trackIds: string[]) => ['track-counts', trackIds] as const,
  
  // Public content
  publicTracks: (userId?: string | null) => ['public-tracks', userId] as const,
  publicArtists: () => ['public-artists'] as const,
  publicContent: (userId?: string | null) => ['public-content', userId] as const,
  
  // Projects
  projects: (userId: string | undefined) => ['projects', userId] as const,
  project: (projectId: string) => ['project', projectId] as const,
  projectTracks: (projectId: string) => ['project-tracks', projectId] as const,
  
  // Artists
  artists: (userId: string | undefined) => ['artists', userId] as const,
  artist: (artistId: string) => ['artist', artistId] as const,
  
  // Playlists
  playlists: (userId: string | undefined) => ['playlists', userId] as const,
  playlist: (playlistId: string) => ['playlist', playlistId] as const,
  
  // Generation
  generationTasks: (userId: string | undefined) => ['generation-tasks', userId] as const,
  activeGenerations: (userId: string | undefined) => ['active-generations', userId] as const,
  
  // Admin
  adminUsers: () => ['admin-users'] as const,
  adminTracks: () => ['admin-tracks'] as const,
  adminAnalytics: (period: string) => ['admin-analytics', period] as const,
  generationAnalytics: (period: string) => ['generation-analytics', period] as const,
} as const;

// ============================================
// Selective invalidation utilities
// ============================================

/**
 * Invalidate only user-specific track queries
 */
export function invalidateUserTracks(queryClient: QueryClient, userId: string) {
  queryClient.invalidateQueries({ 
    queryKey: ['tracks', userId],
    exact: false 
  });
}

/**
 * Invalidate track details and related queries
 */
export function invalidateTrack(queryClient: QueryClient, trackId: string) {
  queryClient.invalidateQueries({ queryKey: ['track', trackId] });
  queryClient.invalidateQueries({ queryKey: ['track-versions', trackId] });
  queryClient.invalidateQueries({ queryKey: ['track-stems', trackId] });
}

/**
 * Invalidate all public content queries
 */
export function invalidatePublicContent(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['public-tracks'] });
  queryClient.invalidateQueries({ queryKey: ['public-artists'] });
  queryClient.invalidateQueries({ queryKey: ['public-content'] });
}

/**
 * Prefetch data for expected navigation
 */
export async function prefetchTrack(
  queryClient: QueryClient, 
  trackId: string,
  fetchFn: () => Promise<any>
) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.track(trackId),
    queryFn: fetchFn,
    staleTime: STALE_TIMES.TRACKS,
  });
}

// ============================================
// Optimistic update helpers
// ============================================

/**
 * Helper for optimistic like toggle
 */
export function createOptimisticLikeUpdate(
  queryClient: QueryClient,
  trackId: string,
  isCurrentlyLiked: boolean
) {
  // Snapshot current data
  const previousData = queryClient.getQueryData(['tracks']);
  
  // Optimistically update
  queryClient.setQueriesData({ queryKey: ['tracks'] }, (old: any) => {
    if (!old) return old;
    
    // Handle paginated data
    if (old.pages) {
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          tracks: page.tracks.map((track: any) =>
            track.id === trackId
              ? { ...track, is_liked: !isCurrentlyLiked }
              : track
          ),
        })),
      };
    }
    
    // Handle flat array
    if (Array.isArray(old)) {
      return old.map((track: any) =>
        track.id === trackId
          ? { ...track, is_liked: !isCurrentlyLiked }
          : track
      );
    }
    
    return old;
  });
  
  return { previousData };
}

/**
 * Rollback helper for failed mutations
 */
export function rollbackOptimisticUpdate(
  queryClient: QueryClient,
  queryKey: QueryKey,
  previousData: any
) {
  queryClient.setQueryData(queryKey, previousData);
}
