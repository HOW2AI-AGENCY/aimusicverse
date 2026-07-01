/**
 * useTranscriptionForStudio - Query hook that resolves the active transcription
 * for a given (versionId, trackId, stemType) tuple.
 *
 * Resolution order:
 *  1. version.transcription_data (cached, fast)
 *  2. stem_transcriptions row matching trackId + stemType
 *  3. latest stem_transcriptions row for trackId (or fallback stem id)
 *
 * Returns the raw transcription payload (caller normalizes MIDI notes).
 */

import { useQuery } from "@tanstack/react-query";
import {
  fetchVersionTranscription,
  fetchStemTranscriptionForTrackType,
  fetchLatestTranscriptionForTrackOrStem,
  type ResolvedTranscription,
} from "@/services/studio.service";
import { queryKeys } from "@/lib/queryKeys";

export function useTranscriptionForStudio(params: {
  versionId?: string;
  trackId?: string;
  stemType?: string;
  fallbackStemId: string;
}) {
  const { versionId, trackId, stemType, fallbackStemId } = params;

  return useQuery<ResolvedTranscription | null>({
    queryKey: queryKeys.studio.transcription(trackId ?? fallbackStemId),
    queryFn: async () => {
      // 1) Cached on track version
      if (versionId) {
        const v = await fetchVersionTranscription(versionId);
        if (v) return v;
      }

      // 2) stem_transcriptions by trackId + stemType
      if (trackId && stemType) {
        const s = await fetchStemTranscriptionForTrackType(trackId, stemType);
        if (s) return s;
      }

      // 3) Fallback to latest transcription for trackId (or fallback stem id)
      return fetchLatestTranscriptionForTrackOrStem(trackId, fallbackStemId);
    },
    enabled: !!(trackId || fallbackStemId),
    staleTime: 30_000,
  });
}
