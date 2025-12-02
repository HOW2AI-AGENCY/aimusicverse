import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TrackVersion {
  id: string;
  track_id: string;
  audio_url: string;
  cover_url: string | null;
  duration_seconds: number | null;
  version_type: string;
  is_primary: boolean;
  parent_version_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export const useTrackVersions = (trackId: string) => {
  return useQuery({
    queryKey: ['track-versions', trackId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('track_versions')
        .select('*')
        .eq('track_id', trackId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as TrackVersion[];
    },
    enabled: !!trackId,
  });
};
