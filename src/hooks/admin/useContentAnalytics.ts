/**
 * useContentAnalytics — TanStack Query wrapper for the admin
 * analytics/ContentAnalyticsPanel dashboard.
 */
import { useQuery } from "@tanstack/react-query";
import { getContentAnalytics } from "@/services/analytics/content-analytics.service";
import type { ContentAnalyticsStats } from "@/services/analytics/content-analytics.service";

export type { ContentAnalyticsStats };

export function useContentAnalytics(timePeriod: string) {
  return useQuery<ContentAnalyticsStats>({
    queryKey: ["content-analytics", timePeriod],
    queryFn: () => getContentAnalytics(timePeriod),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}
