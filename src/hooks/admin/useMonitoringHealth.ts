/**
 * useMonitoringHealthStatus — lightweight TanStack Query wrapper around the
 * `health-check` edge function. Used by the MonitoringHub and SystemStatusCard
 * for at-a-glance service health and last-updated indicators.
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

/**
 * useSystemHealthStatus — TanStack Query wrapper used by the SystemStatusCard.
 * Returns the raw payload from the `health-check` edge function so the
 * component can shape it into its own UI status fields.
 */
export function useSystemHealthStatus() {
  return useQuery({
    queryKey: ["system-health"],
    queryFn: () => invokeHealthCheck(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
