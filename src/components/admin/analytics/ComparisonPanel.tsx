/**
 * ComparisonPanel - Compare metrics between current and previous period
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, Users, Music, Zap, DollarSign } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfDay } from "@/lib/date-utils";

interface ComparisonPanelProps {
  timePeriod: string;
}

interface PeriodMetrics {
  users: number;
  newUsers: number;
  tracks: number;
  generations: number;
  successfulGenerations: number;
  revenue: number;
}

export function ComparisonPanel({ timePeriod }: ComparisonPanelProps) {
  const days = timePeriod === "24 hours" ? 1 : timePeriod === "7 days" ? 7 : timePeriod === "30 days" ? 30 : 90;

  const { data, isLoading } = useQuery({
    queryKey: ["period-comparison", days],
    queryFn: async (): Promise<{ current: PeriodMetrics; previous: PeriodMetrics }> => {
      const now = new Date();
      const currentStart = startOfDay(subDays(now, days));
      const previousStart = startOfDay(subDays(now, days * 2));
      const previousEnd = currentStart;

      // Current period metrics
      const [
        { count: currentUsers },
        { count: currentNewUsers },
        { count: currentTracks },
        { data: currentGenerations },
        { data: currentRevenue },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", currentStart.toISOString()),
        supabase
          .from("tracks")
          .select("*", { count: "exact", head: true })
          .gte("created_at", currentStart.toISOString()),
        supabase.from("generation_tasks").select("status").gte("created_at", currentStart.toISOString()),
        supabase
          .from("stars_transactions")
          .select("stars_amount")
          .gte("created_at", currentStart.toISOString())
          .eq("status", "completed"),
      ]);

      // Previous period metrics
      const [{ count: prevNewUsers }, { count: prevTracks }, { data: prevGenerations }, { data: prevRevenue }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .gte("created_at", previousStart.toISOString())
            .lt("created_at", previousEnd.toISOString()),
          supabase
            .from("tracks")
            .select("*", { count: "exact", head: true })
            .gte("created_at", previousStart.toISOString())
            .lt("created_at", previousEnd.toISOString()),
          supabase
            .from("generation_tasks")
            .select("status")
            .gte("created_at", previousStart.toISOString())
            .lt("created_at", previousEnd.toISOString()),
          supabase
            .from("stars_transactions")
            .select("stars_amount")
            .gte("created_at", previousStart.toISOString())
            .lt("created_at", previousEnd.toISOString())
            .eq("status", "completed"),
        ]);

      const sumRevenue = (data: any[] | null) => data?.reduce((sum, t) => sum + (t.stars_amount || 0), 0) || 0;

      return {
        current: {
          users: currentUsers || 0,
          newUsers: currentNewUsers || 0,
          tracks: currentTracks || 0,
          generations: currentGenerations?.length || 0,
          successfulGenerations: currentGenerations?.filter((g) => g.status === "completed").length || 0,
          revenue: sumRevenue(currentRevenue),
        },
        previous: {
          users: 0, // Historical total not relevant for comparison
          newUsers: prevNewUsers || 0,
          tracks: prevTracks || 0,
          generations: prevGenerations?.length || 0,
          successfulGenerations: prevGenerations?.filter((g) => g.status === "completed").length || 0,
          revenue: sumRevenue(prevRevenue),
        },
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base">Сравнение периодов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      label: "Новые пользователи",
      icon: Users,
      current: data?.current.newUsers || 0,
      previous: data?.previous.newUsers || 0,
      format: (v: number) => v.toLocaleString(),
    },
    {
      label: "Треки",
      icon: Music,
      current: data?.current.tracks || 0,
      previous: data?.previous.tracks || 0,
      format: (v: number) => v.toLocaleString(),
    },
    {
      label: "Генерации",
      icon: Zap,
      current: data?.current.generations || 0,
      previous: data?.previous.generations || 0,
      format: (v: number) => v.toLocaleString(),
    },
    {
      label: "Доход (Stars)",
      icon: DollarSign,
      current: data?.current.revenue || 0,
      previous: data?.previous.revenue || 0,
      format: (v: number) => `⭐ ${v.toLocaleString()}`,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          Сравнение периодов
          <Badge variant="outline" className="text-xs font-normal">
            vs предыдущий {days === 1 ? "день" : days === 7 ? "7 дней" : `${days} дней`}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {metrics.map((metric) => {
            const change =
              metric.previous > 0
                ? ((metric.current - metric.previous) / metric.previous) * 100
                : metric.current > 0
                  ? 100
                  : 0;
            const isPositive = change > 0;
            const isNeutral = change === 0;

            return (
              <div key={metric.label} className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-1.5 mb-2">
                  <metric.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground truncate">{metric.label}</span>
                </div>

                <div className="text-lg sm:text-xl font-bold">{metric.format(metric.current)}</div>

                <div
                  className={cn(
                    "flex items-center gap-1 mt-1 text-xs",
                    isPositive && "text-green-500",
                    !isPositive && !isNeutral && "text-red-500",
                    isNeutral && "text-muted-foreground",
                  )}
                >
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : isNeutral ? (
                    <Minus className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>
                    {isPositive && "+"}
                    {change.toFixed(1)}%
                  </span>
                </div>

                <div className="text-[10px] text-muted-foreground mt-0.5">было: {metric.format(metric.previous)}</div>
              </div>
            );
          })}
        </div>

        {/* Success rate comparison */}
        {data && (
          <div className="mt-4 p-3 rounded-lg bg-muted/30 border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Success Rate генераций</span>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {data.current.generations > 0
                      ? ((data.current.successfulGenerations / data.current.generations) * 100).toFixed(1)
                      : 0}
                    %
                  </div>
                  <div className="text-[10px] text-muted-foreground">сейчас</div>
                </div>
                <div className="text-muted-foreground">→</div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    {data.previous.generations > 0
                      ? ((data.previous.successfulGenerations / data.previous.generations) * 100).toFixed(1)
                      : 0}
                    %
                  </div>
                  <div className="text-[10px] text-muted-foreground">было</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
