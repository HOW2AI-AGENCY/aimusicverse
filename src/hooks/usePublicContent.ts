/**
 * Public Content Hook
 *
 * Fetches public tracks, projects, and artists for discovery features
 * Includes filtering, sorting, and pagination
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type PublicTrack = Database["public"]["Tables"]["tracks"]["Row"];
type PublicProject = Database["public"]["Tables"]["music_projects"]["Row"];
type PublicArtist = Database["public"]["Tables"]["artists"]["Row"];

interface PublicContentFilters {
  genre?: string;
  mood?: string;
  sortBy?: "recent" | "popular" | "trending";
  limit?: number;
  offset?: number;
}

interface UsePublicContentParams {
  sort?: "recent" | "popular" | "trending" | "featured";
  limit?: number;
  offset?: number;
  genre?: string;
  mood?: string;
}

/**
 * General hook to fetch public content (tracks)
 * Unified interface for different sections
 */
export interface PublicTrackWithCreator extends PublicTrack {
  creator_username?: string;
  creator_photo_url?: string;
  artist_name?: string;
  artist_avatar?: string;
  like_count?: number;
  user_liked?: boolean;
}

export function usePublicContent(params: UsePublicContentParams = {}) {
  const { sort = "recent", limit = 20, offset = 0, genre, mood } = params;

  // Map 'featured' to 'recent' for now (TODO: implement featured logic)
  const sortBy = sort === "featured" ? "recent" : sort;

  const query = useQuery({
    queryKey: ["public-content", params],
    queryFn: async () => {
      let queryBuilder = supabase
        .from("tracks")
        .select("*")
        .eq("is_public", true)
        .eq("status", "completed")
        .not("audio_url", "is", null)
        .range(offset, offset + limit - 1);

      // Apply sorting
      switch (sortBy) {
        case "recent":
          queryBuilder = queryBuilder.order("created_at", { ascending: false });
          break;
        case "popular":
          queryBuilder = queryBuilder.order("play_count", { ascending: false });
          break;
        case "trending":
          queryBuilder = queryBuilder.order("created_at", { ascending: false });
          break;
      }

      const { data: tracks, error } = await queryBuilder;

      if (error) throw error;
      if (!tracks || tracks.length === 0) return [] as PublicTrackWithCreator[];

      // Get unique user_ids from tracks
      const userIds = [...new Set(tracks.map(t => t.user_id))];
      const trackIds = tracks.map(t => t.id);
      
      // Fetch profiles for creators
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, photo_url")
        .in("user_id", userIds);

      // Fetch like counts for all tracks
      const { data: likeCounts } = await supabase
        .from("track_likes")
        .select("track_id")
        .in("track_id", trackIds);

      // Get current user's likes
      const { data: { user } } = await supabase.auth.getUser();
      let userLikes: string[] = [];
      if (user) {
        const { data: userLikesData } = await supabase
          .from("track_likes")
          .select("track_id")
          .eq("user_id", user.id)
          .in("track_id", trackIds);
        userLikes = userLikesData?.map(l => l.track_id) || [];
      }

      // Create maps for quick lookup
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const likeCountMap = new Map<string, number>();
      likeCounts?.forEach(l => {
        likeCountMap.set(l.track_id, (likeCountMap.get(l.track_id) || 0) + 1);
      });

      // Enrich tracks with creator info and like data
      const enrichedTracks: PublicTrackWithCreator[] = tracks.map(track => ({
        ...track,
        creator_username: profileMap.get(track.user_id)?.username || undefined,
        creator_photo_url: profileMap.get(track.user_id)?.photo_url || undefined,
        like_count: likeCountMap.get(track.id) || 0,
        user_liked: userLikes.includes(track.id),
      }));

      return enrichedTracks;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    tracks: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    // Mock pagination functions for now
    fetchNextPage: () => Promise.resolve(),
    hasNextPage: false,
  };
}

/**
 * Hook to fetch public tracks
 */
export function usePublicTracks(filters: PublicContentFilters = {}) {
  const { sortBy = "recent", limit = 20, offset = 0 } = filters;

  return useQuery({
    queryKey: ["public-tracks", filters],
    queryFn: async () => {
      let query = supabase
        .from("tracks")
        .select("*")
        .eq("is_public", true)
        .eq("status", "completed")
        .not("audio_url", "is", null)
        .range(offset, offset + limit - 1);

      // Apply sorting
      switch (sortBy) {
        case "recent":
          query = query.order("created_at", { ascending: false });
          break;
        case "popular":
          // TODO: Add play_count or popularity metric
          query = query.order("created_at", { ascending: false });
          break;
        case "trending":
          // TODO: Add trending algorithm (views in last 7 days)
          query = query.order("created_at", { ascending: false });
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
  const { sortBy = "recent", limit = 20, offset = 0 } = filters;

  return useQuery({
    queryKey: ["public-projects", filters],
    queryFn: async () => {
      let query = supabase
        .from("music_projects")
        .select("*")
        .eq("is_public", true)
        .range(offset, offset + limit - 1);

      // Apply sorting
      switch (sortBy) {
        case "recent":
          query = query.order("created_at", { ascending: false });
          break;
        case "popular":
        case "trending":
          query = query.order("created_at", { ascending: false });
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
  const { sortBy = "recent", limit = 20, offset = 0 } = filters;

  return useQuery({
    queryKey: ["public-artists", filters],
    queryFn: async () => {
      let query = supabase
        .from("artists")
        .select("*")
        .eq("is_public", true)
        .range(offset, offset + limit - 1);

      // Apply sorting
      switch (sortBy) {
        case "recent":
          query = query.order("created_at", { ascending: false });
          break;
        case "popular":
        case "trending":
          query = query.order("created_at", { ascending: false });
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
    queryKey: ["featured-content"],
    queryFn: async () => {
      // Get top rated/featured tracks
      const { data: tracks, error: tracksError } = await supabase
        .from("tracks")
        .select("*")
        .eq("is_public", true)
        .eq("status", "completed")
        .not("audio_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(10);

      if (tracksError) throw tracksError;

      // Get featured projects
      const { data: projects, error: projectsError } = await supabase
        .from("music_projects")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
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
    queryKey: ["search-public-content", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.trim().length < 2) {
        return { tracks: [], projects: [], artists: [] };
      }

      const query = `%${searchQuery}%`;

      // Search tracks
      const { data: tracks, error: tracksError } = await supabase
        .from("tracks")
        .select("*")
        .eq("is_public", true)
        .eq("status", "completed")
        .or(`title.ilike.${query},metadata->>style.ilike.${query}`)
        .limit(20);

      if (tracksError) throw tracksError;

      // Search projects
      const { data: projects, error: projectsError } = await supabase
        .from("music_projects")
        .select("*")
        .eq("is_public", true)
        .or(`name.ilike.${query},description.ilike.${query}`)
        .limit(10);

      if (projectsError) throw projectsError;

      // Search artists
      const { data: artists, error: artistsError } = await supabase
        .from("artists")
        .select("*")
        .eq("is_public", true)
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
