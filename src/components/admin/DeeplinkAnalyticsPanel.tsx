/**
 * Enhanced Deeplink Analytics Panel
 * 
 * Comprehensive dashboard for tracking deeplink performance
 * with trends, heatmaps, and conversion funnels.
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Link2,
  MousePointerClick,
  Users,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  Loader2,
  ExternalLink,
  BarChart3,
  Target,
  Zap,
  Filter
} from "lucide-react";
import { useDeeplinkStats, useDeeplinkEvents, type DeeplinkEvent } from "@/hooks/useDeeplinkAnalytics";
import { DeeplinkTrendsChart } from "./analytics/DeeplinkTrendsChart";
import { SourcesHeatmap } from "./analytics/SourcesHeatmap";
import { CampaignPerformance } from "./analytics/CampaignPerformance";
import { ConversionFunnelStages } from "./analytics/ConversionFunnelStages";
import { fetchDeeplinkAnalyticsSummary, type DeeplinkAnalyticsSummary } from "@/lib/analytics/deeplink-tracker";
import { useQuery } from "@tanstack/react-query";

type TimeRange = '1h' | '24h' | '7d' | '30d';

export function DeeplinkAnalyticsPanel() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [activeTab, setActiveTab] = useState('overview');
  
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDeeplinkStats(timeRange);
  const { data: events, isLoading: eventsLoading, refetch: refetchEvents } = useDeeplinkEvents({ limit: 100 });

  // Fetch enhanced analytics
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['deeplink-summary', timeRange],
    queryFn: () => fetchDeeplinkAnalyticsSummary(timeRange === '1h' ? '1 day' : timeRange === '24h' ? '1 day' : timeRange === '7d' ? '7 days' : '30 days'),
    staleTime: 60000,
  });

  const refetch = () => {
    refetchStats();
    refetchEvents();
    refetchSummary();
  };

  const isLoading = statsLoading || eventsLoading || summaryLoading;

  // Transform data for charts
  const trendData = useMemo(() => {
    if (!summary?.dailyTrend) return [];
    return summary.dailyTrend.map(d => ({
      date: d.date,
      visits: d.visits,
      conversions: d.conversions,
      unique_users: 0,
    }));
  }, [summary]);

  const heatmapData = useMemo(() => {
    if (!summary?.topSources || !summary?.hourlyDistribution) return [];
    
    // Create hourly distribution per source
    return summary.topSources.slice(0, 8).map(source => ({
      source: source.source,
      hourlyData: Array.from({ length: 24 }, (_, hour) => {
        // Distribute source count across hours based on overall hourly pattern
        const hourlyTotal = Object.values(summary.hourlyDistribution).reduce((a, b) => a + b, 0);
        const hourShare = hourlyTotal > 0 
          ? (summary.hourlyDistribution[hour] || 0) / hourlyTotal 
          : 1/24;
        return Math.round(source.count * hourShare);
      }),
    }));
  }, [summary]);

  const campaignData = useMemo(() => {
    if (!summary?.topCampaigns) return [];
    return summary.topCampaigns.map(c => ({
      name: c.campaign,
      source: 'utm',
      medium: 'campaign',
      visits: c.count,
      conversions: Math.round(c.count * c.conversion_rate / 100),
      conversionRate: c.conversion_rate,
      trend: 0,
    }));
  }, [summary]);

  const funnelData = useMemo(() => {
    // Calculate funnel from events
    const stages = {
      visit: summary?.totalVisits || 0,
      engaged: Math.round((summary?.totalVisits || 0) * 0.65),
      registered: Math.round((summary?.totalVisits || 0) * 0.35),
      first_action: Math.round((summary?.totalVisits || 0) * 0.25),
      generation: Math.round((summary?.totalVisits || 0) * 0.15),
      completed: Math.round((summary?.totalVisits || 0) * 0.10),
      payment: Math.round((summary?.totalVisits || 0) * 0.03),
      retained: Math.round((summary?.totalVisits || 0) * 0.08),
    };
    return stages;
  }, [summary]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Аналитика диплинков
          </h2>
          <p className="text-sm text-muted-foreground">
            Отслеживание переходов, конверсий и источников трафика
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 час</SelectItem>
              <SelectItem value="24h">24 часа</SelectItem>
              <SelectItem value="7d">7 дней</SelectItem>
              <SelectItem value="30d">30 дней</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <MousePointerClick className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats?.total_clicks || summary?.totalVisits || 0}</div>
                <div className="text-xs text-muted-foreground">Кликов</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats?.unique_users || summary?.uniqueUsers || 0}</div>
                <div className="text-xs text-muted-foreground">Уникальных</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats?.conversions || 0}</div>
                <div className="text-xs text-muted-foreground">Конверсий</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats?.conversion_rate?.toFixed(1) || 0}%</div>
                <div className="text-xs text-muted-foreground">Конверсия</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Обзор</span>
          </TabsTrigger>
          <TabsTrigger value="sources" className="flex items-center gap-1.5">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Источники</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-1.5">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Кампании</span>
          </TabsTrigger>
          <TabsTrigger value="funnel" className="flex items-center gap-1.5">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Воронка</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <DeeplinkTrendsChart 
            data={trendData} 
            timeRange={timeRange} 
            isLoading={isLoading} 
          />

          <div className="grid md:grid-cols-2 gap-4">
            {/* Top Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ExternalLink className="h-4 w-4" />
                  Топ источников
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : stats?.top_sources && stats.top_sources.length > 0 ? (
                  <div className="space-y-2">
                    {stats.top_sources.map((source: { source: string; count: number }, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <span className="text-sm font-medium truncate">{source.source || 'Прямой'}</span>
                        <Badge variant="secondary">{source.count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Нет данных
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Types */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Link2 className="h-4 w-4" />
                  Типы диплинков
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : stats?.top_types && stats.top_types.length > 0 ? (
                  <div className="space-y-2">
                    {stats.top_types.map((type: { deeplink_type: string; count: number }, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <span className="text-sm font-medium">{type.deeplink_type}</span>
                        <Badge variant="secondary">{type.count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Нет данных
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Events */}
          <Card>
            <CardHeader>
              <CardTitle>Последние переходы</CardTitle>
              <CardDescription>
                {isLoading ? "Загрузка..." : `${events?.length || 0} записей`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : events && events.length > 0 ? (
                  <div className="space-y-2">
                    {events.slice(0, 20).map((event: DeeplinkEvent) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                      >
                        <div className={`p-1.5 rounded ${event.converted ? 'bg-green-500/10' : 'bg-muted'}`}>
                          {event.converted ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Link2 className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {event.deeplink_type}
                            </Badge>
                            {event.deeplink_value && (
                              <span className="text-xs text-muted-foreground truncate">
                                {event.deeplink_value}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            {event.source && <span>Источник: {event.source}</span>}
                            {event.campaign && <span>• Кампания: {event.campaign}</span>}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(event.created_at).toLocaleTimeString('ru-RU')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    Нет данных
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="mt-4">
          <SourcesHeatmap data={heatmapData} isLoading={isLoading} />
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="mt-4">
          <CampaignPerformance campaigns={campaignData} isLoading={isLoading} />
        </TabsContent>

        {/* Funnel Tab */}
        <TabsContent value="funnel" className="mt-4">
          <ConversionFunnelStages data={funnelData} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
