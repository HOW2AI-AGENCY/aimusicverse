import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserStats {
  totalTracks: number;
  publicTracks: number;
  totalPlays: number;
  totalLikes: number;
  totalProjects: number;
  totalPlaylists: number;
  totalArtists: number;
  generationsThisMonth: number;
  completedGenerations: number;
  failedGenerations: number;
}

export function useUserStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async (): Promise<UserStats> => {
      if (!user?.id) {
        return {
          totalTracks: 0,
          publicTracks: 0,
          totalPlays: 0,
          totalLikes: 0,
          totalProjects: 0,
          totalPlaylists: 0,
          totalArtists: 0,
          generationsThisMonth: 0,
          completedGenerations: 0,
          failedGenerations: 0,
        };
      }

      // Fetch all stats in parallel
      const [
        tracksResult,
        projectsResult,
        playlistsResult,
        artistsResult,
        generationsResult,
      ] = await Promise.all([
        supabase
          .from('tracks')
          .select('id, is_public, play_count, likes_count, status')
          .eq('user_id', user.id),
        supabase
          .from('music_projects')
          .select('id')
          .eq('user_id', user.id),
        supabase
          .from('playlists')
          .select('id')
          .eq('user_id', user.id),
        supabase
          .from('artists')
          .select('id')
          .eq('user_id', user.id),
        supabase
          .from('generation_tasks')
          .select('id, status, created_at')
          .eq('user_id', user.id)
          .gte('created_at', new Date(new Date().setDate(1)).toISOString()),
      ]);

      const tracks = tracksResult.data || [];
      const completedTracks = tracks.filter(t => t.status === 'completed');

      return {
        totalTracks: completedTracks.length,
        publicTracks: completedTracks.filter(t => t.is_public).length,
        totalPlays: completedTracks.reduce((sum, t) => sum + (t.play_count || 0), 0),
        totalLikes: completedTracks.reduce((sum, t) => sum + (t.likes_count || 0), 0),
        totalProjects: projectsResult.data?.length || 0,
        totalPlaylists: playlistsResult.data?.length || 0,
        totalArtists: artistsResult.data?.length || 0,
        generationsThisMonth: generationsResult.data?.length || 0,
        completedGenerations: generationsResult.data?.filter(g => g.status === 'completed').length || 0,
        failedGenerations: generationsResult.data?.filter(g => g.status === 'failed').length || 0,
      };
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 1 minute
  });
}
