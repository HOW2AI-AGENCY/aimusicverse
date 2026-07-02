/**
 * useUserActivityHeatmap — TanStack Query wrapper for the admin
 * analytics/UserActivityHeatmap panel.
 */
import { useQuery } from "@tanstack/react-query";
import { getUserActivityHeatmap } from "@/services/analytics/user-activity-heatmap.service";
import type { HeatmapData } from "@/services/analytics/user-activity-heatmap.service";

export type { HeatmapData };

export function useUserActivityHeatmap(timePeriod: string) {
  return useQuery<HeatmapData>({
    queryKey: ["user-activity-heatmap", timePeriod],
    queryFn: () => getUserActivityHeatmap(timePeriod),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}
