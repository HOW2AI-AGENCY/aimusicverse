/**
 * ForecastPanel - Revenue and user growth predictions
 * Uses simple linear regression for trend-based forecasting
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Users, DollarSign, Music, Zap, Target } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { useForecast } from "@/hooks/admin/useForecast";

interface ForecastPanelProps {
  timePeriod: string;
}

export function ForecastPanel({ timePeriod }: ForecastPanelProps) {
  const { data, isLoading } = useForecast(timePeriod);

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
                <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number | string) => [v, "Новых"]} />
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
                <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number | string) => [`⭐ ${v}`, "Stars"]} />
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
