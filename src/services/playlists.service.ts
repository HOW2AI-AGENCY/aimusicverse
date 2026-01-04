/**
 * Playlists Service
 * Business logic for playlist operations
 */

import * as playlistsApi from '@/api/playlists.api';

export type { PlaylistRow, PlaylistTrackRow } from '@/api/playlists.api';

/**
 * Create a new playlist with default settings
 */
export async function createPlaylist(
  userId: string,
  title: string,
  description?: string,
  isPublic: boolean = false
): Promise<playlistsApi.PlaylistRow> {
  return playlistsApi.createPlaylist({
    user_id: userId,
    title,
    description: description || null,
    is_public: isPublic,
  });
}

/**
 * Add track to playlist at the end
 */
export async function addTrackToPlaylist(
  playlistId: string,
  trackId: string
): Promise<playlistsApi.PlaylistTrackRow> {
  const maxPosition = await playlistsApi.getMaxPosition(playlistId);
  return playlistsApi.addTrackToPlaylist(playlistId, trackId, maxPosition + 1);
}

/**
 * Move track within playlist
 */
export async function moveTrack(
  playlistId: string,
  trackId: string,
  fromIndex: number,
  toIndex: number
): Promise<void> {
  // Get all tracks
  const tracks = await playlistsApi.fetchPlaylistTracks(playlistId);
  const trackIds = tracks.map(t => t.track_id);
  
  // Reorder array
  const [removed] = trackIds.splice(fromIndex, 1);
  trackIds.splice(toIndex, 0, removed);
  
  // Update positions
  await playlistsApi.reorderPlaylistTracks(playlistId, trackIds);
}

/**
 * Duplicate playlist
 */
export async function duplicatePlaylist(
  userId: string,
  sourcePlaylistId: string,
  newTitle: string
): Promise<playlistsApi.PlaylistRow> {
  // Get source playlist
  const source = await playlistsApi.fetchPlaylistById(sourcePlaylistId);
  if (!source) throw new Error('Плейлист не найден');
  
  // Create new playlist
  const newPlaylist = await playlistsApi.createPlaylist({
    user_id: userId,
    title: newTitle,
    description: source.description,
    is_public: false,
  });
  
  // Copy tracks
  const sourceTracks = await playlistsApi.fetchPlaylistTracks(sourcePlaylistId);
  for (const track of sourceTracks) {
    await playlistsApi.addTrackToPlaylist(newPlaylist.id, track.track_id, track.position);
  }
  
  return newPlaylist;
}
