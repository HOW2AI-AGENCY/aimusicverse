/**
 * useMonitoringHealthStatus — lightweight TanStack Query wrapper around the
 * `health-check` edge function. Used by the MonitoringHub for at-a-glance
 * service health and last-updated indicators.
 */
import { useQuery } from "@tanstack/react-query";
import { invokeHealthCheck } from "@/services/admin.service";

export function useMonitoringHealthStatus() {
  return useQuery({
    queryKey: ["monitoring-hub-health"],
    queryFn: () => invokeHealthCheck(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
