/**
 * useLatestStemTranscription - Query hook for fetching the most recent
 * stem_transcriptions row, preferring (by stem id) and falling back to (by track id).
 */

import { useQuery } from "@tanstack/react-query";
import { fetchLatestStemTranscriptionByStemId, fetchLatestStemTranscriptionByTrackId } from "@/services/studio.service";

export function useLatestStemTranscription(params: { stemId?: string | null; trackId?: string | null }) {
  const { stemId, trackId } = params;

  return useQuery<Record<string, unknown> | null>({
    queryKey: ["studio-latest-transcription", stemId ?? null, trackId ?? null],
    queryFn: async () => {
      if (stemId) {
        return fetchLatestStemTranscriptionByStemId(stemId);
      }
      if (trackId) {
        return fetchLatestStemTranscriptionByTrackId(trackId);
      }
      return null;
    },
    enabled: !!(stemId || trackId),
    staleTime: 30_000,
  });
}
