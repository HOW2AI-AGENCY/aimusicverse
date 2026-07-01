/**
 * useTrackVersionsList
 *
 * TanStack Query wrapper around the track versions service. Replaces the
 * direct `supabase.from('track_versions')` call in GenerationResultSheet.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getTrackVersions, type TrackVersion } from "@/services/generation/track-versions.service";

interface UseTrackVersionsListOptions {
  trackId: string | null | undefined;
  enabled?: boolean;
}

export function useTrackVersionsList({ trackId, enabled }: UseTrackVersionsListOptions) {
  return useQuery<TrackVersion[]>({
    queryKey: trackId ? queryKeys.tracks.versions(trackId) : ["track-versions", "none"],
    queryFn: () => getTrackVersions(trackId as string),
    enabled: enabled !== false && !!trackId,
    staleTime: 30_000,
  });
}
