/**
 * Tracks Service
 * Business logic for track operations
 */

import * as tracksApi from '@/api/tracks.api';
import { supabase } from '@/integrations/supabase/client';
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
 * Extract storage path from Supabase storage URL
 */
function extractStoragePath(url: string | null, bucket: string): string | null {
  if (!url) return null;
  
  // Match pattern: /storage/v1/object/public/{bucket}/{path}
  const regex = new RegExp(`/storage/v1/object/(?:public|sign)/${bucket}/(.+?)(?:\\?|$)`);
  const match = url.match(regex);
  if (match) return decodeURIComponent(match[1]);
  
  // Also check for direct bucket paths
  if (url.includes(`/${bucket}/`)) {
    const parts = url.split(`/${bucket}/`);
    if (parts[1]) {
      return decodeURIComponent(parts[1].split('?')[0]);
    }
  }
  
  return null;
}

/**
 * Delete files from storage bucket (non-throwing)
 */
async function deleteStorageFiles(bucket: string, paths: string[]): Promise<void> {
  const validPaths = paths.filter(Boolean);
  if (validPaths.length === 0) return;
  
  try {
    const { error } = await supabase.storage.from(bucket).remove(validPaths);
    if (error) {
      logger.warn('Failed to delete storage files', { bucket, paths: validPaths, error: error.message });
    } else {
      logger.info('Storage files deleted', { bucket, count: validPaths.length });
    }
  } catch (error) {
    logger.warn('Storage deletion error', { bucket, error });
  }
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
 * Delete track with full cleanup
 * Handles deletion of track and related storage files (versions, stems, covers)
 */
export async function deleteTrackWithCleanup(trackId: string): Promise<void> {
  logger.info('Starting track deletion with cleanup', { trackId });
  
  // 1. Fetch track data to get file URLs
  const track = await tracksApi.fetchTrackById(trackId);
  if (!track) {
    logger.warn('Track not found for deletion', { trackId });
    return;
  }
  
  // 2. Fetch related versions to get their file URLs
  const { data: versions } = await supabase
    .from('track_versions')
    .select('audio_url, cover_url')
    .eq('track_id', trackId);
  
  // 3. Collect all file paths for deletion (all files stored in project-assets bucket)
  const filePaths: string[] = [];
  
  // Main track files
  if (track.audio_url) {
    const path = extractStoragePath(track.audio_url, 'project-assets');
    if (path) filePaths.push(path);
  }
  if (track.cover_url) {
    const coverPath = extractStoragePath(track.cover_url, 'project-assets');
    if (coverPath) filePaths.push(coverPath);
  }
  
  // Version files
  if (versions) {
    for (const version of versions) {
      if (version.audio_url) {
        const path = extractStoragePath(version.audio_url, 'project-assets');
        if (path) filePaths.push(path);
      }
      if (version.cover_url) {
        const coverPath = extractStoragePath(version.cover_url, 'project-assets');
        if (coverPath) filePaths.push(coverPath);
      }
    }
  }
  
  // 4. Delete storage files (non-blocking, errors logged but not thrown)
  if (filePaths.length > 0) {
    await deleteStorageFiles('project-assets', filePaths);
  }
  
  // 5. Delete track from database (CASCADE handles related records)
  await tracksApi.deleteTrack(trackId);
  
  logger.info('Track deletion completed', { trackId, deletedFiles: filePaths.length });
}

/**
 * Update track visibility
 */
export async function updateTrackVisibility(
  trackId: string,
  isPublic: boolean
): Promise<tracksApi.TrackRow> {
  const result = await tracksApi.updateTrack(trackId, { is_public: isPublic });
  
  // Log visibility change for audit (fire-and-forget)
  supabase.functions.invoke('audit-log', {
    body: {
      action: 'log',
      entityType: 'track',
      entityId: trackId,
      actorType: 'user',
      actionType: isPublic ? 'published' : 'unpublished',
      actionCategory: 'publication',
    },
  }).catch(() => {});
  
  return result;
}
