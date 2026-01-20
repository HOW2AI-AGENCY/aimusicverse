/**
 * Basic Public Content Query Hooks
 *
 * Simple query hooks for fetching public tracks, projects, and artists.
 * For optimized batch loading, use usePublicContentBatch instead.
 *
 * @module hooks/public-content/useBasicQueries
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PublicContentFilters, PublicTrack, PublicProject, PublicArtist, PublicTrackWithCreator, UsePublicContentParams } from './types';
import { PUBLIC_CONTENT_STALE_TIME } from './constants';

/**
 * Hook to fetch public tracks with filtering and sorting
 *
 * @param filters - Filter and sort options
 * @returns Query result with public tracks array
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
          query = query.order("play_count", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false });
          break;
        case "trending":
          query = query.order("play_count", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false });
          break;
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as PublicTrack[];
    },
    staleTime: PUBLIC_CONTENT_STALE_TIME,
  });
}

/**
 * Hook to fetch public projects with filtering and sorting
 *
 * @param filters - Filter and sort options
 * @returns Query result with public projects array
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
    staleTime: PUBLIC_CONTENT_STALE_TIME,
  });
}

/**
 * Hook to fetch public artists with filtering and sorting
 *
 * @param filters - Filter and sort options
 * @returns Query result with public artists array
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
    staleTime: PUBLIC_CONTENT_STALE_TIME,
  });
}

/**
 * Hook to fetch public content with enriched creator info
 *
 * @param params - Content parameters
 * @returns Query result with enriched tracks and pagination info
 */
export function usePublicContent(params: UsePublicContentParams = {}) {
  const { sort = "recent", limit = 20, offset = 0 } = params;
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

      // Fetch profiles and likes in parallel
      const [profilesResult, likeCountsResult, userResult] = await Promise.all([
        supabase.from("profiles").select("user_id, username, photo_url").in("user_id", userIds),
        supabase.from("track_likes").select("track_id").in("track_id", trackIds),
        supabase.auth.getUser(),
      ]);

      // Get current user's likes if authenticated
      let userLikes: string[] = [];
      if (userResult.data?.user) {
        const { data: userLikesData } = await supabase
          .from("track_likes")
          .select("track_id")
          .eq("user_id", userResult.data.user.id)
          .in("track_id", trackIds);
        userLikes = userLikesData?.map(l => l.track_id) || [];
      }

      // Create lookup maps
      const profileMap = new Map(profilesResult.data?.map(p => [p.user_id, p]) || []);
      const likeCountMap = new Map<string, number>();
      likeCountsResult.data?.forEach(l => {
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
    staleTime: PUBLIC_CONTENT_STALE_TIME,
  });

  return {
    tracks: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    fetchNextPage: () => Promise.resolve(),
    hasNextPage: false,
  };
}

/**
 * Hook to fetch featured/curated public content
 *
 * @returns Query result with featured tracks and projects
 */
export function useFeaturedContent() {
  return useQuery({
    queryKey: ["featured-content"],
    queryFn: async () => {
      const [tracksResult, projectsResult] = await Promise.all([
        supabase
          .from("tracks")
          .select("*")
          .eq("is_public", true)
          .eq("status", "completed")
          .not("audio_url", "is", null)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("music_projects")
          .select("*")
          .eq("is_public", true)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      if (tracksResult.error) throw tracksResult.error;
      if (projectsResult.error) throw projectsResult.error;

      return {
        tracks: (tracksResult.data || []) as PublicTrack[],
        projects: (projectsResult.data || []) as PublicProject[],
      };
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to search public content across tracks, projects, and artists
 *
 * @param searchQuery - Search query string (min 2 characters)
 * @returns Query result with matching tracks, projects, and artists
 */
export function useSearchPublicContent(searchQuery: string) {
  return useQuery({
    queryKey: ["search-public-content", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.trim().length < 2) {
        return { tracks: [], projects: [], artists: [] };
      }

      const query = `%${searchQuery}%`;

      const [tracksResult, projectsResult, artistsResult] = await Promise.all([
        supabase
          .from("tracks")
          .select("*")
          .eq("is_public", true)
          .eq("status", "completed")
          .or(`title.ilike.${query},metadata->>style.ilike.${query}`)
          .limit(20),
        supabase
          .from("music_projects")
          .select("*")
          .eq("is_public", true)
          .or(`name.ilike.${query},description.ilike.${query}`)
          .limit(10),
        supabase
          .from("artists")
          .select("*")
          .eq("is_public", true)
          .or(`name.ilike.${query},bio.ilike.${query}`)
          .limit(10),
      ]);

      if (tracksResult.error) throw tracksResult.error;
      if (projectsResult.error) throw projectsResult.error;
      if (artistsResult.error) throw artistsResult.error;

      return {
        tracks: (tracksResult.data || []) as PublicTrack[],
        projects: (projectsResult.data || []) as PublicProject[],
        artists: (artistsResult.data || []) as PublicArtist[],
      };
    },
    enabled: !!searchQuery && searchQuery.trim().length >= 2,
    staleTime: PUBLIC_CONTENT_STALE_TIME,
  });
}
