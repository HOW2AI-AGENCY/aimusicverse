/**
 * Telemetry Stats Hook for Admin Dashboard
 * 
 * Fetches aggregated telemetry and error statistics.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TelemetryStats {
  total_events: number;
  unique_sessions: number;
  unique_users: number;
  events_by_type: Record<string, number>;
  top_events: Array<{
    event_name: string;
    count: number;
    avg_duration_ms: number | null;
  }>;
  platform_distribution: Record<string, number>;
  error_summary: Array<{
    error_type: string;
    error_message: string;
    severity: string;
    count: number;
    last_seen: string;
  }>;
  avg_session_duration_sec: number | null;
}

interface ErrorTrends {
  total_errors: number;
  critical_errors: number;
  unique_fingerprints: number;
  errors_by_day: Array<{
    day: string;
    count: number;
    critical: number;
  }>;
  errors_by_type: Record<string, number>;
  errors_by_severity: Record<string, number>;
  top_error_fingerprints: Array<{
    error_fingerprint: string;
    error_type: string;
    error_message: string;
    occurrences: number;
    affected_users: number;
    last_seen: string;
  }>;
}

export function useTelemetryStats(timePeriod: string = '24 hours') {
  return useQuery({
    queryKey: ['telemetry-stats', timePeriod],
    queryFn: async (): Promise<TelemetryStats | null> => {
      const { data, error } = await supabase.rpc('get_telemetry_stats', {
        _time_period: timePeriod,
      });

      if (error) {
        console.error('Failed to fetch telemetry stats:', error);
        return null;
      }

      // RPC returns array, get first row
      const row = Array.isArray(data) ? data[0] : data;
      return row as TelemetryStats;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
}

export function useErrorTrends(timePeriod: string = '7 days') {
  return useQuery({
    queryKey: ['error-trends', timePeriod],
    queryFn: async (): Promise<ErrorTrends | null> => {
      const { data, error } = await supabase.rpc('get_error_trends', {
        _time_period: timePeriod,
      });

      if (error) {
        console.error('Failed to fetch error trends:', error);
        return null;
      }

      const row = Array.isArray(data) ? data[0] : data;
      return row as ErrorTrends;
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // 2 minutes
  });
}
