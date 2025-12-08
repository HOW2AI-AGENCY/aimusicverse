import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface HealthCheckResult {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  latency?: number;
}

interface SystemHealth {
  overall: 'healthy' | 'warning' | 'error';
  checks: HealthCheckResult[];
  lastChecked: Date;
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: async (): Promise<SystemHealth> => {
      const checks: HealthCheckResult[] = [];

      // 1. Database connectivity check
      const dbStart = performance.now();
      try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        const dbLatency = performance.now() - dbStart;
        
        checks.push({
          name: 'Database',
          status: error ? 'error' : dbLatency > 1000 ? 'warning' : 'healthy',
          message: error ? error.message : `${Math.round(dbLatency)}ms`,
          latency: dbLatency,
        });
      } catch (err) {
        checks.push({
          name: 'Database',
          status: 'error',
          message: err instanceof Error ? err.message : 'Connection failed',
        });
      }

      // 2. Auth service check
      try {
        const { error } = await supabase.auth.getSession();
        checks.push({
          name: 'Auth Service',
          status: error ? 'error' : 'healthy',
          message: error ? error.message : 'OK',
        });
      } catch (err) {
        checks.push({
          name: 'Auth Service',
          status: 'error',
          message: err instanceof Error ? err.message : 'Connection failed',
        });
      }

      // 3. Storage bucket check
      try {
        const { data, error } = await supabase.storage.getBucket('project-assets');
        checks.push({
          name: 'Storage',
          status: error ? 'error' : 'healthy',
          message: error ? error.message : `Bucket: ${data?.name || 'project-assets'}`,
        });
      } catch (err) {
        checks.push({
          name: 'Storage',
          status: 'error',
          message: err instanceof Error ? err.message : 'Connection failed',
        });
      }

      // 4. Generation tasks check (orphaned/stuck)
      try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count, error } = await supabase
          .from('generation_tasks')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending')
          .lt('created_at', oneHourAgo);
        
        const stuckCount = count || 0;
        checks.push({
          name: 'Generation Tasks',
          status: error ? 'error' : stuckCount > 10 ? 'warning' : 'healthy',
          message: error ? error.message : stuckCount > 0 ? `${stuckCount} stuck tasks` : 'No stuck tasks',
        });
      } catch (err) {
        checks.push({
          name: 'Generation Tasks',
          status: 'error',
          message: err instanceof Error ? err.message : 'Check failed',
        });
      }

      // 5. Failed tracks check
      try {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count, error } = await supabase
          .from('tracks')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'failed')
          .gt('created_at', oneDayAgo);
        
        const failedCount = count || 0;
        checks.push({
          name: 'Failed Tracks (24h)',
          status: error ? 'error' : failedCount > 20 ? 'warning' : 'healthy',
          message: error ? error.message : `${failedCount} failed`,
        });
      } catch (err) {
        checks.push({
          name: 'Failed Tracks',
          status: 'error',
          message: err instanceof Error ? err.message : 'Check failed',
        });
      }

      // 6. Bot metrics check (24h success rate)
      try {
        const { data, error } = await supabase.rpc('get_telegram_bot_metrics', {
          _time_period: '24 hours'
        });
        
        if (error) throw error;
        
        const metrics = data?.[0];
        const successRate = metrics?.success_rate || 0;
        
        checks.push({
          name: 'Telegram Bot',
          status: successRate < 80 ? 'error' : successRate < 95 ? 'warning' : 'healthy',
          message: `${successRate.toFixed(1)}% success rate`,
        });
      } catch (err) {
        checks.push({
          name: 'Telegram Bot',
          status: 'warning',
          message: 'No metrics data',
        });
      }

      // Calculate overall status
      const hasError = checks.some(c => c.status === 'error');
      const hasWarning = checks.some(c => c.status === 'warning');
      
      return {
        overall: hasError ? 'error' : hasWarning ? 'warning' : 'healthy',
        checks,
        lastChecked: new Date(),
      };
    },
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000,
  });
}
