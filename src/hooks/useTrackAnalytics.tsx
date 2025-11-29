import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface TrackAnalytics {
  total_plays: number;
  total_downloads: number;
  total_shares: number;
  unique_listeners: number;
  total_likes: number;
  plays_by_day: Record<string, number>;
}

export const useTrackAnalytics = (trackId: string | undefined, timePeriod: string = '30 days') => {
  const { user } = useAuth();

  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['track-analytics', trackId, timePeriod],
    queryFn: async () => {
      if (!trackId || !user?.id) return null;

      // First check if the track belongs to the user
      const { data: track } = await supabase
        .from('tracks')
        .select('user_id')
        .eq('id', trackId)
        .single();

      if (!track || track.user_id !== user.id) {
        throw new Error('Unauthorized');
      }

      const { data, error } = await supabase.rpc('get_track_analytics_summary', {
        _track_id: trackId,
        _time_period: `${timePeriod}`,
      });

      if (error) throw error;

      return data?.[0] as TrackAnalytics;
    },
    enabled: !!trackId && !!user?.id,
  });

  return {
    analytics,
    isLoading,
    error,
  };
};
