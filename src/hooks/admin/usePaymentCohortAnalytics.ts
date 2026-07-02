/**
 * usePaymentCohortAnalytics — TanStack Query wrapper around the
 * cohort computation in `admin.service`. Re-exports the CohortData type
 * so the component layer never touches the service directly.
 */
import { useQuery } from "@tanstack/react-query";
import { getPaymentCohortAnalytics } from "@/services/admin.service";
import type { CohortData } from "@/services/admin.service";

export type { CohortData };

export function usePaymentCohortAnalytics(months: number = 6) {
  return useQuery<CohortData[]>({
    queryKey: ["cohort-analytics", months],
    queryFn: () => getPaymentCohortAnalytics(months),
    staleTime: 10 * 60 * 1000,
  });
}
