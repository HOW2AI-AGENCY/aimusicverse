/**
 * Hook for fetching retention cohorts data
 * Uses the get_retention_cohorts RPC function
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RetentionCohort {
  cohort_date: string;
  cohort_size: number;
  d1_retained: number;
  d7_retained: number;
  d14_retained: number;
  d30_retained: number;
  d1_rate: number;
  d7_rate: number;
  d14_rate: number;
  d30_rate: number;
}

interface UseRetentionCohortsOptions {
  startDate?: Date;
  endDate?: Date;
  enabled?: boolean;
}

export function useRetentionCohorts(options: UseRetentionCohortsOptions = {}) {
  const {
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate = new Date(),
    enabled = true,
  } = options;

  return useQuery({
    queryKey: ['retention-cohorts', startDate.toISOString(), endDate.toISOString()],
    queryFn: async (): Promise<RetentionCohort[]> => {
      const { data, error } = await supabase.rpc('get_retention_cohorts', {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      });

      if (error) {
        console.error('Failed to fetch retention cohorts:', error);
        throw error;
      }

      return (data || []) as RetentionCohort[];
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Calculate average retention rates across all cohorts
 */
export function calculateAverageRetention(cohorts: RetentionCohort[]) {
  if (!cohorts.length) {
    return { d1: 0, d7: 0, d14: 0, d30: 0 };
  }

  const totalCohortSize = cohorts.reduce((sum, c) => sum + c.cohort_size, 0);
  
  // Weighted average by cohort size
  const d1 = cohorts.reduce((sum, c) => sum + (c.d1_rate || 0) * c.cohort_size, 0) / totalCohortSize;
  const d7 = cohorts.reduce((sum, c) => sum + (c.d7_rate || 0) * c.cohort_size, 0) / totalCohortSize;
  const d14 = cohorts.reduce((sum, c) => sum + (c.d14_rate || 0) * c.cohort_size, 0) / totalCohortSize;
  const d30 = cohorts.reduce((sum, c) => sum + (c.d30_rate || 0) * c.cohort_size, 0) / totalCohortSize;

  return {
    d1: Math.round(d1 * 10) / 10,
    d7: Math.round(d7 * 10) / 10,
    d14: Math.round(d14 * 10) / 10,
    d30: Math.round(d30 * 10) / 10,
  };
}
