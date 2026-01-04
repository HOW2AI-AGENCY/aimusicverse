import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AdminTrack {
  id: string;
  title: string | null;
  status: string | null;
  style: string | null;
  duration_seconds: number | null;
  play_count: number | null;
  is_public: boolean | null;
  created_at: string | null;
  user_id: string;
  audio_url: string | null;
  cover_url: string | null;
  creator_username?: string | null;
  creator_photo_url?: string | null;
}

export function useAdminTracks(searchQuery?: string, limit = 50) {
  return useQuery({
    queryKey: ["admin-tracks", searchQuery, limit],
    queryFn: async () => {
      let query = supabase
        .from("tracks")
        .select("id, title, status, style, duration_seconds, play_count, is_public, created_at, user_id, audio_url, cover_url")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,style.ilike.%${searchQuery}%`);
      }

      const { data: tracks, error } = await query;
      if (error) throw error;

      // Fetch creator info
      const userIds = [...new Set(tracks?.map(t => t.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, photo_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return tracks?.map(track => ({
        ...track,
        creator_username: profileMap.get(track.user_id)?.username,
        creator_photo_url: profileMap.get(track.user_id)?.photo_url,
      })) as AdminTrack[];
    },
    staleTime: 30000,
  });
}
