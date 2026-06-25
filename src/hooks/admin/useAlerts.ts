/**
 * useAlerts - Admin hook for monitoring critical metrics and thresholds
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import { subHours, subDays } from "@/lib/date-utils";

export interface AlertThreshold {
  metric: string;
  operator: "gt" | "lt" | "gte" | "lte";
  value: number;
  severity: "info" | "warning" | "critical";
  name: string;
  description: string;
}

export interface ActiveAlert {
  id: string;
  metric: string;
  currentValue: number;
  threshold: number;
  severity: "info" | "warning" | "critical";
  triggeredAt: Date;
  message: string;
  acknowledged: boolean;
}

// Default thresholds for critical metrics
export const DEFAULT_THRESHOLDS: AlertThreshold[] = [
  {
    metric: "generation_failure_rate",
    operator: "gt",
    value: 15,
    severity: "critical",
    name: "Высокий % ошибок генерации",
    description: "Более 15% генераций завершаются с ошибкой",
  },
  {
    metric: "lcp_ms",
    operator: "gt",
    value: 4000,
    severity: "warning",
    name: "Высокий LCP",
    description: "Largest Contentful Paint превышает 4 секунды",
  },
  {
    metric: "errors_per_hour",
    operator: "gt",
    value: 50,
    severity: "critical",
    name: "Много ошибок в час",
    description: "Более 50 ошибок за последний час",
  },
  {
    metric: "api_latency_ms",
    operator: "gt",
    value: 3000,
    severity: "warning",
    name: "Высокая задержка API",
    description: "Средняя задержка API превышает 3 секунды",
  },
  {
    metric: "suno_credits",
    operator: "lt",
    value: 100,
    severity: "warning",
    name: "Мало кредитов Suno",
    description: "Осталось менее 100 кредитов Suno API",
  },
  {
    metric: "suno_credits",
    operator: "lt",
    value: 20,
    severity: "critical",
    name: "Критически мало кредитов",
    description: "Осталось менее 20 кредитов Suno API",
  },
];

export function useAlerts() {
  const queryClient = useQueryClient();

  // Fetch current metric values
  const { data: currentMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["admin-alert-metrics"],
    queryFn: async () => {
      const now = new Date();
      const hourAgo = subHours(now, 1);
      const dayAgo = subDays(now, 1);

      // Get generation failure rate (last 24h)
      const { data: generations } = await supabase
        .from("generation_tasks")
        .select("status")
        .gte("created_at", dayAgo.toISOString());

      const total = generations?.length || 0;
      const failed = generations?.filter((g) => g.status === "failed").length || 0;
      const generationFailureRate = total > 0 ? (failed / total) * 100 : 0;

      // Get errors per hour
      const { count: errorsPerHour } = await supabase
        .from("error_logs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", hourAgo.toISOString());

      // Get avg LCP
      const { data: perfData } = await supabase
        .from("performance_metrics")
        .select("lcp_ms")
        .gte("recorded_at", dayAgo.toISOString())
        .not("lcp_ms", "is", null);

      const avgLcp = perfData?.length ? perfData.reduce((sum, p) => sum + (p.lcp_ms || 0), 0) / perfData.length : 0;

      // Get avg API latency
      const { data: apiData } = await supabase
        .from("api_usage_logs")
        .select("duration_ms")
        .gte("created_at", hourAgo.toISOString())
        .not("duration_ms", "is", null);

      const avgApiLatency = apiData?.length
        ? apiData.reduce((sum, a) => sum + (a.duration_ms || 0), 0) / apiData.length
        : 0;

      return {
        generation_failure_rate: generationFailureRate,
        lcp_ms: avgLcp,
        errors_per_hour: errorsPerHour || 0,
        api_latency_ms: avgApiLatency,
        suno_credits: 395.9, // TODO: Fetch from suno-credits edge function
      };
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });

  // Check thresholds and generate alerts
  const activeAlerts = useMemo((): ActiveAlert[] => {
    if (!currentMetrics) return [];

    const alerts: ActiveAlert[] = [];

    DEFAULT_THRESHOLDS.forEach((threshold, index) => {
      const value = currentMetrics[threshold.metric as keyof typeof currentMetrics];
      if (value === undefined) return;

      let triggered = false;
      switch (threshold.operator) {
        case "gt":
          triggered = value > threshold.value;
          break;
        case "lt":
          triggered = value < threshold.value;
          break;
        case "gte":
          triggered = value >= threshold.value;
          break;
        case "lte":
          triggered = value <= threshold.value;
          break;
      }

      if (triggered) {
        alerts.push({
          id: `alert-${threshold.metric}-${threshold.severity}-${index}`,
          metric: threshold.metric,
          currentValue: value,
          threshold: threshold.value,
          severity: threshold.severity,
          triggeredAt: new Date(),
          message: `${threshold.name}: ${formatMetricValue(threshold.metric, value)} (порог: ${threshold.value})`,
          acknowledged: false,
        });
      }
    });

    // Sort by severity (critical first)
    return alerts.sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 };
      return order[a.severity] - order[b.severity];
    });
  }, [currentMetrics]);

  // Health status based on alerts
  const healthStatus = useMemo(() => {
    if (!currentMetrics) return "loading";
    if (activeAlerts.some((a) => a.severity === "critical")) return "critical";
    if (activeAlerts.some((a) => a.severity === "warning")) return "warning";
    return "healthy";
  }, [activeAlerts, currentMetrics]);

  return {
    currentMetrics,
    activeAlerts,
    healthStatus,
    isLoading: metricsLoading,
    thresholds: DEFAULT_THRESHOLDS,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["admin-alert-metrics"] }),
  };
}

function formatMetricValue(metric: string, value: number): string {
  switch (metric) {
    case "generation_failure_rate":
      return `${value.toFixed(1)}%`;
    case "lcp_ms":
    case "api_latency_ms":
      return `${Math.round(value)}ms`;
    case "errors_per_hour":
      return `${value} ош/ч`;
    case "suno_credits":
      return `${value.toFixed(1)} кр.`;
    default:
      return String(value);
  }
}

export function useAlertHistory(days: number = 7) {
  return useQuery({
    queryKey: ["admin-alert-history", days],
    queryFn: async () => {
      const since = subDays(new Date(), days);

      const { data, error } = await supabase
        .from("health_alerts")
        .select("*")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
  });
}
