/**
 * Analytics Dashboard
 * Main admin dashboard for viewing telemetry and performance metrics
 */

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTelemetryStats, useErrorTrends } from "@/hooks/admin/useTelemetryStats";
import { useGenerationAnalytics } from "@/hooks/useGenerationAnalytics";
import { TelemetryOverview } from "./TelemetryOverview";
import { ErrorTrendsPanel } from "./ErrorTrendsPanel";
import { GenerationStatsPanel } from "../GenerationStatsPanel";
import { PerformanceMetricsPanel } from "./PerformanceMetricsPanel";
import { DeeplinkAnalyticsPanel } from "../DeeplinkAnalyticsPanel";
import { ExperimentsPanel } from "./ExperimentsPanel";
import { RetentionPanel } from "./RetentionPanel";
import { RevenueAnalyticsPanel } from "./RevenueAnalyticsPanel";
import { ContentAnalyticsPanel } from "./ContentAnalyticsPanel";
import { UserActivityHeatmap } from "./UserActivityHeatmap";
import { RealTimeMetrics } from "./RealTimeMetrics";
import { ComparisonPanel } from "./ComparisonPanel";
import { AlertsPanel } from "./AlertsPanel";
import { UserJourneyPanel } from "./UserJourneyPanel";
import { ChurnPredictionPanel } from "./ChurnPredictionPanel";
import { ConversionFunnelPanel } from "./ConversionFunnelPanel";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  AlertTriangle,
  Music,
  Gauge,
  Link2,
  FlaskConical,
  Users,
  Download,
  DollarSign,
  BarChart3,
  Clock,
  GitCompare,
  Route,
  TrendingDown,
  Filter,
} from "lucide-react";
import { exportAnalytics, formatTelemetryForExport } from "@/lib/analytics/exportUtils";
import { toast } from "sonner";

type TimePeriod = "24 hours" | "7 days" | "30 days" | "90 days" | "all";

// '100 years' is a valid Postgres interval that effectively means "all time"
const ALL_TIME_INTERVAL = "100 years";

export function AnalyticsDashboard() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("7 days");

  const rpcPeriod = timePeriod === "all" ? ALL_TIME_INTERVAL : timePeriod;

  const { data: telemetry, isLoading: telemetryLoading } = useTelemetryStats(rpcPeriod);
  const { data: errorTrends, isLoading: errorsLoading } = useErrorTrends(rpcPeriod);
  const { data: generationStats, isLoading: generationLoading } = useGenerationAnalytics(
    (timePeriod === "24 hours" ? "7 days" : timePeriod === "all" ? ALL_TIME_INTERVAL : timePeriod) as any,
  );

  const isLoading = telemetryLoading || errorsLoading || generationLoading;

  // Map time period to deeplink format (deeplink panel only supports 24h/7d/30d)
  const deeplinkTimeRange = timePeriod === "24 hours" ? "24h" : timePeriod === "7 days" ? "7d" : "30d";

  const handleExport = () => {
    if (telemetry) {
      exportAnalytics({
        format: "csv",
        filename: `analytics_${timePeriod.replace(" ", "_")}_${new Date().toISOString().split("T")[0]}`,
        data: formatTelemetryForExport(telemetry as unknown as Record<string, unknown>),
      });
      toast.success("Данные экспортированы");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Mobile optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Аналитика</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">Мониторинг телеметрии и производительности</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5 h-8 px-2 sm:px-3">
            <Download className="h-4 w-4" />
            <span className="hidden xs:inline">Экспорт</span>
          </Button>

          <Select value={timePeriod} onValueChange={(v) => setTimePeriod(v as TimePeriod)}>
            <SelectTrigger className="w-[100px] sm:w-[140px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24 hours">24 часа</SelectItem>
              <SelectItem value="7 days">7 дней</SelectItem>
              <SelectItem value="30 days">30 дней</SelectItem>
              <SelectItem value="90 days">90 дней</SelectItem>
              <SelectItem value="all">Всё время</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Alerts Panel */}
      <AlertsPanel />

      {/* Comparison Panel */}
      <ComparisonPanel timePeriod={timePeriod} />

      {/* Real-time Metrics */}
      <RealTimeMetrics />

      {/* Quick Stats - Scrollable on mobile */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-3 sm:p-4">
                <Skeleton className="h-14 sm:h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
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
            subtext={`${errorTrends?.critical_errors ?? 0} крит.`}
            iconColor="text-red-500"
          />
          <QuickStatCard
            icon={Music}
            label="Генерации"
            value={generationStats?.total_generations ?? 0}
            subtext={`${generationStats?.successful_generations ?? 0} ок`}
            iconColor="text-green-500"
          />
          <QuickStatCard
            icon={Gauge}
            label="Avg время"
            value={`${(generationStats?.avg_generation_time_seconds ?? 0).toFixed(1)}с`}
            subtext={`${(generationStats?.total_generation_time_minutes ?? 0).toFixed(0)} мин`}
            iconColor="text-purple-500"
          />
        </div>
      )}

      {/* Tabs - Horizontally scrollable on mobile */}
      <Tabs defaultValue="telemetry" className="space-y-4">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-auto min-w-full sm:w-full sm:flex-wrap gap-1 h-auto p-1">
            <TabsTrigger value="telemetry" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3 py-1.5">
              <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Телеметрия</span>
            </TabsTrigger>
            <TabsTrigger value="errors" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3 py-1.5">
              <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Ошибки</span>
            </TabsTrigger>
            <TabsTrigger value="generation" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3 py-1.5">
              <Music className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Генерация</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3 py-1.5">
              <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Контент</span>
            </TabsTrigger>
            <TabsTrigger value="revenue" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3 py-1.5">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Доходы</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3 py-1.5">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Активность</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3 py-1.5">
              <Gauge className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Перформанс</span>
            </TabsTrigger>
            <TabsTrigger value="deeplinks" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3 py-1.5">
              <Link2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Диплинки</span>
            </TabsTrigger>
            <TabsTrigger value="retention" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3 py-1.5">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Удержание</span>
            </TabsTrigger>
            <TabsTrigger value="experiments" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3 py-1.5">
              <FlaskConical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">A/B</span>
            </TabsTrigger>
            <TabsTrigger value="journey" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3 py-1.5">
              <Route className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Путь</span>
            </TabsTrigger>
            <TabsTrigger value="churn" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3 py-1.5">
              <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Отток</span>
            </TabsTrigger>
            <TabsTrigger value="funnel" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3 py-1.5">
              <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Воронка</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="telemetry">
          <TelemetryOverview data={telemetry} isLoading={telemetryLoading} />
        </TabsContent>

        <TabsContent value="errors">
          <ErrorTrendsPanel data={errorTrends} isLoading={errorsLoading} />
        </TabsContent>

        <TabsContent value="generation">
          <GenerationStatsPanel />
        </TabsContent>

        <TabsContent value="content">
          <ContentAnalyticsPanel timePeriod={timePeriod} />
        </TabsContent>

        <TabsContent value="revenue">
          <RevenueAnalyticsPanel timePeriod={timePeriod} />
        </TabsContent>

        <TabsContent value="activity">
          <UserActivityHeatmap timePeriod={timePeriod} />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceMetricsPanel timePeriod={timePeriod} />
        </TabsContent>

        <TabsContent value="deeplinks">
          <DeeplinkAnalyticsPanel />
        </TabsContent>

        <TabsContent value="retention">
          <RetentionPanel timePeriod={timePeriod} />
        </TabsContent>

        <TabsContent value="experiments">
          <ExperimentsPanel />
        </TabsContent>

        <TabsContent value="journey">
          <UserJourneyPanel timePeriod={timePeriod} />
        </TabsContent>

        <TabsContent value="churn">
          <ChurnPredictionPanel />
        </TabsContent>

        <TabsContent value="funnel">
          <ConversionFunnelPanel timePeriod={timePeriod} />
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
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{label}</p>
            <p className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1 truncate">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">{subtext}</p>
          </div>
          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${iconColor}`} />
        </div>
      </CardContent>
    </Card>
  );
}
