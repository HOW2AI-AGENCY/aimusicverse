/**
 * Shows trend analysis for all performance metrics
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Activity,
  Package,
  Gauge,
  Clock,
  Eye,
  Layout
} from 'lucide-react';
import { 
  PerformanceMetric, 
  PERFORMANCE_TARGETS, 
  calculateTrend 
} from '@/hooks/usePerformanceMetrics';

interface MetricsTrendProps {
  metrics: PerformanceMetric[];
  isLoading: boolean;
}

interface TrendItem {
  name: string;
  icon: typeof Activity;
  key: keyof PerformanceMetric;
  target: number;
  unit: string;
  isLowerBetter: boolean;
}

const trendItems: TrendItem[] = [
  { name: 'Bundle Size', icon: Package, key: 'bundle_size_kb', target: PERFORMANCE_TARGETS.bundleSize, unit: 'KB', isLowerBetter: true },
  { name: 'LCP', icon: Clock, key: 'lcp_ms', target: PERFORMANCE_TARGETS.lcp, unit: 'ms', isLowerBetter: true },
  { name: 'FCP', icon: Eye, key: 'fcp_ms', target: PERFORMANCE_TARGETS.fcp, unit: 'ms', isLowerBetter: true },
  { name: 'CLS', icon: Layout, key: 'cls', target: PERFORMANCE_TARGETS.cls, unit: '', isLowerBetter: true },
  { name: 'TTI', icon: Activity, key: 'tti_ms', target: PERFORMANCE_TARGETS.tti, unit: 'ms', isLowerBetter: true },
  { name: 'TBT', icon: Clock, key: 'tbt_ms', target: PERFORMANCE_TARGETS.tbt, unit: 'ms', isLowerBetter: true },
  { name: 'Performance Score', icon: Gauge, key: 'lighthouse_performance', target: PERFORMANCE_TARGETS.lighthousePerformance, unit: '', isLowerBetter: false },
  { name: 'Accessibility', icon: Gauge, key: 'lighthouse_accessibility', target: PERFORMANCE_TARGETS.lighthouseAccessibility, unit: '', isLowerBetter: false },
];

function getTrendBadge(trend: number, isLowerBetter: boolean) {
  const absTrend = Math.abs(trend);
  const isImproving = trend > 0; // calculateTrend now returns positive for improvement
  
  if (absTrend < 1) {
    return (
      <Badge variant="outline" className="bg-muted/50">
        <Minus className="h-3 w-3 mr-1" />
        Stable
      </Badge>
    );
  }
  
  if (isImproving) {
    return (
      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
        <TrendingUp className="h-3 w-3 mr-1" />
        +{absTrend.toFixed(1)}% Better
      </Badge>
    );
  }
  
  return (
    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
      <TrendingDown className="h-3 w-3 mr-1" />
      {absTrend.toFixed(1)}% Worse
    </Badge>
  );
}

export function MetricsTrend({ metrics, isLoading }: MetricsTrendProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (metrics.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Need at least 2 data points to calculate trends.
            <br />
            <span className="text-sm">Record more metrics to see trend analysis.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Performance Trends
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Comparing recent metrics to older measurements
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trendItems.map((item) => {
            const Icon = item.icon;
            const trend = calculateTrend(metrics, item.key, item.isLowerBetter);
            
            // Get latest and first values
            const latest = metrics[0]?.[item.key];
            const oldest = metrics[metrics.length - 1]?.[item.key];
            
            return (
              <div 
                key={item.key}
                className="flex items-center justify-between p-4 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {oldest !== null && oldest !== undefined ? `${oldest}${item.unit}` : '—'}
                      {' → '}
                      {latest !== null && latest !== undefined ? `${latest}${item.unit}` : '—'}
                    </p>
                  </div>
                </div>
                {getTrendBadge(trend, item.isLowerBetter)}
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 p-4 rounded-lg bg-muted/50">
          <h4 className="font-medium text-sm mb-2">Summary</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-500">
                {trendItems.filter(item => {
                  const trend = calculateTrend(metrics, item.key, item.isLowerBetter);
                  return trend > 1;
                }).length}
              </p>
              <p className="text-xs text-muted-foreground">Improving</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-muted-foreground">
                {trendItems.filter(item => {
                  const trend = calculateTrend(metrics, item.key, item.isLowerBetter);
                  return Math.abs(trend) <= 1;
                }).length}
              </p>
              <p className="text-xs text-muted-foreground">Stable</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">
                {trendItems.filter(item => {
                  const trend = calculateTrend(metrics, item.key, item.isLowerBetter);
                  return trend < -1;
                }).length}
              </p>
              <p className="text-xs text-muted-foreground">Declining</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
