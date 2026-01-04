/**
 * Telemetry Dashboard Component
 * 
 * Displays real-time telemetry and error statistics for admins.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTelemetryStats, useErrorTrends } from '@/hooks/admin/useTelemetryStats';
import { Activity, AlertTriangle, Clock, Monitor, Smartphone, Users } from 'lucide-react';
import { format, ru } from '@/lib/date-utils';

const TIME_PERIODS = [
  { value: '1 hour', label: 'Последний час' },
  { value: '24 hours', label: 'Последние 24 часа' },
  { value: '7 days', label: 'Последние 7 дней' },
  { value: '30 days', label: 'Последние 30 дней' },
];

export function TelemetryDashboard() {
  const [timePeriod, setTimePeriod] = useState('24 hours');
  const { data: telemetry, isLoading: telemetryLoading } = useTelemetryStats(timePeriod);
  const { data: errors, isLoading: errorsLoading } = useErrorTrends(timePeriod);

  const isLoading = telemetryLoading || errorsLoading;

  // Platform icon helper
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'telegram':
        return <Smartphone className="h-4 w-4" />;
      case 'ios':
      case 'android':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  // Severity badge color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Телеметрия и Мониторинг</h2>
          <p className="text-muted-foreground">Аналитика производительности и ошибок</p>
        </div>
        <Select value={timePeriod} onValueChange={setTimePeriod}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Период" />
          </SelectTrigger>
          <SelectContent>
            {TIME_PERIODS.map((period) => (
              <SelectItem key={period.value} value={period.value}>
                {period.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего событий</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : (telemetry?.total_events || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              За {TIME_PERIODS.find(p => p.value === timePeriod)?.label.toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Уникальные сессии</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : (telemetry?.unique_sessions || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {telemetry?.unique_users || 0} уникальных пользователей
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Средняя сессия</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : telemetry?.avg_session_duration_sec 
                ? `${Math.round(telemetry.avg_session_duration_sec / 60)} мин`
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Время в приложении
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ошибки</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {isLoading ? '...' : (errors?.total_errors || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {errors?.critical_errors || 0} критических
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">События</TabsTrigger>
          <TabsTrigger value="errors">Ошибки</TabsTrigger>
          <TabsTrigger value="platforms">Платформы</TabsTrigger>
        </TabsList>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Топ событий</CardTitle>
              <CardDescription>Наиболее частые события за выбранный период</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {telemetry?.top_events?.slice(0, 10).map((event, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground w-6">{i + 1}.</span>
                      <code className="text-sm">{event.event_name}</code>
                    </div>
                    <div className="flex items-center gap-4">
                      {event.avg_duration_ms && (
                        <span className="text-xs text-muted-foreground">
                          ~{Math.round(event.avg_duration_ms)}ms
                        </span>
                      )}
                      <Badge variant="secondary">{event.count}</Badge>
                    </div>
                  </div>
                )) || (
                  <p className="text-muted-foreground">Нет данных</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Последние ошибки</CardTitle>
              <CardDescription>Сгруппированные ошибки по типу</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {errors?.top_error_fingerprints?.map((error, i) => (
                  <div key={i} className="border-b pb-3 last:border-0">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeverityColor(error.error_type) as "default" | "secondary" | "destructive" | "outline"}>
                            {error.error_type}
                          </Badge>
                          <span className="text-sm font-medium">{error.occurrences}×</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {error.error_message}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <div>{error.affected_users} пользов.</div>
                        <div>
                          {format(new Date(error.last_seen), 'dd MMM HH:mm', { locale: ru })}
                        </div>
                      </div>
                    </div>
                  </div>
                )) || (
                  <p className="text-muted-foreground">Нет ошибок за этот период 🎉</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platforms Tab */}
        <TabsContent value="platforms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Распределение по платформам</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {telemetry?.platform_distribution && Object.entries(telemetry.platform_distribution)
                  .sort((a, b) => b[1] - a[1])
                  .map(([platform, count]) => {
                    const total = Object.values(telemetry.platform_distribution).reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                    
                    return (
                      <div key={platform} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getPlatformIcon(platform)}
                          <span className="capitalize">{platform}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-24 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${percentage}%` }} 
                            />
                          </div>
                          <span className="w-12 text-right text-sm">{percentage}%</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      </div>
                    );
                  }) || (
                  <p className="text-muted-foreground">Нет данных</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
