import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Link2,
  MousePointerClick,
  Users,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  Loader2,
  ExternalLink
} from "lucide-react";
import { useDeeplinkStats, useDeeplinkEvents, type DeeplinkEvent } from "@/hooks/useDeeplinkAnalytics";

export function DeeplinkAnalyticsPanel() {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('7d');
  
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDeeplinkStats(timeRange);
  const { data: events, isLoading: eventsLoading, refetch: refetchEvents } = useDeeplinkEvents({ limit: 50 });

  const refetch = () => {
    refetchStats();
    refetchEvents();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Аналитика диплинков</h2>
          <p className="text-sm text-muted-foreground">Отслеживание переходов в приложение</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
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
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className={`h-4 w-4 ${statsLoading || eventsLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <MousePointerClick className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats?.total_clicks || 0}</div>
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
                <div className="text-2xl font-bold">{stats?.unique_users || 0}</div>
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
            {statsLoading ? (
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
            {statsLoading ? (
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
            {eventsLoading ? "Загрузка..." : `${events?.length || 0} записей`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {eventsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : events && events.length > 0 ? (
              <div className="space-y-2">
                {events.map((event: DeeplinkEvent) => (
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
    </div>
  );
}
