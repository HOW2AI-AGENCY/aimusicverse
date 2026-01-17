/**
 * Public Content Hooks
 *
 * Unified hooks for fetching public tracks, projects, and artists for discovery features
 * Includes filtering, sorting, pagination, and batch loading for homepage
 */

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "./useAuth";

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
 * Extended track type with creator info and likes
 */
export interface PublicTrackWithCreator extends PublicTrack {
  creator_name?: string;
  creator_username?: string;
  creator_photo_url?: string;
  like_count?: number;
  user_liked?: boolean;
}

interface PublicContentData {
  featuredTracks: PublicTrackWithCreator[];
  recentTracks: PublicTrackWithCreator[];
  popularTracks: PublicTrackWithCreator[];
  allTracks: PublicTrackWithCreator[];
}

export function usePublicContent(params: UsePublicContentParams = {}) {
  const { sort = "recent", limit = 20, offset = 0, genre, mood } = params;

  // Featured uses recent sorting for now
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
          // Sort by play_count (defaults to recent if no plays)
          query = query.order("play_count", { ascending: false, nullsFirst: false })
                       .order("created_at", { ascending: false });
          break;
        case "trending":
          // Trending uses recent + play_count combination
          query = query.order("play_count", { ascending: false, nullsFirst: false })
                       .order("created_at", { ascending: false });
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

/**
 * Single optimized hook that fetches all public content in one query
 * Used by homepage sections to avoid multiple database calls
 */
export function usePublicContentBatch() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['public-content-optimized', user?.id],
    queryFn: async (): Promise<PublicContentData> => {
      // PERF: Reduced limit for faster initial load, select only needed fields
      const { data: tracks, error } = await supabase
        .from("tracks")
        .select("id,title,cover_url,audio_url,play_count,user_id,created_at,style,tags,computed_genre,status,is_public")
        .eq("is_public", true)
        .eq("status", "completed")
        .not("audio_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!tracks || tracks.length === 0) {
        return {
          featuredTracks: [],
          recentTracks: [],
          popularTracks: [],
          allTracks: [],
        };
      }

      // Get unique user_ids from tracks
      const userIds = [...new Set(tracks.map(t => t.user_id))];

      // Fetch only profiles (skip likes for faster load)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, photo_url, first_name")
        .in("user_id", userIds);

      // Create lookup map
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Enrich tracks with minimal creator info
      const enrichedTracks: PublicTrackWithCreator[] = tracks.map(track => {
        const profile = profileMap.get(track.user_id);
        return {
          ...track,
          creator_name: profile?.first_name || profile?.username || undefined,
          creator_username: profile?.username || undefined,
          creator_photo_url: profile?.photo_url || undefined,
          like_count: 0,
          user_liked: false,
        } as PublicTrackWithCreator;
      });

      // Sort for different views
      const sortedByPopular = [...enrichedTracks].sort((a, b) => 
        (b.play_count || 0) - (a.play_count || 0)
      );

      return {
        featuredTracks: sortedByPopular.slice(0, 10),
        recentTracks: enrichedTracks.slice(0, 20),
        popularTracks: sortedByPopular.slice(0, 20),
        allTracks: enrichedTracks,
      };
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    placeholderData: keepPreviousData,
  });
}

/**
 * Get auto-generated playlists from pre-fetched public content
 */
export function getGenrePlaylists(tracks: PublicTrackWithCreator[]) {
  const GENRE_PLAYLISTS = [
    { genre: 'electronic', title: 'Электроника', description: 'Лучшие электронные треки', keywords: ['electronic', 'electro', 'edm', 'techno', 'house', 'trance'] },
    { genre: 'hip-hop', title: 'Хип-Хоп', description: 'Свежий хип-хоп и рэп', keywords: ['hip-hop', 'hip hop', 'rap', 'trap', 'boom bap'] },
    { genre: 'pop', title: 'Поп', description: 'Популярная музыка', keywords: ['pop', 'dance', 'synth-pop', 'dream pop'] },
    { genre: 'rock', title: 'Рок', description: 'Энергичный рок', keywords: ['rock', 'metal', 'alternative', 'indie', 'punk', 'grunge'] },
    { genre: 'ambient', title: 'Амбиент', description: 'Атмосферная музыка', keywords: ['ambient', 'chill', 'downtempo', 'atmospheric', 'drone'] },
    { genre: 'jazz', title: 'Джаз', description: 'Классический и современный джаз', keywords: ['jazz', 'swing', 'bebop', 'fusion', 'smooth jazz'] },
    { genre: 'rnb', title: 'R&B / Soul', description: 'Ритм-н-блюз и соул', keywords: ['r&b', 'rnb', 'soul', 'neo-soul', 'funk', 'rhythm'] },
    { genre: 'classical', title: 'Классика', description: 'Классическая и оркестровая музыка', keywords: ['classical', 'orchestral', 'symphony', 'piano', 'opera', 'baroque'] },
    { genre: 'lofi', title: 'Lo-Fi', description: 'Lo-Fi биты для релакса', keywords: ['lo-fi', 'lofi', 'chillhop', 'study', 'relax', 'beats'] },
    { genre: 'latin', title: 'Латино', description: 'Латиноамериканская музыка', keywords: ['latin', 'reggaeton', 'salsa', 'bachata', 'cumbia', 'bossa'] },
    { genre: 'country', title: 'Кантри', description: 'Кантри и фолк', keywords: ['country', 'folk', 'acoustic', 'bluegrass', 'americana'] },
    { genre: 'cinematic', title: 'Кинематографичная', description: 'Эпическая и саундтрек музыка', keywords: ['cinematic', 'epic', 'soundtrack', 'film', 'trailer', 'dramatic'] },
  ];

  return GENRE_PLAYLISTS.map(({ genre, title, description, keywords }) => {
    const genreTracks = tracks.filter(track => {
      // Priority: computed_genre (most reliable)
      const computedGenre = (track.computed_genre || '').toLowerCase();
      if (keywords.some(keyword => computedGenre.includes(keyword))) {
        return true;
      }
      // Fallback: style and tags
      const style = (track.style || '').toLowerCase();
      const tags = (track.tags || '').toLowerCase();
      const searchText = `${style} ${tags}`;
      return keywords.some(keyword => searchText.includes(keyword));
    }).slice(0, 25);

    return {
      id: `auto-${genre}`,
      genre,
      title,
      description,
      tracks: genreTracks,
    };
  }).filter(p => p.tracks.length >= 2);
}
