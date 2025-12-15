/**
 * Playlists API Layer
 * Raw Supabase database operations for playlists
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type PlaylistRow = Database['public']['Tables']['playlists']['Row'];
export type PlaylistInsert = Database['public']['Tables']['playlists']['Insert'];
export type PlaylistUpdate = Database['public']['Tables']['playlists']['Update'];
export type PlaylistTrackRow = Database['public']['Tables']['playlist_tracks']['Row'];

export interface PlaylistWithTracks extends PlaylistRow {
  tracks?: PlaylistTrackRow[];
}

/**
 * Fetch all playlists for a user
 */
export async function fetchUserPlaylists(userId: string): Promise<PlaylistRow[]> {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Fetch single playlist by ID
 */
export async function fetchPlaylistById(playlistId: string): Promise<PlaylistRow | null> {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('id', playlistId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Create a new playlist
 */
export async function createPlaylist(playlist: PlaylistInsert): Promise<PlaylistRow> {
  const { data, error } = await supabase
    .from('playlists')
    .insert(playlist)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Update playlist
 */
export async function updatePlaylist(playlistId: string, updates: PlaylistUpdate): Promise<PlaylistRow> {
  const { data, error } = await supabase
    .from('playlists')
    .update(updates)
    .eq('id', playlistId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Delete playlist
 */
export async function deletePlaylist(playlistId: string): Promise<void> {
  const { error } = await supabase
    .from('playlists')
    .delete()
    .eq('id', playlistId);

  if (error) throw new Error(error.message);
}

/**
 * Fetch playlist tracks (positions only)
 */
export async function fetchPlaylistTracks(playlistId: string): Promise<PlaylistTrackRow[]> {
  const { data, error } = await supabase
    .from('playlist_tracks')
    .select('*')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Fetch playlist tracks with full track details
 */
export async function fetchPlaylistTracksWithDetails(playlistId: string): Promise<(PlaylistTrackRow & { track: unknown })[]> {
  const { data, error } = await supabase
    .from('playlist_tracks')
    .select('*, track:tracks(*)')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Get max position in playlist
 */
export async function getMaxPosition(playlistId: string): Promise<number> {
  const { data } = await supabase
    .from('playlist_tracks')
    .select('position')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: false })
    .limit(1);

  return data?.[0]?.position ?? -1;
}

/**
 * Add track to playlist
 */
export async function addTrackToPlaylist(
  playlistId: string,
  trackId: string,
  position: number
): Promise<PlaylistTrackRow> {
  const { data, error } = await supabase
    .from('playlist_tracks')
    .insert({
      playlist_id: playlistId,
      track_id: trackId,
      position,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Трек уже в плейлисте');
    }
    throw new Error(error.message);
  }
  return data;
}

/**
 * Remove track from playlist
 */
export async function removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
  const { error } = await supabase
    .from('playlist_tracks')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('track_id', trackId);

  if (error) throw new Error(error.message);
}

/**
 * Update track position in playlist
 */
export async function updateTrackPosition(
  playlistId: string,
  trackId: string,
  position: number
): Promise<void> {
  const { error } = await supabase
    .from('playlist_tracks')
    .update({ position })
    .eq('playlist_id', playlistId)
    .eq('track_id', trackId);

  if (error) throw new Error(error.message);
}

/**
 * Reorder all tracks in playlist
 */
export async function reorderPlaylistTracks(
  playlistId: string,
  trackIds: string[]
): Promise<void> {
  const updates = trackIds.map((trackId, index) =>
    supabase
      .from('playlist_tracks')
      .update({ position: index })
      .eq('playlist_id', playlistId)
      .eq('track_id', trackId)
  );

  await Promise.all(updates);
}
