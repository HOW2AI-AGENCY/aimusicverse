/**
 * Public Content Hook
 * 
 * Fetches public tracks, projects, and artists for discovery features
 * Includes filtering, sorting, and pagination
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type PublicTrack = Database['public']['Tables']['tracks']['Row'];
type PublicProject = Database['public']['Tables']['music_projects']['Row'];
type PublicArtist = Database['public']['Tables']['artists']['Row'];

interface PublicContentFilters {
  genre?: string;
  mood?: string;
  sortBy?: 'recent' | 'popular' | 'trending';
  limit?: number;
  offset?: number;
}

/**
 * Hook to fetch public tracks
 */
export function usePublicTracks(filters: PublicContentFilters = {}) {
  const { sortBy = 'recent', limit = 20, offset = 0 } = filters;

  return useQuery({
    queryKey: ['public-tracks', filters],
    queryFn: async () => {
      let query = supabase
        .from('tracks')
        .select('*')
        .eq('is_public', true)
        .eq('status', 'completed')
        .not('audio_url', 'is', null)
        .range(offset, offset + limit - 1);

      // Apply sorting
      switch (sortBy) {
        case 'recent':
          query = query.order('created_at', { ascending: false });
          break;
        case 'popular':
          // TODO: Add play_count or popularity metric
          query = query.order('created_at', { ascending: false });
          break;
        case 'trending':
          // TODO: Add trending algorithm (views in last 7 days)
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as PublicTrack[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch public projects
 */
export function usePublicProjects(filters: PublicContentFilters = {}) {
  const { sortBy = 'recent', limit = 20, offset = 0 } = filters;

  return useQuery({
    queryKey: ['public-projects', filters],
    queryFn: async () => {
      let query = supabase
        .from('music_projects')
        .select('*')
        .eq('is_public', true)
        .range(offset, offset + limit - 1);

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

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as PublicProject[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch public artists
 */
export function usePublicArtists(filters: PublicContentFilters = {}) {
  const { sortBy = 'recent', limit = 20, offset = 0 } = filters;

  return useQuery({
    queryKey: ['public-artists', filters],
    queryFn: async () => {
      let query = supabase
        .from('artists')
        .select('*')
        .eq('is_public', true)
        .range(offset, offset + limit - 1);

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

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as PublicArtist[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch featured/curated public content
 */
export function useFeaturedContent() {
  return useQuery({
    queryKey: ['featured-content'],
    queryFn: async () => {
      // Get top rated/featured tracks
      const { data: tracks, error: tracksError } = await supabase
        .from('tracks')
        .select('*')
        .eq('is_public', true)
        .eq('status', 'completed')
        .not('audio_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (tracksError) throw tracksError;

      // Get featured projects
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
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to search public content
 */
export function useSearchPublicContent(searchQuery: string) {
  return useQuery({
    queryKey: ['search-public-content', searchQuery],
    queryFn: async () => {
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
    },
    enabled: !!searchQuery && searchQuery.trim().length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
