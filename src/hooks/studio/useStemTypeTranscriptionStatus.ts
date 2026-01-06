/**
 * useStemTypeTranscriptionStatus
 * Returns which stem types have transcription files for a given source track.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type StemTypeTranscriptionStatus = Record<string, boolean>;

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

      const { data, error } = await supabase
        .from('stem_transcriptions')
        .select('stem_type, midi_url, pdf_url, gp5_url, mxml_url')
        .eq('track_id', sourceTrackId)
        .in('stem_type', stemTypes);

      if (error) {
        console.error('Error fetching stem-type transcription status:', error);
        return {};
      }

      const status: StemTypeTranscriptionStatus = {};
      stemTypes.forEach((t) => {
        status[t] = false;
      });

      data?.forEach((row: any) => {
        const stemType = row?.stem_type;
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
