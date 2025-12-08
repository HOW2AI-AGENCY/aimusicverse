import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HealthAlert {
  id: string;
  created_at: string;
  overall_status: string;
  alert_type: string;
  unhealthy_services: string[];
  degraded_services: string[];
  metrics: Record<string, number>;
  recipients_count: number;
  resolved_at: string | null;
  resolution_note: string | null;
  is_test: boolean;
}

export function useHealthAlerts(limit = 50) {
  return useQuery({
    queryKey: ['health-alerts', limit],
    queryFn: async (): Promise<HealthAlert[]> => {
      const { data, error } = await supabase
        .from('health_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as HealthAlert[];
    },
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      const { error } = await supabase
        .from('health_alerts')
        .update({
          resolved_at: new Date().toISOString(),
          resolution_note: note,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-alerts'] });
    },
  });
}

export function useAlertStats() {
  return useQuery({
    queryKey: ['health-alert-stats'],
    queryFn: async () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Get alerts in last 24h
      const { count: alerts24h } = await supabase
        .from('health_alerts')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', oneDayAgo)
        .eq('is_test', false);

      // Get alerts in last week
      const { count: alertsWeek } = await supabase
        .from('health_alerts')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', oneWeekAgo)
        .eq('is_test', false);

      // Get unresolved alerts
      const { count: unresolved } = await supabase
        .from('health_alerts')
        .select('id', { count: 'exact', head: true })
        .is('resolved_at', null)
        .eq('is_test', false);

      return {
        alerts24h: alerts24h || 0,
        alertsWeek: alertsWeek || 0,
        unresolved: unresolved || 0,
      };
    },
  });
}
