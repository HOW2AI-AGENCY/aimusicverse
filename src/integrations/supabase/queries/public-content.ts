/**
 * Public Content Query Functions
 * 
 * Supabase queries for fetching public tracks, projects, and artists
 * Used by usePublicContent hook
 */

import { supabase } from '../client';
import type { Database } from '../types';

type PublicTrack = Database['public']['Tables']['tracks']['Row'];
type PublicProject = Database['public']['Tables']['music_projects']['Row'];
type PublicArtist = Database['public']['Tables']['artists']['Row'];

interface QueryFilters {
  genre?: string;
  mood?: string;
  sortBy?: 'recent' | 'popular' | 'trending';
  limit?: number;
  offset?: number;
}

/**
 * Fetch public tracks with filters
 */
export async function fetchPublicTracks(filters: QueryFilters = {}) {
  const { sortBy = 'recent', limit = 20, offset = 0 } = filters;

  let query = supabase
    .from('tracks')
    .select('*')
    .eq('is_public', true)
    .eq('status', 'completed')
    .not('audio_url', 'is', null);

  // Apply filters
  if (filters.genre) {
    query = query.contains('metadata', { style: filters.genre });
  }

  if (filters.mood) {
    query = query.contains('metadata', { mood: filters.mood });
  }

  // Apply sorting using computed scores from database
  switch (sortBy) {
    case 'recent':
      query = query.order('created_at', { ascending: false });
      break;
    case 'popular':
      // Order by quality_score (likes * 1.5 + plays * 0.05)
      query = query.order('quality_score', { ascending: false, nullsFirst: false });
      break;
    case 'trending':
      // Order by trending_score (likes * 2 + plays * 0.1 + recency boost)
      query = query.order('trending_score', { ascending: false, nullsFirst: false });
      break;
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as PublicTrack[];
}

/**
 * Fetch public projects with filters
 */
export async function fetchPublicProjects(filters: QueryFilters = {}) {
  const { sortBy = 'recent', limit = 20, offset = 0 } = filters;

  let query = supabase
    .from('music_projects')
    .select('*')
    .eq('is_public', true);

  // Apply sorting - use approved_tracks_count as popularity proxy
  switch (sortBy) {
    case 'recent':
      query = query.order('created_at', { ascending: false });
      break;
    case 'popular':
      // Order by number of approved tracks (more complete projects = more popular)
      query = query
        .order('approved_tracks_count', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });
      break;
    case 'trending':
      // For trending: recently updated projects with tracks
      query = query
        .order('updated_at', { ascending: false })
        .order('approved_tracks_count', { ascending: false, nullsFirst: false });
      break;
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as PublicProject[];
}

/**
 * Fetch public artists with filters
 * Note: Artists table doesn't have popularity metrics yet, using updated_at as proxy
 */
export async function fetchPublicArtists(filters: QueryFilters = {}) {
  const { sortBy = 'recent', limit = 20, offset = 0 } = filters;

  let query = supabase
    .from('artists')
    .select('*')
    .eq('is_public', true);

  // Apply genre filtering
  if (filters.genre) {
    query = query.contains('genre_tags', [filters.genre]);
  }

  // Apply mood filtering
  if (filters.mood) {
    query = query.contains('mood_tags', [filters.mood]);
  }

  // Apply sorting
  // TODO: Add popularity_score to artists table for proper sorting
  switch (sortBy) {
    case 'recent':
      query = query.order('created_at', { ascending: false });
      break;
    case 'popular':
      // Order by AI generated status (AI artists tend to be more complete) then by date
      query = query
        .order('is_ai_generated', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false });
      break;
    case 'trending':
      // Recently updated artists are "trending"
      query = query.order('updated_at', { ascending: false });
      break;
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as PublicArtist[];
}

/**
 * Fetch featured/curated content
 */
export async function fetchFeaturedContent() {
  // Fetch featured tracks
  const { data: tracks, error: tracksError } = await supabase
    .from('tracks')
    .select('*')
    .eq('is_public', true)
    .eq('status', 'completed')
    .not('audio_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10);

  if (tracksError) throw tracksError;

  // Fetch featured projects
  const { data: projects, error: projectsError } = await supabase
    .from('music_projects')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(5);

  if (projectsError) throw projectsError;

  return {
    tracks: (tracks || []) as PublicTrack[],
    projects: (projects || []) as PublicProject[],
  };
}

/**
 * Search public content by query string
 */
export async function searchPublicContent(searchQuery: string) {
  if (!searchQuery || searchQuery.trim().length < 2) {
    return { tracks: [], projects: [], artists: [] };
  }

  const query = `%${searchQuery}%`;

  // Search tracks
  const { data: tracks, error: tracksError } = await supabase
    .from('tracks')
    .select('*')
    .eq('is_public', true)
    .eq('status', 'completed')
    .or(`title.ilike.${query},metadata->>style.ilike.${query}`)
    .limit(20);

  if (tracksError) throw tracksError;

  // Search projects
  const { data: projects, error: projectsError } = await supabase
    .from('music_projects')
    .select('*')
    .eq('is_public', true)
    .or(`name.ilike.${query},description.ilike.${query}`)
    .limit(10);

  if (projectsError) throw projectsError;

  // Search artists
  const { data: artists, error: artistsError } = await supabase
    .from('artists')
    .select('*')
    .eq('is_public', true)
    .or(`name.ilike.${query},bio.ilike.${query}`)
    .limit(10);

  if (artistsError) throw artistsError;

  return {
    tracks: (tracks || []) as PublicTrack[],
    projects: (projects || []) as PublicProject[],
    artists: (artists || []) as PublicArtist[],
  };
}

/**
 * Fetch single public track by ID
 */
export async function fetchPublicTrack(trackId: string) {
  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .eq('id', trackId)
    .eq('is_public', true)
    .single();

  if (error) throw error;
  return data as PublicTrack;
}

/**
 * Fetch single public project by ID
 */
export async function fetchPublicProject(projectId: string) {
  const { data, error } = await supabase
    .from('music_projects')
    .select('*')
    .eq('id', projectId)
    .eq('is_public', true)
    .single();

  if (error) throw error;
  return data as PublicProject;
}

/**
 * Fetch single public artist by ID
 */
export async function fetchPublicArtist(artistId: string) {
  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .eq('id', artistId)
    .eq('is_public', true)
    .single();

  if (error) throw error;
  return data as PublicArtist;
}
