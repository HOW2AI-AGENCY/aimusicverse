/**
 * Hook for fetching and managing performance metrics from database
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PerformanceMetric {
  id: string;
  recorded_at: string;
  source: string;
  bundle_size_kb: number | null;
  bundle_size_gzip_kb: number | null;
  lcp_ms: number | null;
  fid_ms: number | null;
  cls: number | null;
  fcp_ms: number | null;
  ttfb_ms: number | null;
  tti_ms: number | null;
  tbt_ms: number | null;
  speed_index_ms: number | null;
  lighthouse_performance: number | null;
  lighthouse_accessibility: number | null;
  lighthouse_best_practices: number | null;
  lighthouse_seo: number | null;
  device: string | null;
  connection: string | null;
  url: string | null;
  commit_sha: string | null;
  branch: string | null;
  pr_number: number | null;
  created_at: string;
}

// Performance targets for Web Vitals
export const PERFORMANCE_TARGETS = {
  lcp: 2500,
  fid: 100,
  cls: 0.1,
  fcp: 1800,
  ttfb: 800,
  tti: 3500,
  tbt: 400,
  bundleSize: 950,
  bundleSizeGzip: 300, // Added missing target
  lighthousePerformance: 75,
  lighthouseAccessibility: 90,
  lighthouseBestPractices: 90,
  lighthouseSeo: 90,
};

export type MetricStatus = 'good' | 'needs-improvement' | 'poor';

export function getMetricStatus(value: number | null, target: number, isLowerBetter = true): MetricStatus {
  if (value === null) return 'needs-improvement';
  if (isLowerBetter) {
    if (value <= target) return 'good';
    if (value <= target * 1.5) return 'needs-improvement';
    return 'poor';
  } else {
    if (value >= target) return 'good';
    if (value >= target * 0.7) return 'needs-improvement';
    return 'poor';
  }
}

// Returns a number (percentage) for trend calculation
export function calculateTrend(
  metrics: PerformanceMetric[],
  key: keyof PerformanceMetric,
  isLowerBetter = true
): number {
  if (metrics.length < 2) return 0;
  const latest = metrics[0]?.[key] as number | null;
  const oldest = metrics[metrics.length - 1]?.[key] as number | null;
  if (latest === null || oldest === null || oldest === 0) return 0;
  const change = ((latest - oldest) / oldest) * 100;
  // Return positive for improvement, negative for decline
  return isLowerBetter ? -change : change;
}

export function collectWebVitals(): Partial<PerformanceMetric> {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  return {
    source: 'browser',
    ttfb_ms: navigation?.responseStart ? Math.round(navigation.responseStart) : null,
    fcp_ms: null,
    lcp_ms: null,
    fid_ms: null,
    cls: null,
  };
}

export function usePerformanceMetrics(limit = 100) {
  return useQuery({
    queryKey: ['performance-metrics', limit],
    queryFn: async (): Promise<PerformanceMetric[]> => {
      const { data, error } = await supabase
        .from('performance_metrics')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as PerformanceMetric[];
    },
    staleTime: 60000,
  });
}

export function useLatestPerformanceMetric() {
  return useQuery({
    queryKey: ['latest-performance-metric'],
    queryFn: async (): Promise<PerformanceMetric | null> => {
      const { data, error } = await supabase
        .from('performance_metrics')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as PerformanceMetric;
    },
  });
}

export function useAddPerformanceMetric() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (metric: Partial<PerformanceMetric>) => {
      const { error } = await supabase
        .from('performance_metrics')
        .insert({
          source: metric.source || 'manual',
          recorded_at: new Date().toISOString(),
          ...metric,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['latest-performance-metric'] });
      toast.success('Metric recorded');
    },
    onError: (error) => {
      toast.error(`Failed to record metric: ${error.message}`);
    },
  });
}

export function usePerformanceTrend(key: keyof PerformanceMetric, limit = 30) {
  const { data: metrics } = usePerformanceMetrics(limit);
  
  if (!metrics || metrics.length < 2) {
    return { trend: 0, isPositive: true };
  }

  const trend = calculateTrend(metrics, key);
  return { 
    trend, 
    isPositive: trend > 0 
  };
}
