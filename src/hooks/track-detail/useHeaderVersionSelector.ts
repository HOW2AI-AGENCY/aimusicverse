/**
 * useHeaderVersionSelector — TanStack Query wrapper for the track-detail
 * header version dropdown. Fetches versions with cover_url + created_at.
 */
import { useQuery } from "@tanstack/react-query";
import { fetchTrackVersionsForSelector, type TrackVersionDetail } from "@/services/track-detail/track-detail.service";

export type { TrackVersionDetail };

export function useHeaderVersionSelector(trackId: string) {
  return useQuery<TrackVersionDetail[]>({
    queryKey: ["track-versions-detailed", trackId],
    queryFn: () => fetchTrackVersionsForSelector(trackId),
    enabled: !!trackId,
    staleTime: 30_000,
  });
}
