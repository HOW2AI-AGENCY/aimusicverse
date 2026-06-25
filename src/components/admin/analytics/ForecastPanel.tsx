/**
 * ForecastPanel - Revenue and user growth predictions
 * Uses simple linear regression for trend-based forecasting
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Users, DollarSign, Music, Zap, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format, startOfDay } from "@/lib/date-utils";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";

interface ForecastPanelProps {
  timePeriod: string;
}

interface DailyMetric {
  date: string;
  value: number;
  isForecast?: boolean;
}

interface ForecastData {
  users: DailyMetric[];
  revenue: DailyMetric[];
  generations: DailyMetric[];
  tracks: DailyMetric[];
  predictions: {
    usersNext30: number;
    revenueNext30: number;
    generationsNext30: number;
    tracksNext30: number;
  };
  growth: {
    users: number;
    revenue: number;
    generations: number;
    tracks: number;
  };
}

// Simple linear regression
function linearRegression(data: number[]): { slope: number; intercept: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0] || 0 };

  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope: isNaN(slope) ? 0 : slope, intercept: isNaN(intercept) ? 0 : intercept };
}

// Predict future values
function forecast(data: number[], daysAhead: number): number {
  const { slope, intercept } = linearRegression(data);
  const lastIndex = data.length - 1;
  const predictedDaily = intercept + slope * (lastIndex + daysAhead);
  return Math.max(0, predictedDaily * daysAhead);
}

export function ForecastPanel({ timePeriod }: ForecastPanelProps) {
  const days = timePeriod === "24 hours" ? 7 : timePeriod === "7 days" ? 14 : timePeriod === "30 days" ? 30 : 60;

  const { data, isLoading } = useQuery({
    queryKey: ["forecast-data", days],
    queryFn: async (): Promise<ForecastData> => {
      const now = new Date();
      const startDate = startOfDay(subDays(now, days));

      // Fetch daily user signups
      const { data: users } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      // Fetch daily revenue
      const { data: revenue } = await supabase
        .from("stars_transactions")
        .select("stars_amount, created_at")
        .gte("created_at", startDate.toISOString())
        .eq("status", "completed")
        .order("created_at", { ascending: true });

      // Fetch daily generations
      const { data: generations } = await supabase
        .from("generation_tasks")
        .select("created_at")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      // Fetch daily tracks
      const { data: tracks } = await supabase
        .from("tracks")
        .select("created_at")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      // Aggregate by day
      const aggregateByDay = (items: any[] | null, valueField?: string): DailyMetric[] => {
        const byDay = new Map<string, number>();

        // Initialize all days
        for (let i = 0; i < days; i++) {
          const date = format(subDays(now, days - 1 - i), "yyyy-MM-dd");
          byDay.set(date, 0);
        }

        items?.forEach((item) => {
          const date = format(new Date(item.created_at), "yyyy-MM-dd");
          const value = valueField ? item[valueField] || 0 : 1;
          byDay.set(date, (byDay.get(date) || 0) + value);
        });

        return Array.from(byDay.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, value]) => ({
            date: format(new Date(date), "dd.MM"),
            value,
          }));
      };

      const usersDaily = aggregateByDay(users);
      const revenueDaily = aggregateByDay(revenue, "stars_amount");
      const generationsDaily = aggregateByDay(generations);
      const tracksDaily = aggregateByDay(tracks);

      // Calculate growth rates (comparing halves)
      const calcGrowth = (daily: DailyMetric[]) => {
        const half = Math.floor(daily.length / 2);
        const firstHalf = daily.slice(0, half).reduce((s, d) => s + d.value, 0);
        const secondHalf = daily.slice(half).reduce((s, d) => s + d.value, 0);
        return firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;
      };

      // Forecast next 30 days
      const forecastDays = 30;

      return {
        users: usersDaily,
        revenue: revenueDaily,
        generations: generationsDaily,
        tracks: tracksDaily,
        predictions: {
          usersNext30: forecast(
            usersDaily.map((d) => d.value),
            forecastDays,
          ),
          revenueNext30: forecast(
            revenueDaily.map((d) => d.value),
            forecastDays,
          ),
          generationsNext30: forecast(
            generationsDaily.map((d) => d.value),
            forecastDays,
          ),
          tracksNext30: forecast(
            tracksDaily.map((d) => d.value),
            forecastDays,
          ),
        },
        growth: {
          users: calcGrowth(usersDaily),
          revenue: calcGrowth(revenueDaily),
          generations: calcGrowth(generationsDaily),
          tracks: calcGrowth(tracksDaily),
        },
      };
    },
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base">Прогноз</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const forecasts = [
    {
      label: "Пользователи",
      icon: Users,
      current: data?.users.reduce((s, d) => s + d.value, 0) || 0,
      predicted: Math.round(data?.predictions.usersNext30 || 0),
      growth: data?.growth.users || 0,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Доход (Stars)",
      icon: DollarSign,
      current: data?.revenue.reduce((s, d) => s + d.value, 0) || 0,
      predicted: Math.round(data?.predictions.revenueNext30 || 0),
      growth: data?.growth.revenue || 0,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      format: (v: number) => `⭐ ${v.toLocaleString()}`,
    },
    {
      label: "Генерации",
      icon: Zap,
      current: data?.generations.reduce((s, d) => s + d.value, 0) || 0,
      predicted: Math.round(data?.predictions.generationsNext30 || 0),
      growth: data?.growth.generations || 0,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      label: "Треки",
      icon: Music,
      current: data?.tracks.reduce((s, d) => s + d.value, 0) || 0,
      predicted: Math.round(data?.predictions.tracksNext30 || 0),
      growth: data?.growth.tracks || 0,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Prediction Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {forecasts.map((f) => (
          <Card key={f.label}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("p-1.5 rounded", f.bgColor)}>
                  <f.icon className={cn("h-4 w-4", f.color)} />
                </div>
                <span className="text-xs text-muted-foreground truncate">{f.label}</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold">
                    {f.format ? f.format(f.current) : f.current.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-muted-foreground">сейчас</span>
                </div>

                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    +{f.format ? f.format(f.predicted) : f.predicted.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-muted-foreground">30д</span>
                </div>

                <div
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    f.growth > 0 ? "text-green-500" : f.growth < 0 ? "text-red-500" : "text-muted-foreground",
                  )}
                >
                  {f.growth > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span>
                    {f.growth > 0 ? "+" : ""}
                    {f.growth.toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              Тренд регистраций
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={data?.users || []}>
                <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} width={30} />
                <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: any) => [v, "Новых"]} />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              Тренд дохода
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={data?.revenue || []}>
                <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} width={30} />
                <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: any) => [`⭐ ${v}`, "Stars"]} />
                <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Прогноз на 30 дней</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="text-sm text-muted-foreground">На основе текущих трендов ожидается:</p>
            <ul className="mt-2 space-y-1 text-sm">
              <li className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  +{Math.round(data?.predictions.usersNext30 || 0)}
                </Badge>
                новых пользователей
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  ⭐ {Math.round(data?.predictions.revenueNext30 || 0)}
                </Badge>
                дохода в Stars
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  +{Math.round(data?.predictions.generationsNext30 || 0)}
                </Badge>
                генераций
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  +{Math.round(data?.predictions.tracksNext30 || 0)}
                </Badge>
                новых треков
              </li>
            </ul>
            <p className="text-[10px] text-muted-foreground mt-3">
              * Прогноз основан на линейной регрессии исторических данных
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
