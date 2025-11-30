import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TrackChangeLog {
  id: string;
  track_id: string;
  version_id: string | null;
  user_id: string;
  change_type: string;
  changed_by: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  ai_model_used: string | null;
  prompt_used: string | null;
  metadata: any;
  created_at: string;
}

export const useTrackChangelog = (trackId: string) => {
  return useQuery({
    queryKey: ['track-changelog', trackId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('track_change_log')
        .select('*')
        .eq('track_id', trackId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as TrackChangeLog[];
    },
    enabled: !!trackId,
  });
};
