/**
 * Analytics Dashboard
 * Main admin dashboard for viewing telemetry and performance metrics
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useTelemetryStats, useErrorTrends } from '@/hooks/admin/useTelemetryStats';
import { useGenerationAnalytics } from '@/hooks/useGenerationAnalytics';
import { TelemetryOverview } from './TelemetryOverview';
import { ErrorTrendsPanel } from './ErrorTrendsPanel';
import { GenerationStatsPanel } from './GenerationStatsPanel';
import { PerformanceMetricsPanel } from './PerformanceMetricsPanel';
import { DeeplinkAnalyticsPanel } from './DeeplinkAnalyticsPanel';
import { ExperimentsPanel } from './ExperimentsPanel';
import { RetentionPanel } from './RetentionPanel';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, AlertTriangle, Music, Gauge, Link2, FlaskConical, Users, Download } from 'lucide-react';
import { exportAnalytics, formatTelemetryForExport } from '@/lib/analytics/exportUtils';
import { toast } from 'sonner';

type TimePeriod = '24 hours' | '7 days' | '30 days' | '90 days';

export function AnalyticsDashboard() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('7 days');
  
  const { data: telemetry, isLoading: telemetryLoading } = useTelemetryStats(timePeriod);
  const { data: errorTrends, isLoading: errorsLoading } = useErrorTrends(timePeriod);
  const { data: generationStats, isLoading: generationLoading } = useGenerationAnalytics(
    timePeriod === '24 hours' ? '7 days' : timePeriod as any
  );

  const isLoading = telemetryLoading || errorsLoading || generationLoading;

  // Map time period to deeplink format
  const deeplinkTimeRange = timePeriod === '24 hours' ? '24h' : 
                           timePeriod === '7 days' ? '7d' : '30d';

  const handleExport = () => {
    if (telemetry) {
      exportAnalytics({
        format: 'csv',
        filename: `analytics_${timePeriod.replace(' ', '_')}_${new Date().toISOString().split('T')[0]}`,
        data: formatTelemetryForExport(telemetry as unknown as Record<string, unknown>),
      });
      toast.success('Данные экспортированы');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Аналитика</h1>
          <p className="text-muted-foreground">Мониторинг телеметрии и производительности</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Экспорт
          </Button>
          
          <Select value={timePeriod} onValueChange={(v) => setTimePeriod(v as TimePeriod)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24 hours">24 часа</SelectItem>
              <SelectItem value="7 days">7 дней</SelectItem>
              <SelectItem value="30 days">30 дней</SelectItem>
              <SelectItem value="90 days">90 дней</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickStatCard
            icon={Activity}
            label="События"
            value={telemetry?.total_events ?? 0}
            subtext={`${telemetry?.unique_sessions ?? 0} сессий`}
            iconColor="text-blue-500"
          />
          <QuickStatCard
            icon={AlertTriangle}
            label="Ошибки"
            value={errorTrends?.total_errors ?? 0}
            subtext={`${errorTrends?.critical_errors ?? 0} критических`}
            iconColor="text-red-500"
          />
          <QuickStatCard
            icon={Music}
            label="Генерации"
            value={generationStats?.total_generations ?? 0}
            subtext={`${generationStats?.successful_generations ?? 0} успешных`}
            iconColor="text-green-500"
          />
          <QuickStatCard
            icon={Gauge}
            label="Avg время генерации"
            value={`${(generationStats?.avg_generation_time_seconds ?? 0).toFixed(1)}с`}
            subtext={`${(generationStats?.total_generation_time_minutes ?? 0).toFixed(0)} мин всего`}
            iconColor="text-purple-500"
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="telemetry" className="space-y-4">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="telemetry" className="gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Телеметрия</span>
          </TabsTrigger>
          <TabsTrigger value="errors" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Ошибки</span>
          </TabsTrigger>
          <TabsTrigger value="generation" className="gap-2">
            <Music className="h-4 w-4" />
            <span className="hidden sm:inline">Генерация</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <Gauge className="h-4 w-4" />
            <span className="hidden sm:inline">Перформанс</span>
          </TabsTrigger>
          <TabsTrigger value="deeplinks" className="gap-2">
            <Link2 className="h-4 w-4" />
            <span className="hidden sm:inline">Диплинки</span>
          </TabsTrigger>
          <TabsTrigger value="retention" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Удержание</span>
          </TabsTrigger>
          <TabsTrigger value="experiments" className="gap-2">
            <FlaskConical className="h-4 w-4" />
            <span className="hidden sm:inline">A/B Тесты</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="telemetry">
          <TelemetryOverview data={telemetry} isLoading={telemetryLoading} />
        </TabsContent>

        <TabsContent value="errors">
          <ErrorTrendsPanel data={errorTrends} isLoading={errorsLoading} />
        </TabsContent>

        <TabsContent value="generation">
          <GenerationStatsPanel data={generationStats} isLoading={generationLoading} />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceMetricsPanel timePeriod={timePeriod} />
        </TabsContent>

        <TabsContent value="deeplinks">
          <DeeplinkAnalyticsPanel timeRange={deeplinkTimeRange as '24h' | '7d' | '30d'} />
        </TabsContent>

        <TabsContent value="retention">
          <RetentionPanel timePeriod={timePeriod} />
        </TabsContent>

        <TabsContent value="experiments">
          <ExperimentsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface QuickStatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  subtext: string;
  iconColor: string;
}

function QuickStatCard({ icon: Icon, label, value, subtext, iconColor }: QuickStatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{typeof value === 'number' ? value.toLocaleString() : value}</p>
            <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
          </div>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </CardContent>
    </Card>
  );
}
