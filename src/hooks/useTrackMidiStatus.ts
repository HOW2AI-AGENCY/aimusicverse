/**
 * Hook to check if a track has MIDI or PDF transcriptions
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TrackMidiStatus {
  hasMidi: boolean;
  hasPdf: boolean;
  hasGp5: boolean;
  hasMusicXml: boolean;
  transcriptionCount: number;
}

export function useTrackMidiStatus(trackId: string | undefined) {
  const { data, isLoading } = useQuery({
    queryKey: ['track-midi-status', trackId],
    queryFn: async (): Promise<TrackMidiStatus> => {
      if (!trackId) {
        return { hasMidi: false, hasPdf: false, hasGp5: false, hasMusicXml: false, transcriptionCount: 0 };
      }

      const { data, error } = await supabase
        .from('stem_transcriptions')
        .select('midi_url, pdf_url, gp5_url, mxml_url')
        .eq('track_id', trackId);

      if (error || !data) {
        return { hasMidi: false, hasPdf: false, hasGp5: false, hasMusicXml: false, transcriptionCount: 0 };
      }

      const hasMidi = data.some(t => !!t.midi_url);
      const hasPdf = data.some(t => !!t.pdf_url);
      const hasGp5 = data.some(t => !!t.gp5_url);
      const hasMusicXml = data.some(t => !!t.mxml_url);

      return {
        hasMidi,
        hasPdf,
        hasGp5,
        hasMusicXml,
        transcriptionCount: data.length,
      };
    },
    enabled: !!trackId,
    staleTime: 60000, // Cache for 1 minute
  });

  return {
    hasMidi: data?.hasMidi ?? false,
    hasPdf: data?.hasPdf ?? false,
    hasGp5: data?.hasGp5 ?? false,
    hasMusicXml: data?.hasMusicXml ?? false,
    transcriptionCount: data?.transcriptionCount ?? 0,
    isLoading,
  };
}

/**
 * Batch hook to get MIDI status for multiple tracks at once
 * More efficient than individual queries for library views
 */
export function useTracksMidiStatus(trackIds: string[]) {
  const { data, isLoading } = useQuery({
    queryKey: ['tracks-midi-status', trackIds.sort().join(',')],
    queryFn: async (): Promise<Record<string, TrackMidiStatus>> => {
      if (!trackIds.length) return {};

      const { data, error } = await supabase
        .from('stem_transcriptions')
        .select('track_id, midi_url, pdf_url, gp5_url, mxml_url')
        .in('track_id', trackIds);

      if (error || !data) return {};

      const statusMap: Record<string, TrackMidiStatus> = {};
      
      // Initialize all track IDs with defaults
      trackIds.forEach(id => {
        statusMap[id] = { hasMidi: false, hasPdf: false, hasGp5: false, hasMusicXml: false, transcriptionCount: 0 };
      });

      // Aggregate by track_id
      data.forEach(t => {
        const status = statusMap[t.track_id];
        if (status) {
          if (t.midi_url) status.hasMidi = true;
          if (t.pdf_url) status.hasPdf = true;
          if (t.gp5_url) status.hasGp5 = true;
          if (t.mxml_url) status.hasMusicXml = true;
          status.transcriptionCount++;
        }
      });

      return statusMap;
    },
    enabled: trackIds.length > 0,
    staleTime: 60000,
  });

  return {
    midiStatusMap: data ?? {},
    isLoading,
  };
}