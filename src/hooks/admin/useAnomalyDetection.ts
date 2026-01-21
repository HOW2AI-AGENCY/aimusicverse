/**
 * useAnomalyDetection - Detects anomalies in key metrics using statistical methods
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';
import { subDays, startOfDay, format } from '@/lib/date-utils';

export type AnomalyType = 'spike' | 'drop' | 'trend' | 'threshold';
export type AnomalySeverity = 'info' | 'warning' | 'critical';

export interface Anomaly {
  id: string;
  metric: string;
  metricLabel: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  value: number;
  expectedValue: number;
  deviation: number; // percentage deviation from expected
  timestamp: string;
  description: string;
}

interface MetricDataPoint {
  date: string;
  value: number;
}

interface MetricConfig {
  key: string;
  label: string;
  thresholds: {
    warning: number;
    critical: number;
  };
  direction: 'higher_bad' | 'lower_bad'; // Which direction indicates a problem
}

// Configuration for metrics to monitor
const METRIC_CONFIGS: MetricConfig[] = [
  {
    key: 'generation_failures',
    label: 'Ошибки генерации',
    thresholds: { warning: 10, critical: 25 },
    direction: 'higher_bad',
  },
  {
    key: 'api_errors',
    label: 'API ошибки',
    thresholds: { warning: 5, critical: 15 },
    direction: 'higher_bad',
  },
  {
    key: 'avg_response_time',
    label: 'Время ответа',
    thresholds: { warning: 2000, critical: 5000 },
    direction: 'higher_bad',
  },
  {
    key: 'active_users',
    label: 'Активных пользователей',
    thresholds: { warning: -30, critical: -50 }, // percentage drop
    direction: 'lower_bad',
  },
  {
    key: 'success_rate',
    label: 'Success Rate',
    thresholds: { warning: 90, critical: 75 },
    direction: 'lower_bad',
  },
];

// Standard deviation calculation
function calculateStdDev(values: number[]): { mean: number; stdDev: number } {
  if (values.length === 0) return { mean: 0, stdDev: 0 };
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  return { mean, stdDev };
}

// Detect anomalies using Z-score method
function detectZScoreAnomalies(
  data: MetricDataPoint[],
  config: MetricConfig,
  zThreshold: number = 2
): Anomaly[] {
  if (data.length < 7) return []; // Need minimum data points
  
  const values = data.map(d => d.value);
  const { mean, stdDev } = calculateStdDev(values);
  
  if (stdDev === 0) return []; // No variance
  
  const anomalies: Anomaly[] = [];
  const latestPoint = data[data.length - 1];
  const zScore = (latestPoint.value - mean) / stdDev;
  
  const isAnomaly = Math.abs(zScore) > zThreshold;
  
  if (isAnomaly) {
    const deviation = ((latestPoint.value - mean) / mean) * 100;
    const isHigherBad = config.direction === 'higher_bad';
    const isProblematic = isHigherBad ? zScore > 0 : zScore < 0;
    
    if (isProblematic) {
      const severity: AnomalySeverity = Math.abs(zScore) > 3 ? 'critical' : 'warning';
      
      anomalies.push({
        id: `${config.key}-${latestPoint.date}`,
        metric: config.key,
        metricLabel: config.label,
        type: zScore > 0 ? 'spike' : 'drop',
        severity,
        value: latestPoint.value,
        expectedValue: mean,
        deviation: Math.abs(deviation),
        timestamp: latestPoint.date,
        description: `${config.label}: ${latestPoint.value.toFixed(1)} (ожидалось ~${mean.toFixed(1)}, отклонение ${Math.abs(deviation).toFixed(0)}%)`,
      });
    }
  }
  
  return anomalies;
}

// Detect threshold violations
function detectThresholdAnomalies(
  data: MetricDataPoint[],
  config: MetricConfig
): Anomaly[] {
  if (data.length === 0) return [];
  
  const latestPoint = data[data.length - 1];
  const anomalies: Anomaly[] = [];
  
  const isHigherBad = config.direction === 'higher_bad';
  const { warning, critical } = config.thresholds;
  
  let severity: AnomalySeverity | null = null;
  
  if (isHigherBad) {
    if (latestPoint.value >= critical) severity = 'critical';
    else if (latestPoint.value >= warning) severity = 'warning';
  } else {
    if (latestPoint.value <= critical) severity = 'critical';
    else if (latestPoint.value <= warning) severity = 'warning';
  }
  
  if (severity) {
    const threshold = severity === 'critical' ? critical : warning;
    anomalies.push({
      id: `threshold-${config.key}-${latestPoint.date}`,
      metric: config.key,
      metricLabel: config.label,
      type: 'threshold',
      severity,
      value: latestPoint.value,
      expectedValue: threshold,
      deviation: Math.abs(((latestPoint.value - threshold) / threshold) * 100),
      timestamp: latestPoint.date,
      description: `${config.label}: ${latestPoint.value.toFixed(1)} (порог: ${threshold})`,
    });
  }
  
  return anomalies;
}

// Detect trend anomalies (consistent increase/decrease)
function detectTrendAnomalies(
  data: MetricDataPoint[],
  config: MetricConfig,
  trendDays: number = 3
): Anomaly[] {
  if (data.length < trendDays) return [];
  
  const recentData = data.slice(-trendDays);
  const anomalies: Anomaly[] = [];
  
  // Check for consistent trend
  let increasingCount = 0;
  let decreasingCount = 0;
  
  for (let i = 1; i < recentData.length; i++) {
    if (recentData[i].value > recentData[i - 1].value) increasingCount++;
    if (recentData[i].value < recentData[i - 1].value) decreasingCount++;
  }
  
  const isConsistentIncrease = increasingCount === trendDays - 1;
  const isConsistentDecrease = decreasingCount === trendDays - 1;
  
  if (isConsistentIncrease || isConsistentDecrease) {
    const startValue = recentData[0].value;
    const endValue = recentData[recentData.length - 1].value;
    const change = ((endValue - startValue) / (startValue || 1)) * 100;
    
    const isHigherBad = config.direction === 'higher_bad';
    const isProblematic = isHigherBad ? isConsistentIncrease : isConsistentDecrease;
    
    if (isProblematic && Math.abs(change) > 15) {
      anomalies.push({
        id: `trend-${config.key}`,
        metric: config.key,
        metricLabel: config.label,
        type: 'trend',
        severity: Math.abs(change) > 30 ? 'warning' : 'info',
        value: endValue,
        expectedValue: startValue,
        deviation: Math.abs(change),
        timestamp: recentData[recentData.length - 1].date,
        description: `${config.label}: ${isConsistentIncrease ? 'рост' : 'падение'} ${trendDays} дня подряд (${change > 0 ? '+' : ''}${change.toFixed(0)}%)`,
      });
    }
  }
  
  return anomalies;
}

export function useAnomalyDetection(days: number = 14) {
  // Fetch generation failures
  const { data: generationData } = useQuery({
    queryKey: ['anomaly-generation-failures', days],
    queryFn: async () => {
      const startDate = subDays(new Date(), days);
      const { data, error } = await supabase
        .from('generation_tasks')
        .select('created_at, status')
        .gte('created_at', startDate.toISOString());
      
      if (error) throw error;
      
      // Aggregate by day
      const dailyStats = new Map<string, { total: number; failed: number }>();
      
      data?.forEach(task => {
        const date = format(startOfDay(new Date(task.created_at)), 'yyyy-MM-dd');
        const stats = dailyStats.get(date) || { total: 0, failed: 0 };
        stats.total++;
        if (task.status === 'failed') stats.failed++;
        dailyStats.set(date, stats);
      });
      
      return Array.from(dailyStats.entries())
        .map(([date, stats]) => ({
          date,
          value: stats.total > 0 ? (stats.failed / stats.total) * 100 : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch API errors
  const { data: apiErrorData } = useQuery({
    queryKey: ['anomaly-api-errors', days],
    queryFn: async () => {
      const startDate = subDays(new Date(), days);
      const { data, error } = await supabase
        .from('api_usage_logs')
        .select('created_at, response_status')
        .gte('created_at', startDate.toISOString());
      
      if (error) throw error;
      
      const dailyStats = new Map<string, { total: number; errors: number }>();
      
      data?.forEach(log => {
        const date = format(startOfDay(new Date(log.created_at!)), 'yyyy-MM-dd');
        const stats = dailyStats.get(date) || { total: 0, errors: 0 };
        stats.total++;
        if (log.response_status && log.response_status >= 400) stats.errors++;
        dailyStats.set(date, stats);
      });
      
      return Array.from(dailyStats.entries())
        .map(([date, stats]) => ({
          date,
          value: stats.total > 0 ? (stats.errors / stats.total) * 100 : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch active users based on tracks created
  const { data: activeUsersData } = useQuery({
    queryKey: ['anomaly-active-users', days],
    queryFn: async () => {
      const startDate = subDays(new Date(), days);
      const { data, error } = await supabase
        .from('tracks')
        .select('created_at, user_id')
        .gte('created_at', startDate.toISOString());
      
      if (error) throw error;
      
      // Count unique users per day
      const dailyStats = new Map<string, Set<string>>();
      
      data?.forEach(track => {
        if (track.created_at) {
          const date = format(startOfDay(new Date(track.created_at)), 'yyyy-MM-dd');
          if (!dailyStats.has(date)) dailyStats.set(date, new Set());
          dailyStats.get(date)!.add(track.user_id);
        }
      });
      
      return Array.from(dailyStats.entries())
        .map(([date, users]) => ({
          date,
          value: users.size,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    staleTime: 5 * 60 * 1000,
  });

  // Detect anomalies
  const anomalies = useMemo(() => {
    const allAnomalies: Anomaly[] = [];
    
    const metricDataMap: Record<string, MetricDataPoint[]> = {
      generation_failures: generationData || [],
      api_errors: apiErrorData || [],
      active_users: activeUsersData || [],
    };
    
    METRIC_CONFIGS.forEach(config => {
      const data = metricDataMap[config.key];
      if (!data || data.length === 0) return;
      
      // Z-score anomalies
      allAnomalies.push(...detectZScoreAnomalies(data, config));
      
      // Threshold anomalies
      allAnomalies.push(...detectThresholdAnomalies(data, config));
      
      // Trend anomalies
      allAnomalies.push(...detectTrendAnomalies(data, config));
    });
    
    // Sort by severity then timestamp
    const severityOrder: Record<AnomalySeverity, number> = {
      critical: 0,
      warning: 1,
      info: 2,
    };
    
    return allAnomalies.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.timestamp.localeCompare(a.timestamp);
    });
  }, [generationData, apiErrorData, activeUsersData]);

  const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
  const warningCount = anomalies.filter(a => a.severity === 'warning').length;
  
  return {
    anomalies,
    criticalCount,
    warningCount,
    hasAnomalies: anomalies.length > 0,
    hasCritical: criticalCount > 0,
  };
}
