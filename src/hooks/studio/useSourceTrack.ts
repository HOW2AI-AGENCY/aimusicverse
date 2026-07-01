/**
 * useSourceTrack - Query hook for fetching source track metadata (lyrics + suno IDs).
 *
 * Used by MobileSectionsContent and other studio components that need
 * to read lyrics, suno_task_id, or suno_id for a given track id.
 */

import { useQuery } from "@tanstack/react-query";
import { fetchSourceTrack, type SourceTrackMetadata } from "@/services/studio.service";
import { queryKeys } from "@/lib/queryKeys";

export function useSourceTrack(trackId: string | null | undefined) {
  return useQuery<SourceTrackMetadata | null>({
    queryKey: trackId ? queryKeys.studio.sourceTrack(trackId) : ["source-track", "noop"],
    queryFn: () => (trackId ? fetchSourceTrack(trackId) : Promise.resolve(null)),
    enabled: !!trackId,
    staleTime: 30_000,
  });
}
