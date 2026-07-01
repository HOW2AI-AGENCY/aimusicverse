/**
 * useSectionReplacementHistory - Loads recent section-replacement history for a track.
 *
 * Returns the most recent section-replacement entries (max 10) for display in
 * the SectionEditorPanel A/B compare overlay.
 */

import { useQuery } from "@tanstack/react-query";
import { fetchSectionReplacementsHistory, type SectionReplacementHistoryEntry } from "@/services/studio.service";
import { queryKeys } from "@/lib/queryKeys";

export function useSectionReplacementHistory(trackId: string) {
  return useQuery<SectionReplacementHistoryEntry[]>({
    queryKey: queryKeys.studio.replacedSections(trackId),
    queryFn: () => fetchSectionReplacementsHistory(trackId),
    staleTime: 30_000,
    enabled: Boolean(trackId),
  });
}
