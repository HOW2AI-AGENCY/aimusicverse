/**
 * Public Content Hooks
 *
 * Unified hooks for fetching public tracks, projects, and artists for discovery features.
 * Includes filtering, sorting, pagination, and batch loading for homepage.
 *
 * @module hooks/public-content
 *
 * @example
 * ```tsx
 * // Batch loading for homepage (recommended)
 * import { usePublicContentBatch } from '@/hooks/public-content';
 *
 * const { data, isLoading } = usePublicContentBatch();
 *
 * // Simple queries
 * import { usePublicTracks, usePublicProjects } from '@/hooks/public-content';
 *
 * const { data: tracks } = usePublicTracks({ sortBy: 'popular' });
 *
 * // Genre playlists
 * import { getGenrePlaylists } from '@/hooks/public-content';
 *
 * const playlists = getGenrePlaylists(tracks);
 * ```
 */

// Export types
export * from './types';

// Export constants
export * from './constants';

// Export batch hook (primary for homepage)
export { usePublicContentBatch } from './usePublicContentBatch';

// Export genre playlist utility
export { getGenrePlaylists } from './useGenrePlaylists';

// Export basic query hooks
export {
  usePublicContent,
  usePublicTracks,
  usePublicProjects,
  usePublicArtists,
  useFeaturedContent,
  useSearchPublicContent,
} from './useBasicQueries';
