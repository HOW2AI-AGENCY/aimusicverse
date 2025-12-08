import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface HealthCheckResult {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency_ms?: number;
  message?: string;
  last_checked: string;
}

interface SystemHealthResponse {
  overall_status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: HealthCheckResult;
    storage: HealthCheckResult;
    auth: HealthCheckResult;
    edge_functions: HealthCheckResult;
    telegram_bot: HealthCheckResult;
    generation_queue: HealthCheckResult;
  };
  metrics: {
    active_generations: number;
    stuck_tasks: number;
    failed_tracks_24h: number;
    bot_success_rate: number;
  };
}

export interface SystemHealth {
  overall: 'healthy' | 'warning' | 'error';
  checks: Array<{
    name: string;
    status: 'healthy' | 'warning' | 'error';
    message: string;
    latency?: number;
  }>;
  metrics: {
    activeGenerations: number;
    stuckTasks: number;
    failedTracks24h: number;
    botSuccessRate: number;
  };
  lastChecked: Date;
}

// Map API status to UI status
function mapStatus(status: 'healthy' | 'degraded' | 'unhealthy'): 'healthy' | 'warning' | 'error' {
  switch (status) {
    case 'healthy': return 'healthy';
    case 'degraded': return 'warning';
    case 'unhealthy': return 'error';
  }
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: async (): Promise<SystemHealth> => {
      const { data, error } = await supabase.functions.invoke<SystemHealthResponse>('health-check');

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('No health data received');
      }

      // Transform API response to UI format
      const checks = Object.entries(data.checks).map(([key, check]) => ({
        name: check.name,
        status: mapStatus(check.status),
        message: check.message || 'OK',
        latency: check.latency_ms,
      }));

      return {
        overall: mapStatus(data.overall_status),
        checks,
        metrics: {
          activeGenerations: data.metrics.active_generations,
          stuckTasks: data.metrics.stuck_tasks,
          failedTracks24h: data.metrics.failed_tracks_24h,
          botSuccessRate: data.metrics.bot_success_rate,
        },
        lastChecked: new Date(data.timestamp),
      };
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });
}
