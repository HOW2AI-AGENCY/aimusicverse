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

  // Apply sorting
  switch (sortBy) {
    case 'recent':
      query = query.order('created_at', { ascending: false });
      break;
    case 'popular':
      // TODO: Order by play_count when implemented
      query = query.order('created_at', { ascending: false });
      break;
    case 'trending':
      // TODO: Implement trending algorithm
      query = query.order('created_at', { ascending: false });
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

  // Apply sorting
  switch (sortBy) {
    case 'recent':
      query = query.order('created_at', { ascending: false });
      break;
    case 'popular':
    case 'trending':
      query = query.order('created_at', { ascending: false });
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
  switch (sortBy) {
    case 'recent':
      query = query.order('created_at', { ascending: false });
      break;
    case 'popular':
    case 'trending':
      query = query.order('created_at', { ascending: false });
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
