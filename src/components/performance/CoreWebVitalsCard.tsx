/**
 * Card showing Core Web Vitals summary
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { PerformanceMetric, PERFORMANCE_TARGETS, getMetricStatus } from '@/hooks/usePerformanceMetrics';

interface CoreWebVitalsCardProps {
  metric: PerformanceMetric | null | undefined;
  previousMetric?: PerformanceMetric | null;
  isLoading: boolean;
}

function getChangeIndicator(current: number | null, previous: number | null, isLowerBetter = true) {
  if (!current || !previous) return null;
  
  const diff = current - previous;
  const percentChange = Math.abs((diff / previous) * 100);
  
  if (Math.abs(diff) < 1) {
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  }
  
  const isImproving = isLowerBetter ? diff < 0 : diff > 0;
  
  return isImproving ? (
    <span className="flex items-center text-xs text-green-500">
      <TrendingUp className="h-3 w-3 mr-0.5" />
      {percentChange.toFixed(1)}%
    </span>
  ) : (
    <span className="flex items-center text-xs text-red-500">
      <TrendingDown className="h-3 w-3 mr-0.5" />
      {percentChange.toFixed(1)}%
    </span>
  );
}

function getStatusBadge(status: 'good' | 'needs-improvement' | 'poor') {
  const colors = {
    good: 'bg-green-500/10 text-green-500 border-green-500/20',
    'needs-improvement': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    poor: 'bg-red-500/10 text-red-500 border-red-500/20',
  };
  
  const labels = {
    good: 'Good',
    'needs-improvement': 'Needs Work',
    poor: 'Poor',
  };
  
  return (
    <Badge variant="outline" className={colors[status]}>
      {labels[status]}
    </Badge>
  );
}

export function CoreWebVitalsCard({ metric, previousMetric, isLoading }: CoreWebVitalsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Core Web Vitals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const vitals = [
    {
      name: 'LCP',
      value: metric?.lcp_ms,
      prevValue: previousMetric?.lcp_ms,
      target: PERFORMANCE_TARGETS.lcp,
      unit: 'ms',
      description: 'Largest Contentful Paint',
    },
    {
      name: 'FID',
      value: metric?.fid_ms,
      prevValue: previousMetric?.fid_ms,
      target: PERFORMANCE_TARGETS.fid,
      unit: 'ms',
      description: 'First Input Delay',
    },
    {
      name: 'CLS',
      value: metric?.cls,
      prevValue: previousMetric?.cls,
      target: PERFORMANCE_TARGETS.cls,
      unit: '',
      description: 'Cumulative Layout Shift',
    },
  ];

  const overallStatus = vitals.every(v => 
    getMetricStatus(v.value ?? null, v.target) === 'good'
  ) ? 'good' : vitals.some(v => 
    getMetricStatus(v.value ?? null, v.target) === 'poor'
  ) ? 'poor' : 'needs-improvement';

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Core Web Vitals
          </CardTitle>
          {getStatusBadge(overallStatus)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {vitals.map((vital) => {
          const status = getMetricStatus(vital.value ?? null, vital.target);
          const statusColors = {
            good: 'text-green-500',
            'needs-improvement': 'text-amber-500',
            poor: 'text-red-500',
          };
          
          return (
            <div key={vital.name} className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">{vital.name}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  ({vital.description})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-mono ${statusColors[status]}`}>
                  {vital.value !== null && vital.value !== undefined 
                    ? `${vital.value}${vital.unit}`
                    : '—'
                  }
                </span>
                {getChangeIndicator(vital.value ?? null, vital.prevValue ?? null)}
              </div>
            </div>
          );
        })}
        
        <div className="pt-2 border-t text-xs text-muted-foreground">
          Targets: LCP {'<'} {PERFORMANCE_TARGETS.lcp}ms, FID {'<'} {PERFORMANCE_TARGETS.fid}ms, CLS {'<'} {PERFORMANCE_TARGETS.cls}
        </div>
      </CardContent>
    </Card>
  );
}
