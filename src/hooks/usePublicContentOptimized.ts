/**
 * Optimized Public Content Hook
 * Single query that fetches all public content for homepage
 * Prevents multiple separate database calls
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "./useAuth";

type Track = Database["public"]["Tables"]["tracks"]["Row"];

export interface PublicTrackWithCreator extends Track {
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

const GENRE_KEYWORDS = ['electronic', 'hip-hop', 'pop', 'rock', 'ambient', 'jazz'];

/**
 * Single optimized hook that fetches all public content in one query
 * Used by homepage sections to avoid multiple database calls
 */
export function usePublicContentOptimized() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['public-content-optimized', user?.id],
    queryFn: async (): Promise<PublicContentData> => {
      // Single query to get all public tracks (max 100 for performance)
      const { data: tracks, error } = await supabase
        .from("tracks")
        .select("*")
        .eq("is_public", true)
        .eq("status", "completed")
        .not("audio_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(100);

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
      const trackIds = tracks.map(t => t.id);

      // Batch fetch profiles and likes in parallel
      const [profilesResult, likesResult, userLikesResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, username, photo_url, first_name, last_name")
          .in("user_id", userIds),
        supabase
          .from("track_likes")
          .select("track_id")
          .in("track_id", trackIds),
        user ? supabase
          .from("track_likes")
          .select("track_id")
          .eq("user_id", user.id)
          .in("track_id", trackIds) : Promise.resolve({ data: [] }),
      ]);

      // Create lookup maps
      const profileMap = new Map(profilesResult.data?.map(p => [p.user_id, p]) || []);
      const likeCountMap = new Map<string, number>();
      likesResult.data?.forEach(l => {
        likeCountMap.set(l.track_id, (likeCountMap.get(l.track_id) || 0) + 1);
      });
      const userLikes = new Set(userLikesResult.data?.map(l => l.track_id) || []);

      // Enrich all tracks with creator info and likes
      const enrichedTracks: PublicTrackWithCreator[] = tracks.map(track => {
        const profile = profileMap.get(track.user_id);
        const fullName = profile 
          ? [profile.first_name, profile.last_name].filter(Boolean).join(' ')
          : '';
        const creatorName = fullName || profile?.username || undefined;
        
        return {
          ...track,
          creator_name: creatorName,
          creator_username: profile?.username || undefined,
          creator_photo_url: profile?.photo_url || undefined,
          like_count: likeCountMap.get(track.id) || 0,
          user_liked: userLikes.has(track.id),
        };
      });

      // Sort for different views (all from same dataset)
      const sortedByPopular = [...enrichedTracks].sort((a, b) => 
        (b.play_count || 0) - (a.play_count || 0)
      );

      return {
        featuredTracks: sortedByPopular.slice(0, 10), // Top 10 by plays
        recentTracks: enrichedTracks.slice(0, 20), // First 20 (already sorted by date)
        popularTracks: sortedByPopular.slice(0, 20), // Top 20 by plays
        allTracks: enrichedTracks, // All for auto-playlists
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
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
      const style = (track.style || '').toLowerCase();
      const tags = (track.tags || '').toLowerCase();
      const searchText = `${style} ${tags}`;
      return keywords.some(keyword => searchText.includes(keyword));
    }).slice(0, 20);

    return {
      id: `auto-${genre}`,
      genre,
      title,
      description,
      tracks: genreTracks,
    };
  }).filter(p => p.tracks.length >= 2); // Lower threshold for more genres
}
