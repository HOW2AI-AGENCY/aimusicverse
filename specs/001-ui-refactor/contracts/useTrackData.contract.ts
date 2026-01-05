/**
 * Contract: useTrackData Hook
 *
 * Data fetching hook for tracks with TanStack Query caching.
 * Extracts business logic from UI components.
 */

import type { Track, PublicTrackWithCreator } from '@/types/track';

/**
 * Input parameters for useTrackData hook.
 */
export interface UseTrackDataParams {
  /**
   * User ID to filter tracks by.
   * If undefined, fetches all public tracks or tracks based on isPublic flag.
   */
  userId?: string;

  /**
   * Whether to fetch only public tracks.
   * @default false
   */
  isPublic?: boolean;

  /**
   * Maximum number of tracks to fetch.
   * @default 20
   */
  limit?: number;

  /**
   * Number of tracks to skip (for pagination).
   * @default 0
   */
  offset?: number;

  /**
   * Filter by genre tags.
   */
  genres?: string[];

  /**
   * Filter by mood tags.
   */
  moods?: string[];

  /**
   * Search query string.
   */
  searchQuery?: string;
}

/**
 * Return value from useTrackData hook.
 */
export interface UseTrackDataReturn {
  /**
   * Array of tracks fetched from the database.
   */
  tracks: Array<Track | PublicTrackWithCreator>;

  /**
   * Loading state for the initial fetch.
   */
  isLoading: boolean;

  /**
   * Loading state for background refetches.
   */
  isFetching: boolean;

  /**
   * Error object if the query failed.
   */
  error: Error | null;

  /**
   * Function to manually refetch the data.
   */
  refetch: () => void;

  /**
   * Whether there is a next page available (for infinite scroll).
   */
  hasNextPage: boolean;

  /**
   * Function to fetch the next page of tracks.
   */
  fetchNextPage: () => void;

  /**
   * Whether currently fetching the next page.
   */
  isFetchingNextPage: boolean;

  /**
   * Total count of tracks matching the query.
   */
  totalCount: number | undefined;
}

/**
 * Hook contract for useTrackData.
 *
 * @example
 * ```typescript
 * const { tracks, isLoading, error, fetchNextPage } = useTrackData({
 *   userId: 'user123',
 *   limit: 20,
 * });
 * ```
 */
export interface UseTrackDataContract {
  /**
   * Hook function signature.
   */
  (params: UseTrackDataParams): UseTrackDataReturn;

  /**
   * TanStack Query cache key for this hook.
   * Format: ['tracks', userId, isPublic, limit, offset, genres, moods, searchQuery]
   */
  queryKey: readonly unknown[];

  /**
   * Stale time for cached data (30 seconds).
   */
  staleTime: number;

  /**
   * Garbage collection time for unused cache entries (10 minutes).
   */
  gcTime: number;
}
