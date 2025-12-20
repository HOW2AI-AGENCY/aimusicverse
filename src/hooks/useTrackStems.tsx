import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TrackStem {
  id: string;
  track_id: string;
  stem_type: string;
  audio_url: string;
  separation_mode: string | null;
  version_id: string | null;
  source?: 'separated' | 'generated' | 'uploaded' | string | null;
  generation_prompt?: string | null;
  generation_model?: string | null;
  created_at: string | null;
}

export const useTrackStems = (trackId: string) => {
  return useQuery({
    queryKey: ['track-stems', trackId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('track_stems')
        .select('*')
        .eq('track_id', trackId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as TrackStem[];
    },
    enabled: !!trackId,
  });
};
