/**
 * Generation Metrics Dashboard - Sprint 034, Task 034-01
 *
 * Focused on generation success/failure analysis to help reduce the 12% failure rate.
 * Queries generation_tasks table directly for real-time failure diagnostics.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard, StatGrid } from "@/components/admin/StatCard";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  Activity,
  CheckCircle,
  Loader2,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  AlertCircle,
  Timer,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { formatRelative, format } from "@/lib/date-utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TimeRange = "24h" | "7d" | "30d";

interface MetricsSummary {
  totalGenerations: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
  processingCount: number;
  successRate: number;
  avgDurationSeconds: number;
  activeGenerations: number;
}

interface TimeSeriesPoint {
  date: string;
  label: string;
  success: number;
  failed: number;
}

interface ErrorCategory {
  name: string;
  count: number;
}

interface ModelStat {
  model: string;
  total: number;
  success: number;
  failed: number;
  successRate: number;
}

interface FailedGeneration {
  id: string;
  created_at: string;
  user_id: string;
  prompt: string;
  error_message: string | null;
  model_used: string | null;
  completed_at: string | null;
  status: string;
  failure_category: string | null;
  retry_count: number | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIME_RANGES: Array<{ value: TimeRange; label: string }> = [
  { value: "24h", label: "24 часа" },
  { value: "7d", label: "7 дней" },
  { value: "30d", label: "30 дней" },
];

const CHART_COLORS = {
  success: "#22c55e",
  failed: "#ef4444",
};

const PIE_COLORS = ["#ef4444", "#f97316", "#eab308", "#8b5cf6", "#06b6d4", "#ec4899", "#64748b"];

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
};

function getTimeFilterDate(range: TimeRange): string {
  const now = new Date();
  switch (range) {
    case "24h":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  }
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useGenerationMetrics(timeRange: TimeRange) {
  return useQuery({
    queryKey: ["generation-metrics", timeRange],
    queryFn: async (): Promise<{
      summary: MetricsSummary;
      timeSeries: TimeSeriesPoint[];
      errorDistribution: ErrorCategory[];
      modelStats: ModelStat[];
    }> => {
      const since = getTimeFilterDate(timeRange);

      const { data: tasks, error } = await supabase
        .from("generation_tasks")
        .select("id, status, error_message, model_used, created_at, completed_at")
        .gte("created_at", since)
        .order("created_at", { ascending: true });

      if (error) {
        logger.error("Failed to fetch generation metrics", { error });
        throw error;
      }

      const rows = tasks || [];

      let successCount = 0;
      let failedCount = 0;
      let pendingCount = 0;
      let processingCount = 0;
      let totalDurationMs = 0;
      let durationCount = 0;

      rows.forEach((row) => {
        const s = row.status?.toLowerCase();
        if (s === "completed" || s === "success") {
          successCount++;
        } else if (s === "failed" || s === "error") {
          failedCount++;
        } else if (s === "pending") {
          pendingCount++;
        } else if (s === "processing" || s === "in_progress") {
          processingCount++;
        }

        if (row.completed_at && row.created_at) {
          const dur = new Date(row.completed_at).getTime() - new Date(row.created_at).getTime();
          if (dur > 0 && dur < 600_000) {
            totalDurationMs += dur;
            durationCount++;
          }
        }
      });

      const totalGenerations = rows.length;
      const successRate = totalGenerations > 0 ? (successCount / totalGenerations) * 100 : 0;
      const avgDurationSeconds = durationCount > 0 ? totalDurationMs / durationCount / 1000 : 0;

      const summary: MetricsSummary = {
        totalGenerations,
        successCount,
        failedCount,
        pendingCount,
        processingCount,
        successRate,
        avgDurationSeconds,
        activeGenerations: pendingCount + processingCount,
      };

      // Time series grouped by day (or hour for 24h)
      const bucketMap = new Map<string, { success: number; failed: number }>();
      const useHourly = timeRange === "24h";

      rows.forEach((row) => {
        const d = new Date(row.created_at);
        const key = useHourly
          ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}`
          : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

        const bucket = bucketMap.get(key) || { success: 0, failed: 0 };
        const s = row.status?.toLowerCase();
        if (s === "completed" || s === "success") bucket.success++;
        if (s === "failed" || s === "error") bucket.failed++;
        bucketMap.set(key, bucket);
      });

      const timeSeries: TimeSeriesPoint[] = Array.from(bucketMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, val]) => ({
          date: key,
          label: useHourly
            ? `${key.split("T")[1]}:00`
            : new Date(key).toLocaleDateString("ru-RU", { month: "short", day: "numeric" }),
          success: val.success,
          failed: val.failed,
        }));

      // Error distribution
      const errorMap = new Map<string, number>();
      rows.forEach((row) => {
        const s = row.status?.toLowerCase();
        if ((s === "failed" || s === "error") && row.error_message) {
          const category = categorizeError(row.error_message);
          errorMap.set(category, (errorMap.get(category) || 0) + 1);
        }
      });

      const errorDistribution: ErrorCategory[] = Array.from(errorMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 7);

      // Model stats
      const modelMap = new Map<string, { total: number; success: number; failed: number }>();
      rows.forEach((row) => {
        const model = row.model_used || "unknown";
        const entry = modelMap.get(model) || { total: 0, success: 0, failed: 0 };
        entry.total++;
        const s = row.status?.toLowerCase();
        if (s === "completed" || s === "success") entry.success++;
        if (s === "failed" || s === "error") entry.failed++;
        modelMap.set(model, entry);
      });

      const modelStats: ModelStat[] = Array.from(modelMap.entries())
        .map(([model, v]) => ({
          model: model.length > 16 ? model.slice(0, 14) + ".." : model,
          total: v.total,
          success: v.success,
          failed: v.failed,
          successRate: v.total > 0 ? (v.success / v.total) * 100 : 0,
        }))
        .sort((a, b) => b.total - a.total);

      return { summary, timeSeries, errorDistribution, modelStats };
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

function useRecentFailedGenerations() {
  return useQuery({
    queryKey: ["generation-metrics-recent-failures"],
    queryFn: async (): Promise<FailedGeneration[]> => {
      const { data, error } = await supabase
        .from("generation_tasks")
        .select(
          "id, created_at, user_id, prompt, error_message, model_used, completed_at, status, failure_category, retry_count",
        )
        .in("status", ["failed", "error"])
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        logger.error("Failed to fetch recent failures", { error });
        throw error;
      }

      return ((data || []) as unknown) as FailedGeneration[];
    },
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function categorizeError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("timeout") || lower.includes("timed out")) return "Timeout";
  if (lower.includes("rate limit") || lower.includes("429") || lower.includes("too many")) return "Rate Limit";
  if (lower.includes("network") || lower.includes("fetch") || lower.includes("connection")) return "Network";
  if (lower.includes("auth") || lower.includes("401") || lower.includes("403") || lower.includes("unauthorized"))
    return "Auth";
  if (lower.includes("invalid") || lower.includes("validation") || lower.includes("bad request")) return "Validation";
  if (lower.includes("500") || lower.includes("internal") || lower.includes("server")) return "Server Error";
  if (lower.includes("content") || lower.includes("moderation") || lower.includes("policy")) return "Content Policy";
  if (lower.includes("quota") || lower.includes("limit") || lower.includes("credits")) return "Quota";
  return "Other";
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

function getSuccessRateColor(rate: number): string {
  if (rate >= 90) return "text-green-500";
  if (rate >= 80) return "text-yellow-500";
  return "text-red-500";
}

function getSuccessRateVariant(rate: number): "default" | "secondary" | "destructive" {
  if (rate >= 90) return "default";
  if (rate >= 80) return "secondary";
  return "destructive";
}

function truncatePrompt(prompt: string, maxLen: number = 60): string {
  if (prompt.length <= maxLen) return prompt;
  return prompt.slice(0, maxLen) + "...";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GenerationMetrics() {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const { data: metrics, isLoading, refetch, isRefetching } = useGenerationMetrics(timeRange);
  const { data: recentFailures, isLoading: failuresLoading } = useRecentFailedGenerations();

  const summary = metrics?.summary;
  const timeSeries = metrics?.timeSeries || [];
  const errorDistribution = metrics?.errorDistribution || [];
  const modelStats = metrics?.modelStats || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          <h2 className="text-base md:text-xl font-bold flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
            <span className="truncate">Generation Metrics</span>
          </h2>
          <p className="text-[10px] md:text-sm text-muted-foreground">Анализ успешности и ошибок генерации</p>
        </div>
        <div className="flex gap-1.5">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-[100px] md:w-[130px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value} className="text-xs">
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => refetch()}>
            <RefreshCw className={cn("h-3.5 w-3.5", isRefetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-3">
                <Skeleton className="h-14 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <StatGrid columns={4}>
          <StatCard
            title="Генераций"
            value={summary?.totalGenerations?.toLocaleString() || "0"}
            icon={<Activity className="h-4 w-4 text-primary" />}
          />
          <StatCard
            title="Success Rate"
            value={`${(summary?.successRate ?? 0).toFixed(1)}%`}
            icon={<CheckCircle className={cn("h-4 w-4", getSuccessRateColor(summary?.successRate ?? 0))} />}
            variant={
              (summary?.successRate ?? 0) >= 90 ? "success" : (summary?.successRate ?? 0) >= 80 ? "warning" : "error"
            }
          />
          <StatCard
            title="Avg время"
            value={formatDuration(summary?.avgDurationSeconds ?? 0)}
            icon={<Timer className="h-4 w-4 text-purple-500" />}
          />
          <StatCard
            title="Активных"
            value={summary?.activeGenerations ?? 0}
            icon={<Loader2 className="h-4 w-4 text-blue-500" />}
          />
        </StatGrid>
      )}

      {/* Charts Row */}
      <div className="grid gap-3 md:grid-cols-2">
        {/* Success/Failure Over Time */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-xs md:text-sm flex items-center gap-1.5">
              <Activity className="h-4 w-4" />
              Генерации по времени
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-4 pb-3">
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : timeSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={timeSeries}>
                  <XAxis dataKey="label" fontSize={10} tickLine={false} />
                  <YAxis fontSize={10} tickLine={false} width={30} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} iconType="circle" iconSize={8} />
                  <Line
                    type="monotone"
                    dataKey="success"
                    stroke={CHART_COLORS.success}
                    strokeWidth={2}
                    dot={false}
                    name="Успешных"
                  />
                  <Line
                    type="monotone"
                    dataKey="failed"
                    stroke={CHART_COLORS.failed}
                    strokeWidth={2}
                    dot={false}
                    name="Ошибок"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12 text-sm">Нет данных за выбранный период</p>
            )}
          </CardContent>
        </Card>

        {/* Error Distribution */}
        <Card>
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-xs md:text-sm flex items-center gap-1.5">
              <PieChartIcon className="h-4 w-4" />
              Ошибки по категориям
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-4 pb-3">
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : errorDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={errorDistribution}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {errorDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12 text-sm">Нет ошибок</p>
            )}
          </CardContent>
        </Card>

        {/* Generation by Model */}
        <Card>
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-xs md:text-sm flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" />
              По моделям
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-4 pb-3">
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : modelStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={modelStats}>
                  <XAxis dataKey="model" fontSize={9} tickLine={false} />
                  <YAxis fontSize={10} tickLine={false} width={30} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} iconType="circle" iconSize={8} />
                  <Bar
                    dataKey="success"
                    stackId="a"
                    fill={CHART_COLORS.success}
                    name="Успешных"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar dataKey="failed" stackId="a" fill={CHART_COLORS.failed} name="Ошибок" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12 text-sm">Нет данных</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Model Success Rate Detail */}
      {!isLoading && modelStats.length > 0 && (
        <Card>
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-xs md:text-sm">Success Rate по моделям</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="space-y-1.5">
              {modelStats.map((m) => (
                <div key={m.model} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-mono truncate">{m.model}</span>
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 shrink-0">
                      {m.total}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          m.successRate >= 90 ? "bg-green-500" : m.successRate >= 80 ? "bg-yellow-500" : "bg-red-500",
                        )}
                        style={{ width: `${m.successRate}%` }}
                      />
                    </div>
                    <Badge
                      variant={getSuccessRateVariant(m.successRate)}
                      className="text-[10px] h-5 px-1.5 min-w-[42px] text-center"
                    >
                      {m.successRate.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Failed Generations Table */}
      <Card>
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="text-xs md:text-sm flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-red-500" />
            Последние ошибки генерации
            {recentFailures && (
              <Badge variant="destructive" className="text-[10px] h-5 px-1.5 ml-1">
                {recentFailures.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-3">
          {failuresLoading ? (
            <div className="px-3">
              <Skeleton className="h-[200px] w-full" />
            </div>
          ) : recentFailures && recentFailures.length > 0 ? (
            <ScrollArea className="h-[300px] md:h-[400px]">
              {/* Desktop table header */}
              <div className="hidden md:grid grid-cols-[100px_80px_1fr_1fr_80px_70px] gap-2 px-3 py-1.5 text-[10px] font-medium text-muted-foreground border-b">
                <span>Время</span>
                <span>User</span>
                <span>Промпт</span>
                <span>Ошибка</span>
                <span>Модель</span>
                <span>Длит.</span>
              </div>

              <div className="divide-y">
                {recentFailures.map((failure) => {
                  const duration =
                    failure.completed_at && failure.created_at
                      ? (new Date(failure.completed_at).getTime() - new Date(failure.created_at).getTime()) / 1000
                      : null;

                  return (
                    <div key={failure.id}>
                      {/* Desktop row */}
                      <div className="hidden md:grid grid-cols-[100px_80px_1fr_1fr_80px_70px] gap-2 px-3 py-2 hover:bg-muted/50 items-start">
                        <span className="text-[10px] text-muted-foreground">
                          {format(failure.created_at, "DD.MM HH:mm")}
                        </span>
                        <span className="text-[10px] font-mono truncate">{failure.user_id.slice(0, 8)}</span>
                        <span className="text-[10px] truncate" title={failure.prompt}>
                          {truncatePrompt(failure.prompt, 50)}
                        </span>
                        <span className="text-[10px] text-red-400 truncate" title={failure.error_message || ""}>
                          {failure.error_message ? truncatePrompt(failure.error_message, 50) : "N/A"}
                        </span>
                        <Badge variant="outline" className="text-[9px] h-4 px-1 w-fit">
                          {failure.model_used || "N/A"}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {duration !== null ? formatDuration(duration) : "--"}
                        </span>
                      </div>

                      {/* Mobile card */}
                      <div className="md:hidden p-3 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] text-muted-foreground">
                            {formatRelative(failure.created_at)}
                          </span>
                          <Badge variant="outline" className="text-[9px] h-4 px-1">
                            {failure.model_used || "N/A"}
                          </Badge>
                        </div>
                        <p className="text-xs truncate">{truncatePrompt(failure.prompt, 40)}</p>
                        <p className="text-[10px] text-red-400 line-clamp-2">
                          {failure.error_message || "No error message"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-center text-muted-foreground py-8 text-sm">Нет ошибок генерации</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
