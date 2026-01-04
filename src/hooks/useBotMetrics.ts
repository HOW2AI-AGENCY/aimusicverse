import { useQuery } from "@tanstack/react-query";
import * as adminApi from "@/api/admin.api";
import type { BotMetrics, UserBalanceSummary } from "@/api/admin.api";

export function useBotMetrics(period: string = "24 hours") {
  return useQuery({
    queryKey: ["bot-metrics", period],
    queryFn: () => adminApi.fetchBotMetrics(period),
    refetchInterval: 30000,
  });
}

export function useRecentMetricEvents(limit: number = 50) {
  return useQuery({
    queryKey: ["recent-metric-events", limit],
    queryFn: () => adminApi.fetchRecentBotEvents(limit),
    refetchInterval: 10000,
  });
}

export type { BotMetrics };
