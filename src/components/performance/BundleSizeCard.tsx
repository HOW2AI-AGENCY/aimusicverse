/**
 * Card showing bundle size metrics
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, TrendingUp, TrendingDown } from 'lucide-react';
import { PerformanceMetric, PERFORMANCE_TARGETS, getMetricStatus } from '@/hooks/usePerformanceMetrics';

interface BundleSizeCardProps {
  metric: PerformanceMetric | null | undefined;
  previousMetric?: PerformanceMetric | null;
  isLoading: boolean;
}

export function BundleSizeCard({ metric, previousMetric, isLoading }: BundleSizeCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Package className="h-4 w-4" />
            Bundle Size
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  const bundleSize = metric?.bundle_size_kb ?? null;
  const gzipSize = metric?.bundle_size_gzip_kb ?? null;
  const prevBundleSize = previousMetric?.bundle_size_kb ?? null;
  
  const status = getMetricStatus(bundleSize, PERFORMANCE_TARGETS.bundleSize);
  const progress = bundleSize 
    ? Math.min(100, (bundleSize / PERFORMANCE_TARGETS.bundleSize) * 100)
    : 0;
  
  const sizeDiff = bundleSize && prevBundleSize 
    ? bundleSize - prevBundleSize 
    : 0;

  const statusColors = {
    good: 'bg-green-500/10 text-green-500 border-green-500/20',
    'needs-improvement': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    poor: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  const progressColors = {
    good: '[&>div]:bg-green-500',
    'needs-improvement': '[&>div]:bg-amber-500',
    poor: '[&>div]:bg-red-500',
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Bundle Size
          </CardTitle>
          <Badge variant="outline" className={statusColors[status]}>
            {status === 'good' ? 'On Target' : status === 'needs-improvement' ? 'Over Budget' : 'Critical'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main size display */}
        <div className="flex items-end justify-between">
          <div>
            <span className="text-3xl font-bold">
              {bundleSize !== null ? bundleSize.toFixed(0) : '—'}
            </span>
            <span className="text-lg text-muted-foreground ml-1">KB</span>
          </div>
          
          {sizeDiff !== 0 && (
            <div className={`flex items-center gap-1 text-sm ${sizeDiff < 0 ? 'text-green-500' : 'text-red-500'}`}>
              {sizeDiff < 0 ? (
                <TrendingDown className="h-4 w-4" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}
              {Math.abs(sizeDiff).toFixed(1)} KB
            </div>
          )}
        </div>

        {/* Progress to target */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 KB</span>
            <span>Target: {PERFORMANCE_TARGETS.bundleSize} KB</span>
          </div>
          <Progress 
            value={progress} 
            className={`h-2 ${progressColors[status]}`}
          />
        </div>

        {/* Gzip size */}
        {gzipSize !== null && (
          <div className="flex items-center justify-between text-sm pt-2 border-t">
            <span className="text-muted-foreground">Gzipped</span>
            <span className="font-mono">
              {gzipSize.toFixed(1)} KB
              <span className="text-muted-foreground ml-1">
                / {PERFORMANCE_TARGETS.bundleSizeGzip} KB target
              </span>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
