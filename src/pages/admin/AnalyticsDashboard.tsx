import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserBehaviorStats } from '@/hooks/useAnalyticsTracking';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, TrendingUp, Clock, Sparkles, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UserMetrics {
  userId: string;
  username: string;
  firstGeneration?: Date;
  totalGenerations: number;
  lastVisit?: Date;
  daysActive: number;
}

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('7d');
  
  const { data: behaviorStats, isLoading: statsLoading } = useUserBehaviorStats(timeRange);

  // Fetch user metrics - simplified version without RPC
  const { data: userMetrics, isLoading: metricsLoading } = useQuery<UserMetrics[]>({
    queryKey: ['user-metrics', timeRange],
    queryFn: async (): Promise<UserMetrics[]> => {
      const timeAgo = {
        '1h': new Date(Date.now() - 60 * 60 * 1000),
        '24h': new Date(Date.now() - 24 * 60 * 60 * 1000),
        '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      }[timeRange];

      // Query generation tasks to get user generation counts
      const { data, error } = await supabase
        .from('generation_tasks')
        .select('user_id, created_at, status')
        .gte('created_at', timeAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by user
      const userMap = new Map<string, { totalGenerations: number; lastVisit: Date }>();
      data?.forEach((task) => {
        const existing = userMap.get(task.user_id);
        if (existing) {
          existing.totalGenerations++;
          if (new Date(task.created_at) > existing.lastVisit) {
            existing.lastVisit = new Date(task.created_at);
          }
        } else {
          userMap.set(task.user_id, {
            totalGenerations: 1,
            lastVisit: new Date(task.created_at),
          });
        }
      });

      return Array.from(userMap.entries()).map(([userId, data]) => ({
        userId,
        username: userId.slice(0, 8),
        totalGenerations: data.totalGenerations,
        lastVisit: data.lastVisit,
        daysActive: 1,
      }));
    },
    refetchInterval: 60000,
  });

  // Calculate first track generation metrics
  const { data: firstGenStats, isLoading: firstGenLoading } = useQuery({
    queryKey: ['first-generation-stats'],
    queryFn: async () => {
      // Query analytics events for first generations
      const { data, error } = await supabase
        .from('user_analytics_events')
        .select('user_id, metadata, created_at')
        .eq('event_type', 'generation_completed')
        .not('metadata->isFirstGeneration', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Calculate average time to first generation
      const timesToFirstGen: number[] = [];
      const generationsPerDay: Record<string, number> = {};

      data?.forEach((event) => {
        // Count generations per day
        const day = event.created_at.split('T')[0];
        generationsPerDay[day] = (generationsPerDay[day] || 0) + 1;
      });

      return {
        totalFirstGenerations: data?.length || 0,
        averageTimeToFirstGen: timesToFirstGen.length > 0 
          ? Math.round(timesToFirstGen.reduce((a, b) => a + b, 0) / timesToFirstGen.length)
          : null,
        generationsPerDay,
        recentFirstGens: data?.slice(0, 10) || [],
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const formatNumber = (num?: number) => {
    if (num === undefined) return '—';
    return num.toLocaleString('ru-RU');
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '—';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}ч ${minutes}м`;
    return `${minutes}м`;
  };

  const isLoading = statsLoading || metricsLoading || firstGenLoading;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Аналитика пользователей</h1>
          <p className="text-muted-foreground">
            Поведение и активность пользователей платформы
          </p>
        </div>
      </div>

      {/* Time Range Selector */}
      <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="1h">1 час</TabsTrigger>
          <TabsTrigger value="24h">24 часа</TabsTrigger>
          <TabsTrigger value="7d">7 дней</TabsTrigger>
          <TabsTrigger value="30d">30 дней</TabsTrigger>
        </TabsList>

        <TabsContent value={timeRange} className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Всего событий
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {formatNumber(behaviorStats?.total_events)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(behaviorStats?.unique_sessions)} сессий
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Активных пользователей
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {formatNumber(behaviorStats?.unique_users)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      уникальных пользователей
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Первых генераций
                </CardTitle>
                <Sparkles className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {formatNumber(firstGenStats?.totalFirstGenerations)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      новых пользователей создали трек
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Средняя активность
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {behaviorStats?.unique_users && behaviorStats?.total_events
                        ? Math.round(behaviorStats.total_events / behaviorStats.unique_users)
                        : '—'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      событий на пользователя
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Event Types Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Распределение событий</CardTitle>
              <CardDescription>
                Типы активности пользователей
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="space-y-3">
                  {behaviorStats?.events_by_type &&
                    Object.entries(behaviorStats.events_by_type)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 10)
                      .map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{type}</Badge>
                          </div>
                          <span className="text-sm font-medium">
                            {formatNumber(count as number)}
                          </span>
                        </div>
                      ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Pages */}
          <Card>
            <CardHeader>
              <CardTitle>Популярные страницы</CardTitle>
              <CardDescription>
                Самые посещаемые разделы приложения
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {behaviorStats?.top_pages?.map((page, index) => (
                      <div key={page.page_path} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-sm">#{index + 1}</span>
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {page.page_path}
                          </code>
                        </div>
                        <span className="text-sm font-medium">
                          {formatNumber(page.views)} просмотров
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Generations Per Day */}
          <Card>
            <CardHeader>
              <CardTitle>Первые генерации по дням</CardTitle>
              <CardDescription>
                Количество пользователей, создавших первый трек
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="space-y-3">
                  {firstGenStats?.generationsPerDay &&
                    Object.entries(firstGenStats.generationsPerDay)
                      .sort(([a], [b]) => b.localeCompare(a))
                      .slice(0, 14)
                      .map(([date, count]) => (
                        <div key={date} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{date}</span>
                          </div>
                          <Badge>{count} генераций</Badge>
                        </div>
                      ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
