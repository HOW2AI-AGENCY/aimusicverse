/**
 * Tracks API Layer
 * Raw Supabase database operations for tracks
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type TrackRow = Database['public']['Tables']['tracks']['Row'];
export type TrackInsert = Database['public']['Tables']['tracks']['Insert'];
export type TrackUpdate = Database['public']['Tables']['tracks']['Update'];

export interface TrackFilters {
  userId?: string;
  projectId?: string;
  searchQuery?: string;
  sortBy?: 'recent' | 'popular' | 'liked';
  statusFilter?: string[];
  isPublic?: boolean;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface TracksResponse {
  data: TrackRow[];
  count: number | null;
  error: Error | null;
}

/**
 * Fetch tracks with filters and optional pagination
 */
export async function fetchTracks(
  filters: TrackFilters,
  pagination?: PaginationParams
): Promise<TracksResponse> {
  const { userId, projectId, searchQuery, sortBy = 'recent', statusFilter, isPublic } = filters;

  let query = supabase
    .from('tracks')
    .select('*', { count: 'exact' });

  // User filter
  if (userId) {
    query = query.eq('user_id', userId);
  }

  // Public filter
  if (isPublic !== undefined) {
    query = query.eq('is_public', isPublic);
  }

  // Status filter
  const statuses = statusFilter || ['completed', 'streaming_ready'];
  query = query.in('status', statuses);

  // Project filter
  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  // Search filter
  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,prompt.ilike.%${searchQuery}%,style.ilike.%${searchQuery}%`);
  }

  // Sorting
  switch (sortBy) {
    case 'popular':
      query = query.order('play_count', { ascending: false, nullsFirst: false });
      break;
    case 'liked':
      query = query.order('likes_count', { ascending: false, nullsFirst: false });
      break;
    case 'recent':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  // Pagination
  if (pagination) {
    const from = pagination.page * pagination.pageSize;
    const to = from + pagination.pageSize - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query;

  return {
    data: data || [],
    count,
    error: error ? new Error(error.message) : null,
  };
}

/**
 * Fetch single track by ID
 */
export async function fetchTrackById(trackId: string): Promise<TrackRow | null> {
  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .eq('id', trackId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Create a new track
 */
export async function createTrack(track: TrackInsert): Promise<TrackRow> {
  const { data, error } = await supabase
    .from('tracks')
    .insert(track)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Update track
 */
export async function updateTrack(trackId: string, updates: TrackUpdate): Promise<TrackRow> {
  const { data, error } = await supabase
    .from('tracks')
    .update(updates)
    .eq('id', trackId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Delete track
 */
export async function deleteTrack(trackId: string): Promise<void> {
  const { error } = await supabase
    .from('tracks')
    .delete()
    .eq('id', trackId);

  if (error) throw new Error(error.message);
}

/**
 * Fetch track likes for multiple tracks
 */
export async function fetchTrackLikes(trackIds: string[]): Promise<Record<string, number>> {
  if (trackIds.length === 0) return {};

  const { data, error } = await supabase
    .from('track_likes')
    .select('track_id')
    .in('track_id', trackIds);

  if (error) throw new Error(error.message);

  return (data || []).reduce((acc, like) => {
    acc[like.track_id] = (acc[like.track_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Fetch user's liked tracks
 */
export async function fetchUserLikes(userId: string, trackIds: string[]): Promise<Set<string>> {
  if (trackIds.length === 0) return new Set();

  const { data, error } = await supabase
    .from('track_likes')
    .select('track_id')
    .eq('user_id', userId)
    .in('track_id', trackIds);

  if (error) throw new Error(error.message);
  return new Set((data || []).map(l => l.track_id));
}

/**
 * Toggle track like
 */
export async function toggleTrackLike(
  trackId: string,
  userId: string,
  isCurrentlyLiked: boolean
): Promise<void> {
  if (isCurrentlyLiked) {
    const { error } = await supabase
      .from('track_likes')
      .delete()
      .eq('track_id', trackId)
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from('track_likes')
      .insert({ track_id: trackId, user_id: userId });
    if (error) throw new Error(error.message);
  }
}

/**
 * Increment play count via RPC
 */
export async function incrementPlayCount(trackId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_track_play_count', { 
    track_id_param: trackId 
  });
  if (error) throw new Error(error.message);
}
