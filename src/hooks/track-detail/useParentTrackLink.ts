/**
 * useParentTrackLink — TanStack Query wrapper for the parent-track link card.
 */
import { useQuery } from "@tanstack/react-query";
import { fetchParentTrackSummary, type ParentTrackSummary } from "@/services/track-detail/track-detail.service";

export type { ParentTrackSummary };

export function useParentTrackLink(parentTrackId: string) {
  return useQuery<ParentTrackSummary | null>({
    queryKey: ["parent-track", parentTrackId],
    queryFn: () => fetchParentTrackSummary(parentTrackId),
    enabled: !!parentTrackId,
    staleTime: 30_000,
  });
}
