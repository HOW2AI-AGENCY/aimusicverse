/**
 * Hook for fetching conversion funnel analytics
 * Uses the get_funnel_analytics RPC function
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FunnelStep {
  step_name: string;
  step_order: number;
  users_count: number;
  conversion_rate: number;
  dropoff_rate: number;
}

interface UseFunnelAnalyticsOptions {
  startDate?: Date;
  endDate?: Date;
  enabled?: boolean;
}

export function useFunnelAnalytics(options: UseFunnelAnalyticsOptions = {}) {
  const {
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate = new Date(),
    enabled = true,
  } = options;

  return useQuery({
    queryKey: ['funnel-analytics', startDate.toISOString(), endDate.toISOString()],
    queryFn: async (): Promise<FunnelStep[]> => {
      const { data, error } = await supabase.rpc('get_funnel_analytics', {
        p_start_date: startDate.toISOString().split('T')[0],
        p_end_date: endDate.toISOString().split('T')[0],
      });

      if (error) {
        console.error('Failed to fetch funnel analytics:', error);
        throw error;
      }

      return (data || []).map((row: any) => ({
        step_name: row.step_name,
        step_order: Number(row.step_order),
        users_count: Number(row.users_count),
        conversion_rate: Number(row.conversion_rate),
        dropoff_rate: Number(row.dropoff_rate),
      }));
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Calculate overall funnel metrics
 */
export function calculateFunnelMetrics(steps: FunnelStep[]) {
  if (!steps.length) {
    return {
      overallConversion: 0,
      biggestDropoff: null as { step: string; rate: number } | null,
      totalVisitors: 0,
      totalConverted: 0,
    };
  }

  const firstStep = steps[0];
  const lastStep = steps[steps.length - 1];
  
  // Find biggest dropoff
  let biggestDropoff: { step: string; rate: number } | null = null;
  let maxDropRate = 0;
  
  for (const step of steps) {
    if (step.dropoff_rate > maxDropRate) {
      maxDropRate = step.dropoff_rate;
      biggestDropoff = { step: step.step_name, rate: step.dropoff_rate };
    }
  }

  const overallConversion = firstStep.users_count > 0
    ? (lastStep.users_count / firstStep.users_count) * 100
    : 0;

  return {
    overallConversion: Math.round(overallConversion * 100) / 100,
    biggestDropoff,
    totalVisitors: firstStep.users_count,
    totalConverted: lastStep.users_count,
  };
}
