/**
 * useStemTypeTranscriptionStatus
 * Returns which stem types have transcription files for a given source track.
 * Uses track_stems -> stem_transcriptions relation
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type StemTypeTranscriptionStatus = Record<string, boolean>;

export interface StemTranscriptionData {
  stemType: string;
  stemId: string;
  midiUrl: string | null;
  pdfUrl: string | null;
  gp5Url: string | null;
  mxmlUrl: string | null;
  notes: any[] | null;
  notesCount: number | null;
  bpm: number | null;
  keyDetected: string | null;
  durationSeconds: number | null;
}

export function useStemTypeTranscriptionStatus(params: {
  sourceTrackId?: string | null;
  stemTypes: string[];
}) {
  const sourceTrackId = params.sourceTrackId ?? undefined;
  const stemTypes = params.stemTypes;

  return useQuery({
    queryKey: ['stem-type-transcription-status', sourceTrackId, [...stemTypes].sort().join(',')],
    queryFn: async () => {
      if (!sourceTrackId || stemTypes.length === 0) return {};

      // First get stems for this track
      const { data: stems, error: stemsError } = await supabase
        .from('track_stems')
        .select('id, stem_type')
        .eq('track_id', sourceTrackId)
        .in('stem_type', stemTypes);

      if (stemsError || !stems?.length) {
        return {};
      }

      const stemIds = stems.map(s => s.id);

      // Then get transcriptions for these stems
      const { data: transcriptions, error: transError } = await supabase
        .from('stem_transcriptions')
        .select('stem_id, midi_url, pdf_url, gp5_url, mxml_url')
        .in('stem_id', stemIds);

      if (transError) {
        console.error('Error fetching transcriptions:', transError);
        return {};
      }

      // Build status map
      const status: StemTypeTranscriptionStatus = {};
      stemTypes.forEach((t) => {
        status[t] = false;
      });

      // Map stem_id -> stem_type
      const stemTypeMap = new Map<string, string>();
      stems.forEach(s => stemTypeMap.set(s.id, s.stem_type));

      transcriptions?.forEach((row: any) => {
        const stemId = row.stem_id;
        const stemType = stemTypeMap.get(stemId);
        if (!stemType) return;
        const hasAnyFile = !!(row.midi_url || row.pdf_url || row.gp5_url || row.mxml_url);
        if (hasAnyFile) status[stemType] = true;
      });

      return status;
    },
    enabled: !!sourceTrackId && stemTypes.length > 0,
    staleTime: 30 * 1000,
  });
}

/**
 * Get full transcription data for a specific stem type
 */
export function useStemTranscriptionByType(params: {
  sourceTrackId?: string | null;
  stemType?: string | null;
}) {
  const { sourceTrackId, stemType } = params;

  return useQuery({
    queryKey: ['stem-transcription-by-type', sourceTrackId, stemType],
    queryFn: async (): Promise<StemTranscriptionData | null> => {
      if (!sourceTrackId || !stemType) return null;

      // Get stem for this track + type
      const { data: stem, error: stemError } = await supabase
        .from('track_stems')
        .select('id')
        .eq('track_id', sourceTrackId)
        .eq('stem_type', stemType)
        .maybeSingle();

      if (stemError || !stem) {
        return null;
      }

      // Get transcription for this stem
      const { data: trans, error: transError } = await supabase
        .from('stem_transcriptions')
        .select('*')
        .eq('stem_id', stem.id)
        .maybeSingle();

      if (transError || !trans) {
        return null;
      }

      return {
        stemType,
        stemId: stem.id,
        midiUrl: trans.midi_url,
        pdfUrl: trans.pdf_url,
        gp5Url: trans.gp5_url,
        mxmlUrl: trans.mxml_url,
        notes: trans.notes as any[] | null,
        notesCount: trans.notes_count,
        bpm: trans.bpm ? Number(trans.bpm) : null,
        keyDetected: trans.key_detected,
        durationSeconds: trans.duration_seconds ? Number(trans.duration_seconds) : null,
      };
    },
    enabled: !!sourceTrackId && !!stemType,
    staleTime: 60 * 1000,
  });
}
