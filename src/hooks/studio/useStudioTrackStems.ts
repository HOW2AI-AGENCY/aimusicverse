/**
 * useStudioTrackStems - Query hook for fetching all stems of a track.
 * Thin wrapper over studio.service.fetchTrackStems so the StudioTranscriptionPanel
 * can resolve a stem id from (trackId, stemType) without importing from @/api.
 */

import { useQuery } from "@tanstack/react-query";
import { fetchTrackStems } from "@/services/studio.service";
import { queryKeys } from "@/lib/queryKeys";

export interface TrackStemRow {
  id: string;
  stem_type: string;
  [key: string]: unknown;
}

export function useStudioTrackStems(trackId: string | undefined) {
  return useQuery<TrackStemRow[]>({
    queryKey: trackId ? queryKeys.tracks.stems(trackId) : ["studio-track-stems", "none"],
    queryFn: async () => {
      if (!trackId) return [];
      return fetchTrackStems(trackId);
    },
    enabled: !!trackId,
    staleTime: 30_000,
  });
}
