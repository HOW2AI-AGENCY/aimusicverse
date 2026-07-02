/**
 * useGenerationStats — aggregated, daily, and top-users generation stats
 * used by the admin GenerationStatsPanel.
 */
import { useQuery } from "@tanstack/react-query";
import { getAggregatedGenerationStats, getDailyGenerationStats, getTopGenerationUsers } from "@/services/admin.service";

export function useAggregatedGenerationStats(days: number) {
  return useQuery({
    queryKey: ["admin-generation-stats", days],
    queryFn: () => getAggregatedGenerationStats(days),
    staleTime: 60_000,
  });
}

export function useDailyGenerationStats(days: number) {
  return useQuery({
    queryKey: ["admin-generation-daily", days],
    queryFn: () => getDailyGenerationStats(days),
    staleTime: 60_000,
  });
}

export function useTopGenerationUsers(days: number) {
  return useQuery({
    queryKey: ["admin-generation-top-users", days],
    queryFn: () => getTopGenerationUsers(days),
    staleTime: 60_000,
  });
}

import { getTodayGenerationStats } from "@/services/admin.service";
import type { TodayGenerationStats } from "@/api/admin.api";

export function useTodayGenerationStats() {
  return useQuery<TodayGenerationStats>({
    queryKey: ["monitoring-hub-generations"],
    queryFn: () => getTodayGenerationStats(),
    refetchInterval: 30_000,
    staleTime: 30_000,
  });
}
