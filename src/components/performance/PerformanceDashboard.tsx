/**
 * Performance Monitoring Dashboard
 * Tracks Core Web Vitals and bundle size over time with charts
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Package, 
  Gauge, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Plus,
  Calendar
} from 'lucide-react';
import { usePerformanceMetrics, useAddPerformanceMetric, collectWebVitals } from '@/hooks/usePerformanceMetrics';
import { CoreWebVitalsCard } from './CoreWebVitalsCard';
import { LighthouseScoresCard } from './LighthouseScoresCard';
import { BundleSizeCard } from './BundleSizeCard';
import { PerformanceChart } from './PerformanceChart';
import { MetricsTrend } from './MetricsTrend';
import { format, subDays } from '@/lib/date-utils';

export function PerformanceDashboard() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const { data: metrics, isLoading, refetch } = usePerformanceMetrics(
    dateRange === '7d' ? 20 : dateRange === '30d' ? 60 : 180
  );
  const addMetric = useAddPerformanceMetric();

  const handleCollectMetrics = async () => {
    const webVitals = collectWebVitals();
    await addMetric.mutateAsync(webVitals);
  };

  const latestMetric = metrics?.[0];
  const previousMetric = metrics?.[1];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Performance Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track Core Web Vitals and bundle size over time
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border bg-muted/50 p-1">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <Button
                key={range}
                variant={dateRange === range ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setDateRange(range)}
                className="px-3"
              >
                {range}
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button
            size="sm"
            onClick={handleCollectMetrics}
            disabled={addMetric.isPending}
          >
            <Plus className="h-4 w-4 mr-1" />
            Collect Now
          </Button>
        </div>
      </div>

      {/* Last Updated */}
      {latestMetric && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          Last recorded: {format(new Date(latestMetric.recorded_at), 'PPp')}
          <Badge variant="outline" className="ml-2">
            {latestMetric.source}
          </Badge>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CoreWebVitalsCard 
          metric={latestMetric} 
          previousMetric={previousMetric}
          isLoading={isLoading} 
        />
        <LighthouseScoresCard 
          metric={latestMetric}
          previousMetric={previousMetric}
          isLoading={isLoading} 
        />
        <BundleSizeCard 
          metric={latestMetric}
          previousMetric={previousMetric}
          isLoading={isLoading} 
        />
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="vitals" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="vitals">Web Vitals</TabsTrigger>
          <TabsTrigger value="lighthouse">Lighthouse</TabsTrigger>
          <TabsTrigger value="bundle">Bundle Size</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="vitals" className="space-y-4">
          <PerformanceChart
            metrics={metrics || []}
            title="Core Web Vitals Over Time"
            fields={[
              { key: 'lcp_ms', label: 'LCP (ms)', color: 'hsl(var(--chart-1))' },
              { key: 'fcp_ms', label: 'FCP (ms)', color: 'hsl(var(--chart-2))' },
              { key: 'tti_ms', label: 'TTI (ms)', color: 'hsl(var(--chart-3))' },
            ]}
            isLoading={isLoading}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PerformanceChart
              metrics={metrics || []}
              title="Cumulative Layout Shift"
              fields={[
                { key: 'cls', label: 'CLS', color: 'hsl(var(--chart-4))' },
              ]}
              targetLine={0.1}
              isLoading={isLoading}
            />
            <PerformanceChart
              metrics={metrics || []}
              title="Total Blocking Time"
              fields={[
                { key: 'tbt_ms', label: 'TBT (ms)', color: 'hsl(var(--chart-5))' },
              ]}
              targetLine={300}
              isLoading={isLoading}
            />
          </div>
        </TabsContent>

        <TabsContent value="lighthouse" className="space-y-4">
          <PerformanceChart
            metrics={metrics || []}
            title="Lighthouse Scores Over Time"
            fields={[
              { key: 'lighthouse_performance', label: 'Performance', color: 'hsl(var(--chart-1))' },
              { key: 'lighthouse_accessibility', label: 'Accessibility', color: 'hsl(var(--chart-2))' },
              { key: 'lighthouse_best_practices', label: 'Best Practices', color: 'hsl(var(--chart-3))' },
              { key: 'lighthouse_seo', label: 'SEO', color: 'hsl(var(--chart-4))' },
            ]}
            targetLine={85}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="bundle" className="space-y-4">
          <PerformanceChart
            metrics={metrics || []}
            title="Bundle Size Over Time"
            fields={[
              { key: 'bundle_size_kb', label: 'Total (KB)', color: 'hsl(var(--chart-1))' },
              { key: 'bundle_size_gzip_kb', label: 'Gzipped (KB)', color: 'hsl(var(--chart-2))' },
            ]}
            targetLine={900}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <MetricsTrend metrics={metrics || []} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
