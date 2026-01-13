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

      // Try to parse error response - it may contain valid health data
      let healthData = data;
      if (error && !data) {
        // Try to extract data from error context if available
        try {
          const errorContext = (error as { context?: { body?: string } }).context;
          if (errorContext?.body) {
            healthData = JSON.parse(errorContext.body) as SystemHealthResponse;
          }
        } catch {
          // If we can't parse, throw the original error
          throw new Error(error.message || 'Health check failed');
        }
      }

      if (!healthData) {
        throw new Error('No health data received');
      }

      // Transform API response to UI format
      const checks = Object.entries(healthData.checks || {}).map(([key, check]) => ({
        name: check.name,
        status: mapStatus(check.status),
        message: check.message || 'OK',
        latency: check.latency_ms,
      }));

      return {
        overall: mapStatus(healthData.overall_status),
        checks,
        metrics: {
          activeGenerations: healthData.metrics?.active_generations ?? 0,
          stuckTasks: healthData.metrics?.stuck_tasks ?? 0,
          failedTracks24h: healthData.metrics?.failed_tracks_24h ?? 0,
          botSuccessRate: healthData.metrics?.bot_success_rate ?? 0,
        },
        lastChecked: new Date(healthData.timestamp),
      };
    },
    refetchInterval: 60000,
    staleTime: 30000,
    retry: 2,
  });
}
