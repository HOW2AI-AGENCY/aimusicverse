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
  url: string | null;
  device: string | null;
  connection: string | null;
  commit_sha: string | null;
  branch: string | null;
  pr_number: number | null;
}

export interface PerformanceMetricInsert {
  source?: string;
  bundle_size_kb?: number;
  bundle_size_gzip_kb?: number;
  lcp_ms?: number;
  fid_ms?: number;
  cls?: number;
  fcp_ms?: number;
  ttfb_ms?: number;
  tti_ms?: number;
  tbt_ms?: number;
  speed_index_ms?: number;
  lighthouse_performance?: number;
  lighthouse_accessibility?: number;
  lighthouse_best_practices?: number;
  lighthouse_seo?: number;
  url?: string;
  device?: string;
  connection?: string;
  commit_sha?: string;
  branch?: string;
  pr_number?: number;
}

// Targets based on Sprint 025 and Web Vitals recommendations
export const PERFORMANCE_TARGETS = {
  bundleSize: 900, // KB
  bundleSizeGzip: 200, // KB
  lcp: 2500, // ms - Good threshold
  fid: 100, // ms - Good threshold
  cls: 0.1, // Good threshold
  fcp: 1800, // ms
  ttfb: 800, // ms
  tti: 3500, // ms
  tbt: 300, // ms
  speedIndex: 3000, // ms
  lighthousePerformance: 85,
  lighthouseAccessibility: 90,
  lighthouseBestPractices: 85,
  lighthouseSeo: 85,
};

export function usePerformanceMetrics(limit: number = 30) {
  return useQuery({
    queryKey: ['performance-metrics', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('performance_metrics')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data as PerformanceMetric[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useLatestPerformanceMetric() {
  return useQuery({
    queryKey: ['performance-metrics', 'latest'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('performance_metrics')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as PerformanceMetric | null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePerformanceMetricsByDateRange(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['performance-metrics', 'range', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('performance_metrics')
        .select('*')
        .gte('recorded_at', startDate.toISOString())
        .lte('recorded_at', endDate.toISOString())
        .order('recorded_at', { ascending: true });
      
      if (error) throw error;
      return data as PerformanceMetric[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddPerformanceMetric() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (metric: PerformanceMetricInsert) => {
      const { data, error } = await supabase
        .from('performance_metrics')
        .insert(metric)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-metrics'] });
      toast.success('Performance metric recorded');
    },
    onError: (error) => {
      toast.error(`Failed to record metric: ${error.message}`);
    },
  });
}

// Collect Real User Metrics from browser
export function collectWebVitals(): Partial<PerformanceMetricInsert> {
  const metrics: Partial<PerformanceMetricInsert> = {
    source: 'rum',
    device: window.innerWidth < 768 ? 'mobile' : 'desktop',
  };

  // Get navigation timing
  const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (navTiming) {
    metrics.ttfb_ms = Math.round(navTiming.responseStart - navTiming.requestStart);
    metrics.fcp_ms = Math.round(navTiming.domContentLoadedEventEnd - navTiming.fetchStart);
  }

  // Get paint timing
  const paintEntries = performance.getEntriesByType('paint');
  const fcpEntry = paintEntries.find(e => e.name === 'first-contentful-paint');
  if (fcpEntry) {
    metrics.fcp_ms = Math.round(fcpEntry.startTime);
  }

  // Get LCP if available (uses PerformanceEntry)
  const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
  if (lcpEntries.length > 0) {
    const lastLcp = lcpEntries[lcpEntries.length - 1];
    metrics.lcp_ms = Math.round(lastLcp.startTime);
  }

  return metrics;
}

// Calculate status based on thresholds
export function getMetricStatus(value: number | null, target: number, isLowerBetter = true): 'good' | 'needs-improvement' | 'poor' {
  if (value === null) return 'needs-improvement';
  
  if (isLowerBetter) {
    if (value <= target) return 'good';
    if (value <= target * 1.5) return 'needs-improvement';
    return 'poor';
  } else {
    if (value >= target) return 'good';
    if (value >= target * 0.8) return 'needs-improvement';
    return 'poor';
  }
}

// Calculate trend (positive = improving)
export function calculateTrend(metrics: PerformanceMetric[], field: keyof PerformanceMetric, isLowerBetter = true): number {
  if (metrics.length < 2) return 0;
  
  const recent = metrics.slice(0, Math.ceil(metrics.length / 2));
  const older = metrics.slice(Math.ceil(metrics.length / 2));
  
  const recentAvg = recent.reduce((sum, m) => sum + (Number(m[field]) || 0), 0) / recent.length;
  const olderAvg = older.reduce((sum, m) => sum + (Number(m[field]) || 0), 0) / older.length;
  
  if (olderAvg === 0) return 0;
  
  const percentChange = ((olderAvg - recentAvg) / olderAvg) * 100;
  return isLowerBetter ? percentChange : -percentChange;
}
