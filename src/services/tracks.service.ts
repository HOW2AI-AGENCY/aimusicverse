/**
 * Tracks Service
 * Business logic for track operations
 */

import * as tracksApi from '@/api/tracks.api';
import { logger } from '@/lib/logger';

export interface EnrichedTrack extends tracksApi.TrackRow {
  likes_count: number;
  is_liked: boolean;
}

export interface TracksWithMeta {
  tracks: EnrichedTrack[];
  totalCount: number;
  hasMore: boolean;
}

/**
 * Fetch tracks with enriched data (likes)
 */
export async function fetchTracksWithLikes(
  userId: string,
  filters: tracksApi.TrackFilters,
  pagination?: tracksApi.PaginationParams
): Promise<TracksWithMeta> {
  // Fetch base tracks
  const response = await tracksApi.fetchTracks(
    { ...filters, userId },
    pagination
  );

  if (response.error) {
    throw response.error;
  }

  const tracks = response.data;
  const totalCount = response.count || 0;

  if (tracks.length === 0) {
    return { tracks: [], totalCount, hasMore: false };
  }

  // Fetch likes in parallel
  const trackIds = tracks.map(t => t.id);
  const [likesCounts, userLikes] = await Promise.all([
    tracksApi.fetchTrackLikes(trackIds),
    tracksApi.fetchUserLikes(userId, trackIds),
  ]);

  // Enrich tracks with like data
  const enrichedTracks: EnrichedTrack[] = tracks.map(track => ({
    ...track,
    likes_count: likesCounts[track.id] ?? track.likes_count ?? 0,
    is_liked: userLikes.has(track.id),
  }));

  // Calculate hasMore for pagination
  const hasMore = pagination 
    ? (pagination.page + 1) * pagination.pageSize < totalCount
    : false;

  return { tracks: enrichedTracks, totalCount, hasMore };
}

/**
 * Fetch public tracks with creator info
 */
export async function fetchPublicTracksWithCreators(
  currentUserId: string | null,
  pagination?: tracksApi.PaginationParams
): Promise<TracksWithMeta> {
  const response = await tracksApi.fetchTracks(
    { isPublic: true, sortBy: 'recent' },
    pagination
  );

  if (response.error) {
    throw response.error;
  }

  const tracks = response.data;
  const totalCount = response.count || 0;

  if (tracks.length === 0) {
    return { tracks: [], totalCount, hasMore: false };
  }

  // Fetch likes
  const trackIds = tracks.map(t => t.id);
  const [likesCounts, userLikes] = await Promise.all([
    tracksApi.fetchTrackLikes(trackIds),
    currentUserId 
      ? tracksApi.fetchUserLikes(currentUserId, trackIds)
      : Promise.resolve(new Set<string>()),
  ]);

  const enrichedTracks: EnrichedTrack[] = tracks.map(track => ({
    ...track,
    likes_count: likesCounts[track.id] ?? track.likes_count ?? 0,
    is_liked: userLikes.has(track.id),
  }));

  const hasMore = pagination 
    ? (pagination.page + 1) * pagination.pageSize < totalCount
    : false;

  return { tracks: enrichedTracks, totalCount, hasMore };
}

/**
 * Toggle track like with optimistic update support
 */
export async function toggleLike(
  trackId: string,
  userId: string,
  isCurrentlyLiked: boolean
): Promise<{ isLiked: boolean }> {
  await tracksApi.toggleTrackLike(trackId, userId, isCurrentlyLiked);
  return { isLiked: !isCurrentlyLiked };
}

/**
 * Log track play
 */
export async function logTrackPlay(trackId: string): Promise<void> {
  try {
    await tracksApi.incrementPlayCount(trackId);
  } catch (error) {
    // Non-critical, just log
    logger.warn('Failed to log track play', { trackId, error });
  }
}

/**
 * Delete track with cleanup
 * Handles deletion of track and related data (versions, stems, storage files)
 */
export async function deleteTrackWithCleanup(trackId: string): Promise<void> {
  // Note: Database CASCADE constraints handle versions, stems, analytics deletion
  // Storage cleanup is handled by Supabase storage lifecycle policies
  await tracksApi.deleteTrack(trackId);
}

/**
 * Update track visibility
 */
export async function updateTrackVisibility(
  trackId: string,
  isPublic: boolean
): Promise<tracksApi.TrackRow> {
  return tracksApi.updateTrack(trackId, { is_public: isPublic });
}
