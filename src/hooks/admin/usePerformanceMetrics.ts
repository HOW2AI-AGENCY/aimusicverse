/**
 * usePerformanceMetrics - Hook for collecting and analyzing app performance
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';
import { subDays, format, startOfDay } from '@/lib/date-utils';

export interface CoreWebVitals {
  lcp: number | null; // Largest Contentful Paint (ms)
  fid: number | null; // First Input Delay (ms)
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint (ms)
  ttfb: number | null; // Time to First Byte (ms)
  tti: number | null; // Time to Interactive (ms)
}

export interface PerformanceStats {
  avgLcp: number;
  avgFid: number;
  avgCls: number;
  avgFcp: number;
  avgTtfb: number;
  p75Lcp: number;
  p75Fid: number;
  p75Cls: number;
  goodLcpPercent: number;
  goodFidPercent: number;
  goodClsPercent: number;
  totalSamples: number;
}

export interface BundleStats {
  totalSize: number;
  gzipSize: number;
  largestChunks: Array<{ name: string; size: number }>;
}

export interface DailyPerformance {
  date: string;
  avgLcp: number;
  avgFcp: number;
  samples: number;
}

// Thresholds from Web Vitals
const THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
  fcp: { good: 1800, poor: 3000 },
  ttfb: { good: 800, poor: 1800 },
};

function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

export function usePerformanceMetrics(days: number = 7) {
  const { data: metricsData, isLoading } = useQuery({
    queryKey: ['performance-metrics', days],
    queryFn: async () => {
      const startDate = subDays(new Date(), days);
      
      const { data, error } = await supabase
        .from('performance_metrics')
        .select('*')
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const stats = useMemo((): PerformanceStats => {
    if (!metricsData || metricsData.length === 0) {
      return {
        avgLcp: 0,
        avgFid: 0,
        avgCls: 0,
        avgFcp: 0,
        avgTtfb: 0,
        p75Lcp: 0,
        p75Fid: 0,
        p75Cls: 0,
        goodLcpPercent: 0,
        goodFidPercent: 0,
        goodClsPercent: 0,
        totalSamples: 0,
      };
    }

    const lcpValues = metricsData.filter(m => m.lcp_ms).map(m => m.lcp_ms!);
    const fidValues = metricsData.filter(m => m.fid_ms).map(m => m.fid_ms!);
    const clsValues = metricsData.filter(m => m.cls).map(m => m.cls!);
    const fcpValues = metricsData.filter(m => m.fcp_ms).map(m => m.fcp_ms!);
    const ttfbValues = metricsData.filter(m => m.ttfb_ms).map(m => m.ttfb_ms!);

    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    
    const goodPercent = (values: number[], threshold: number, isLowerBetter = true) => {
      if (values.length === 0) return 0;
      const good = values.filter(v => isLowerBetter ? v <= threshold : v >= threshold);
      return (good.length / values.length) * 100;
    };

    return {
      avgLcp: avg(lcpValues),
      avgFid: avg(fidValues),
      avgCls: avg(clsValues),
      avgFcp: avg(fcpValues),
      avgTtfb: avg(ttfbValues),
      p75Lcp: calculatePercentile(lcpValues, 75),
      p75Fid: calculatePercentile(fidValues, 75),
      p75Cls: calculatePercentile(clsValues, 75),
      goodLcpPercent: goodPercent(lcpValues, THRESHOLDS.lcp.good),
      goodFidPercent: goodPercent(fidValues, THRESHOLDS.fid.good),
      goodClsPercent: goodPercent(clsValues, THRESHOLDS.cls.good),
      totalSamples: metricsData.length,
    };
  }, [metricsData]);

  const dailyTrend = useMemo((): DailyPerformance[] => {
    if (!metricsData) return [];

    const dailyStats = new Map<string, { lcpSum: number; fcpSum: number; count: number }>();

    metricsData.forEach(m => {
      const date = format(startOfDay(new Date(m.recorded_at)), 'yyyy-MM-dd');
      const existing = dailyStats.get(date) || { lcpSum: 0, fcpSum: 0, count: 0 };
      
      if (m.lcp_ms) {
        existing.lcpSum += m.lcp_ms;
        existing.count++;
      }
      if (m.fcp_ms) {
        existing.fcpSum += m.fcp_ms;
      }
      
      dailyStats.set(date, existing);
    });

    return Array.from(dailyStats.entries())
      .map(([date, data]) => ({
        date: format(new Date(date), 'dd.MM'),
        avgLcp: data.count > 0 ? data.lcpSum / data.count : 0,
        avgFcp: data.count > 0 ? data.fcpSum / data.count : 0,
        samples: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [metricsData]);

  const deviceBreakdown = useMemo(() => {
    if (!metricsData) return [];

    const devices = new Map<string, { count: number; avgLcp: number; lcpSum: number }>();

    metricsData.forEach(m => {
      const device = m.device || 'unknown';
      const existing = devices.get(device) || { count: 0, avgLcp: 0, lcpSum: 0 };
      existing.count++;
      if (m.lcp_ms) existing.lcpSum += m.lcp_ms;
      devices.set(device, existing);
    });

    return Array.from(devices.entries())
      .map(([device, data]) => ({
        device,
        count: data.count,
        avgLcp: data.count > 0 ? data.lcpSum / data.count : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [metricsData]);

  // Score calculation (0-100)
  const performanceScore = useMemo(() => {
    if (!stats.totalSamples) return null;
    
    // Weight: LCP 25%, FID 25%, CLS 25%, FCP 15%, TTFB 10%
    const lcpScore = Math.max(0, 100 - (stats.avgLcp / THRESHOLDS.lcp.good) * 50);
    const fidScore = Math.max(0, 100 - (stats.avgFid / THRESHOLDS.fid.good) * 50);
    const clsScore = Math.max(0, 100 - (stats.avgCls / THRESHOLDS.cls.good) * 50);
    const fcpScore = Math.max(0, 100 - (stats.avgFcp / THRESHOLDS.fcp.good) * 50);
    const ttfbScore = Math.max(0, 100 - (stats.avgTtfb / THRESHOLDS.ttfb.good) * 50);

    return Math.round(
      lcpScore * 0.25 + 
      fidScore * 0.25 + 
      clsScore * 0.25 + 
      fcpScore * 0.15 + 
      ttfbScore * 0.10
    );
  }, [stats]);

  return {
    stats,
    dailyTrend,
    deviceBreakdown,
    performanceScore,
    isLoading,
    thresholds: THRESHOLDS,
  };
}
