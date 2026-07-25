/**
 * Performance Metrics Panel
 * Shows Web Vitals and application performance data from real database
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Gauge, Zap, Clock, MousePointer, Move, TrendingUp, TrendingDown, AlertCircle } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { usePerformanceMetrics } from "@/hooks/admin/usePerformanceMetrics";
import { useRecharts } from "@/lib/recharts-lazy";
import type { TooltipValueType } from "recharts";

interface PerformanceMetricsPanelProps {
  timePeriod: string;
}

// Web Vitals thresholds (good/needs-improvement/poor)
const VITALS_CONFIG = {
  LCP: { good: 2500, poor: 4000, unit: "ms", name: "Largest Contentful Paint", icon: Gauge },
  FID: { good: 100, poor: 300, unit: "ms", name: "First Input Delay", icon: MousePointer },
  CLS: { good: 0.1, poor: 0.25, unit: "", name: "Cumulative Layout Shift", icon: Move },
  TTFB: { good: 800, poor: 1800, unit: "ms", name: "Time to First Byte", icon: Clock },
  INP: { good: 200, poor: 500, unit: "ms", name: "Interaction to Next Paint", icon: Zap },
} as const;

export function PerformanceMetricsPanel({ timePeriod }: PerformanceMetricsPanelProps) {
  const days = timePeriod === "24 hours" ? 1 : timePeriod === "7 days" ? 7 : timePeriod === "30 days" ? 30 : 90;
  const { stats, dailyTrend, deviceBreakdown, performanceScore, isLoading, thresholds } = usePerformanceMetrics(days);
  const { recharts, isLoading: rechartsLoading } = useRecharts();

  if (isLoading || rechartsLoading || !recharts) {
    return (
      <div className="space-y-3 sm:space-y-4">
        <div className="grid gap-2 sm:gap-4 grid-cols-2 lg:grid-cols-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-2.5 sm:p-4">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } = recharts;

  // Map stats to vitals format
  const vitals = {
    LCP: { value: stats.avgLcp, samples: stats.totalSamples, p75: stats.p75Lcp, goodPercent: stats.goodLcpPercent },
    FID: { value: stats.avgFid, samples: stats.totalSamples, p75: stats.p75Fid, goodPercent: stats.goodFidPercent },
    CLS: { value: stats.avgCls, samples: stats.totalSamples, p75: stats.p75Cls, goodPercent: stats.goodClsPercent },
    TTFB: { value: stats.avgTtfb, samples: stats.totalSamples, p75: 0, goodPercent: 0 },
    INP: { value: stats.avgFcp, samples: stats.totalSamples, p75: 0, goodPercent: 0 }, // Use FCP as proxy for INP
  };

  const hasData = stats.totalSamples > 0;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Performance Score */}
      {hasData && performanceScore !== null && (
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Performance Score</p>
                <p
                  className={cn(
                    "text-2xl sm:text-3xl font-bold",
                    performanceScore >= 75 && "text-green-500",
                    performanceScore >= 50 && performanceScore < 75 && "text-yellow-500",
                    performanceScore < 50 && "text-red-500",
                  )}
                >
                  {performanceScore}/100
                </p>
              </div>
              <div
                className={cn(
                  "p-3 rounded-full",
                  performanceScore >= 75 && "bg-green-500/10",
                  performanceScore >= 50 && performanceScore < 75 && "bg-yellow-500/10",
                  performanceScore < 50 && "bg-red-500/10",
                )}
              >
                <Gauge
                  className={cn(
                    "h-6 w-6 sm:h-8 sm:w-8",
                    performanceScore >= 75 && "text-green-500",
                    performanceScore >= 50 && performanceScore < 75 && "text-yellow-500",
                    performanceScore < 50 && "text-red-500",
                  )}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              На основе {stats.totalSamples.toLocaleString()} измерений
            </p>
          </CardContent>
        </Card>
      )}

      {/* No data state */}
      {!hasData && (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium">Нет данных о производительности</p>
            <p className="text-xs text-muted-foreground mt-1">
              Метрики Web Vitals начнут поступать после посещения пользователями приложения
            </p>
          </CardContent>
        </Card>
      )}

      {/* Web Vitals Grid */}
      <div className="grid gap-2 sm:gap-4 grid-cols-2 lg:grid-cols-3">
        {Object.entries(VITALS_CONFIG).map(([key, config]) => {
          const vital = vitals[key as keyof typeof vitals];
          const rating = getVitalRating(vital.value, config);
          const Icon = config.icon;

          return (
            <Card key={key}>
              <CardContent className="p-2.5 sm:p-4">
                <div className="flex items-start justify-between gap-1">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div
                      className={cn(
                        "p-1.5 sm:p-2 rounded-lg",
                        rating === "good" && "bg-green-500/10",
                        rating === "needs-improvement" && "bg-yellow-500/10",
                        rating === "poor" && "bg-red-500/10",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-3 w-3 sm:h-4 sm:w-4",
                          rating === "good" && "text-green-500",
                          rating === "needs-improvement" && "text-yellow-500",
                          rating === "poor" && "text-red-500",
                        )}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-xs sm:text-sm">{key}</p>
                      <p className="text-[0.5625rem] sm:text-xs text-muted-foreground truncate hidden xs:block">
                        {config.name}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      rating === "good" ? "default" : rating === "needs-improvement" ? "secondary" : "destructive"
                    }
                    className="text-[0.5625rem] sm:text-xs shrink-0"
                  >
                    {rating === "good" ? "✓" : rating === "needs-improvement" ? "~" : "!"}
                  </Badge>
                </div>

                <div className="mt-2 sm:mt-4">
                  <div className="flex items-baseline gap-0.5 sm:gap-1">
                    <span className="text-lg sm:text-2xl font-bold">{formatVitalValue(vital.value, key)}</span>
                    <span className="text-[0.625rem] sm:text-sm text-muted-foreground">{config.unit}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                    <p className="text-[0.5625rem] sm:text-xs text-muted-foreground">{vital.samples.toLocaleString()} изм.</p>
                    {vital.goodPercent > 0 && (
                      <Badge variant="outline" className="text-[0.5rem] sm:text-[0.625rem] px-1">
                        {vital.goodPercent.toFixed(0)}% хорошо
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="mt-2 sm:mt-3">
                  <VitalProgressBar value={vital.value} threshold={config} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Daily Trend Chart */}
      {dailyTrend.length > 1 && (
        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-sm sm:text-base">Тренд LCP</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={dailyTrend}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{ fontSize: 12 }}
                  formatter={(value: TooltipValueType | undefined) => [`${Math.round(Number(value))}ms`, "LCP"]}
                />
                <Line type="monotone" dataKey="avgLcp" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Device Breakdown */}
      {deviceBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-sm sm:text-base">По устройствам</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {deviceBreakdown.slice(0, 5).map((device) => (
                <div key={device.device} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm capitalize">{device.device}</span>
                    <Badge variant="outline" className="text-[0.625rem]">
                      {device.count}
                    </Badge>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      device.avgLcp <= thresholds.lcp.good && "text-green-500",
                      device.avgLcp > thresholds.lcp.good && device.avgLcp <= thresholds.lcp.poor && "text-yellow-500",
                      device.avgLcp > thresholds.lcp.poor && "text-red-500",
                    )}
                  >
                    {Math.round(device.avgLcp)}ms
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Tips */}
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-sm sm:text-base">Рекомендации</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 sm:space-y-3">
            {getPerformanceTips(vitals).map((tip, i) => (
              <div key={i} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/50">
                <div
                  className={cn(
                    "mt-0.5 p-1 rounded shrink-0",
                    tip.priority === "high" && "bg-red-500/20",
                    tip.priority === "medium" && "bg-yellow-500/20",
                    tip.priority === "low" && "bg-blue-500/20",
                  )}
                >
                  <tip.icon
                    className={cn(
                      "h-3 w-3 sm:h-4 sm:w-4",
                      tip.priority === "high" && "text-red-500",
                      tip.priority === "medium" && "text-yellow-500",
                      tip.priority === "low" && "text-blue-500",
                    )}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium">{tip.title}</p>
                  <p className="text-[0.625rem] sm:text-xs text-muted-foreground mt-0.5">{tip.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getVitalRating(
  value: number,
  threshold: { good: number; poor: number },
): "good" | "needs-improvement" | "poor" {
  if (!value || value === 0) return "needs-improvement";
  if (value <= threshold.good) return "good";
  if (value <= threshold.poor) return "needs-improvement";
  return "poor";
}

function formatVitalValue(value: number, key: string): string {
  if (!value || value === 0) return "-";
  if (key === "CLS") return value.toFixed(3);
  return Math.round(value).toString();
}

function VitalProgressBar({ value, threshold }: { value: number; threshold: { good: number; poor: number } }) {
  // Normalize to percentage (0-100), capped at poor threshold
  const maxValue = threshold.poor * 1.5;
  const percentage = value ? Math.min((value / maxValue) * 100, 100) : 0;
  const goodPercentage = (threshold.good / maxValue) * 100;
  const poorPercentage = (threshold.poor / maxValue) * 100;

  return (
    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
      {/* Good zone */}
      <div className="absolute h-full bg-green-500/30" style={{ width: `${goodPercentage}%` }} />
      {/* Needs improvement zone */}
      <div
        className="absolute h-full bg-yellow-500/30"
        style={{ left: `${goodPercentage}%`, width: `${poorPercentage - goodPercentage}%` }}
      />
      {/* Poor zone */}
      <div className="absolute h-full bg-red-500/30" style={{ left: `${poorPercentage}%`, right: 0 }} />
      {/* Current value indicator */}
      {value > 0 && (
        <div
          className={cn(
            "absolute h-full w-1 rounded",
            value <= threshold.good && "bg-green-500",
            value > threshold.good && value <= threshold.poor && "bg-yellow-500",
            value > threshold.poor && "bg-red-500",
          )}
          style={{ left: `${percentage}%`, transform: "translateX(-50%)" }}
        />
      )}
    </div>
  );
}

interface VitalData {
  value: number;
  samples: number;
  p75?: number;
  goodPercent?: number;
}

function getPerformanceTips(vitals: Record<string, VitalData>) {
  const tips: Array<{
    icon: typeof Gauge;
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
  }> = [];

  const lcp = vitals.LCP?.value || 0;
  const cls = vitals.CLS?.value || 0;
  const ttfb = vitals.TTFB?.value || 0;

  if (lcp > VITALS_CONFIG.LCP.poor) {
    tips.push({
      icon: Gauge,
      title: "Критично: Оптимизируйте LCP",
      description:
        "Используйте preload для критических ресурсов, оптимизируйте изображения и уменьшите время загрузки основного контента",
      priority: "high",
    });
  } else if (lcp > VITALS_CONFIG.LCP.good) {
    tips.push({
      icon: Gauge,
      title: "Улучшите LCP",
      description: "Используйте preload для критических ресурсов и оптимизируйте изображения",
      priority: "medium",
    });
  }

  if (cls > VITALS_CONFIG.CLS.poor) {
    tips.push({
      icon: Move,
      title: "Критично: Уменьшите CLS",
      description:
        "Задайте размеры для изображений и видео, избегайте динамической вставки контента над видимой областью",
      priority: "high",
    });
  } else if (cls > VITALS_CONFIG.CLS.good) {
    tips.push({
      icon: Move,
      title: "Уменьшите CLS",
      description: "Задайте размеры для изображений и избегайте динамической вставки контента",
      priority: "medium",
    });
  }

  if (ttfb > VITALS_CONFIG.TTFB.poor) {
    tips.push({
      icon: Clock,
      title: "Оптимизируйте TTFB",
      description: "Используйте CDN, оптимизируйте серверный код и включите кэширование",
      priority: "high",
    });
  }

  if (tips.length === 0) {
    tips.push({
      icon: TrendingUp,
      title: vitals.LCP?.samples > 0 ? "Производительность отличная!" : "Ожидание данных",
      description:
        vitals.LCP?.samples > 0
          ? "Все Core Web Vitals в зелёной зоне. Продолжайте мониторинг."
          : "После посещений пользователями начнут поступать метрики Web Vitals.",
      priority: "low",
    });
  }

  return tips;
}
