import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BotMetrics {
  total_events: number;
  successful_events: number;
  failed_events: number;
  success_rate: number;
  avg_response_time_ms: number;
  events_by_type: Record<string, number>;
}

export function useBotMetrics(period: string = "24 hours") {
  return useQuery({
    queryKey: ["bot-metrics", period],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_telegram_bot_metrics", {
        _time_period: period,
      });

      if (error) throw error;
      return (data?.[0] as BotMetrics) || null;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useRecentMetricEvents(limit: number = 50) {
  return useQuery({
    queryKey: ["recent-metric-events", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("telegram_bot_metrics")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}
