import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HealthAlert {
  id: string;
  overall_status: string;
  alert_type: string;
  unhealthy_services: string[] | null;
  degraded_services: string[] | null;
  metrics: Record<string, unknown> | null;
  created_at: string;
  resolved_at: string | null;
  resolution_note: string | null;
  recipients_count: number | null;
  is_test: boolean | null;
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
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      const { error } = await supabase
        .from('health_alerts')
        .update({
          resolved_at: new Date().toISOString(),
          resolution_note: note || null,
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
    queryKey: ['alert-stats'],
    queryFn: async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const { count: alerts24hCount } = await supabase
        .from('health_alerts')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString())
        .eq('is_test', false);

      const { count: alertsWeekCount } = await supabase
        .from('health_alerts')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', lastWeek.toISOString())
        .eq('is_test', false);

      const { count: unresolvedCount } = await supabase
        .from('health_alerts')
        .select('id', { count: 'exact', head: true })
        .is('resolved_at', null)
        .eq('is_test', false);

      return {
        alerts24h: alerts24hCount ?? 0,
        alertsWeek: alertsWeekCount ?? 0,
        unresolved: unresolvedCount ?? 0,
      };
    },
  });
}
