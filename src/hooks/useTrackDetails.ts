import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Track } from './useTracksOptimized';

interface TrackVersion {
  id: string;
  track_id: string;
  version_number: number;
  audio_url: string;
  is_master: boolean;
  file_size_bytes: number | null;
  created_at: string;
  notes: string | null;
}

interface TrackStem {
  id: string;
  track_id: string;
  stem_type: 'vocals' | 'bass' | 'drums' | 'other';
  audio_url: string;
  file_size_bytes: number | null;
  format: string | null;
  created_at: string;
}

interface TrackAnalysis {
  id: string;
  track_id: string;
  bpm: number | null;
  key: string | null;
  mood: string | null;
  energy: number | null;
  danceability: number | null;
  valence: number | null;
  acousticness: number | null;
  instrumentalness: number | null;
  genre_tags: string[] | null;
  technical_metadata: any | null;
  created_at: string;
}

interface ChangelogEntry {
  id: string;
  track_id: string;
  version_id: string | null;
  change_type: 'created' | 'updated' | 'version_added' | 'master_changed' | 'metadata_updated';
  description: string;
  changed_by: string | null;
  created_at: string;
  metadata: any | null;
}

interface TrackDetails {
  track: Track;
  versions: TrackVersion[];
  stems: TrackStem[];
  analysis: TrackAnalysis | null;
  changelog: ChangelogEntry[];
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
          .order('version_number', { ascending: false }),
        supabase
          .from('track_stems')
          .select('*')
          .eq('track_id', trackId)
          .order('stem_type'),
        supabase
          .from('track_analysis')
          .select('*')
          .eq('track_id', trackId)
          .maybeSingle(),
        supabase
          .from('track_changelog')
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
        track: trackRes.data as Track,
        versions: versionsRes.data as TrackVersion[],
        stems: stemsRes.data as TrackStem[],
        analysis: analysisRes.data as TrackAnalysis | null,
        changelog: changelogRes.data as ChangelogEntry[],
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
        .order('version_number', { ascending: false });

      if (error) throw error;
      return data as TrackVersion[];
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
      return data as TrackStem[];
    },
  });
}

export function useTrackAnalysis(trackId: string) {
  return useQuery({
    queryKey: ['track-analysis', trackId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('track_analysis')
        .select('*')
        .eq('track_id', trackId)
        .maybeSingle();

      if (error) throw error;
      return data as TrackAnalysis | null;
    },
  });
}

export function useTrackChangelog(trackId: string) {
  return useQuery({
    queryKey: ['track-changelog', trackId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('track_changelog')
        .select('*')
        .eq('track_id', trackId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as ChangelogEntry[];
    },
  });
}
