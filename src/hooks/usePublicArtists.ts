import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PublicArtist {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  style_description: string | null;
  genre_tags: string[] | null;
  mood_tags: string[] | null;
  is_ai_generated: boolean | null;
  user_id: string;
  created_at: string | null;
  profiles?: {
    username: string | null;
    photo_url: string | null;
  };
}

export const usePublicArtists = (limit: number = 20) => {
  return useQuery({
    queryKey: ['public-artists', limit],
    queryFn: async () => {
      // First get artists
      const { data: artistsData, error: artistsError } = await supabase
        .from('artists')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (artistsError) throw artistsError;
      if (!artistsData || artistsData.length === 0) return [];

      // Get unique user_ids
      const userIds = [...new Set(artistsData.map(a => a.user_id))];
      
      // Fetch profiles for those users
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, username, photo_url')
        .in('user_id', userIds);

      // Map profiles by user_id
      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

      // Combine data
      return artistsData.map(artist => ({
        ...artist,
        profiles: profilesMap.get(artist.user_id) || undefined,
      })) as PublicArtist[];
    },
    staleTime: 60000,
  });
};
