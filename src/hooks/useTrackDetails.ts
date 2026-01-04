import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type TrackRow = Database['public']['Tables']['tracks']['Row'];
type TrackVersionRow = Database['public']['Tables']['track_versions']['Row'];
type TrackStemRow = Database['public']['Tables']['track_stems']['Row'];
type AudioAnalysisRow = Database['public']['Tables']['audio_analysis']['Row'];
type TrackChangeLogRow = Database['public']['Tables']['track_change_log']['Row'];

interface TrackDetails {
  track: TrackRow;
  versions: TrackVersionRow[];
  stems: TrackStemRow[];
  analysis: AudioAnalysisRow | null;
  changelog: TrackChangeLogRow[];
}

export function useTrackDetails(trackId: string) {
  return useQuery({
    queryKey: ['track-details', trackId],
    queryFn: async (): Promise<TrackDetails> => {
      // Fetch all data in parallel
      const [trackRes, versionsRes, stemsRes, analysisRes, changelogRes] = await Promise.all([
        supabase.from('tracks').select('*').eq('id', trackId).single(),
        supabase
          .from('track_versions')
          .select('*')
          .eq('track_id', trackId)
          .order('created_at', { ascending: false }),
        supabase
          .from('track_stems')
          .select('*')
          .eq('track_id', trackId)
          .order('stem_type'),
        supabase
          .from('audio_analysis')
          .select('*')
          .eq('track_id', trackId)
          .maybeSingle(),
        supabase
          .from('track_change_log')
          .select('*')
          .eq('track_id', trackId)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      if (trackRes.error) throw trackRes.error;
      if (versionsRes.error) throw versionsRes.error;
      if (stemsRes.error) throw stemsRes.error;
      if (analysisRes.error) throw analysisRes.error;
      if (changelogRes.error) throw changelogRes.error;

      return {
        track: trackRes.data,
        versions: versionsRes.data || [],
        stems: stemsRes.data || [],
        analysis: analysisRes.data,
        changelog: changelogRes.data || [],
      };
    },
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });
}

// Individual hooks for specific data if needed
export function useTrackVersions(trackId: string) {
  return useQuery({
    queryKey: ['track-versions', trackId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('track_versions')
        .select('*')
        .eq('track_id', trackId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useTrackStems(trackId: string) {
  return useQuery({
    queryKey: ['track-stems', trackId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('track_stems')
        .select('*')
        .eq('track_id', trackId)
        .order('stem_type');

      if (error) throw error;
      return data || [];
    },
  });
}

export function useTrackAnalysis(trackId: string) {
  return useQuery({
    queryKey: ['audio-analysis', trackId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_analysis')
        .select('*')
        .eq('track_id', trackId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

export function useTrackChangelog(trackId: string) {
  return useQuery({
    queryKey: ['track-change-log', trackId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('track_change_log')
        .select('*')
        .eq('track_id', trackId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
  });
}
