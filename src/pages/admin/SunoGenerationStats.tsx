/**
 * SunoGenerationStats — admin dashboard visualizing daily Suno generation
 * outcomes (success / failure / rate_limit / insufficient_credits / …) split
 * by day and model, sourced from the `suno_generation_stats_daily` view.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "@/lib/icons";
import { Button } from "@/components/ui/button";

type StatsRow = {
  day: string | null;
  outcome: string | null;
  http_status: number | null;
  model_used: string | null;
  event_count: number | null;
  avg_duration_ms: number | null;
  max_retries: number | null;
  fallback_count: number | null;
};

const OUTCOMES = [
  "success",
  "failure",
  "rate_limit",
  "insufficient_credits",
  "validation_error",
  "unauthorized",
  "exception",
] as const;

const OUTCOME_COLORS: Record<string, string> = {
  success: "hsl(142 76% 45%)",
  failure: "hsl(0 84% 60%)",
  rate_limit: "hsl(38 92% 55%)",
  insufficient_credits: "hsl(280 65% 60%)",
  validation_error: "hsl(200 80% 55%)",
  unauthorized: "hsl(340 75% 55%)",
  exception: "hsl(20 90% 55%)",
};

const OUTCOME_LABEL: Record<string, string> = {
  success: "Успех",
  failure: "Ошибка",
  rate_limit: "429",
  insufficient_credits: "402",
  validation_error: "Валидация",
  unauthorized: "Auth",
  exception: "Исключение",
};

const RANGES = [
  { value: "7", label: "7 дней" },
  { value: "14", label: "14 дней" },
  { value: "30", label: "30 дней" },
  { value: "90", label: "90 дней" },
];

function formatDay(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function SunoGenerationStats() {
  const [days, setDays] = useState<string>("14");
  const [modelFilter, setModelFilter] = useState<string>("all");

  const {
    data: rows,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["suno-generation-stats-daily", days],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - Number(days));
      const { data, error } = await supabase
        .from("suno_generation_stats_daily")
        .select("*")
        .gte("day", since.toISOString())
        .order("day", { ascending: true });
      if (error) throw error;
      return (data ?? []) as StatsRow[];
    },
    staleTime: 60_000,
  });

  const models = useMemo(() => {
    const set = new Set<string>();
    (rows ?? []).forEach((r) => r.model_used && set.add(r.model_used));
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(
    () => (rows ?? []).filter((r) => modelFilter === "all" || r.model_used === modelFilter),
    [rows, modelFilter],
  );

  // Trend chart: outcome counts per day
  const trend = useMemo(() => {
    const byDay = new Map<string, Record<string, number> & { day: string }>();
    for (const r of filtered) {
      if (!r.day || !r.outcome) continue;
      const key = r.day.slice(0, 10);
      const bucket =
        byDay.get(key) ??
        ({ day: key, ...Object.fromEntries(OUTCOMES.map((o) => [o, 0])) } as never);
      bucket[r.outcome] = (bucket[r.outcome] ?? 0) + Number(r.event_count ?? 0);
      byDay.set(key, bucket);
    }
    return Array.from(byDay.values()).sort((a, b) => a.day.localeCompare(b.day));
  }, [filtered]);

  // Totals + success rate
  const totals = useMemo(() => {
    const acc: Record<string, number> = {};
    let all = 0;
    for (const r of filtered) {
      const key = r.outcome ?? "unknown";
      const n = Number(r.event_count ?? 0);
      acc[key] = (acc[key] ?? 0) + n;
      all += n;
    }
    const successRate = all > 0 ? ((acc.success ?? 0) / all) * 100 : 0;
    return { acc, all, successRate };
  }, [filtered]);

  // Per-model bar chart (success vs failures)
  const perModel = useMemo(() => {
    const byModel = new Map<string, { model: string; success: number; failure: number; rate_limit: number; insufficient_credits: number }>();
    for (const r of filtered) {
      if (!r.model_used) continue;
      const bucket =
        byModel.get(r.model_used) ??
        { model: r.model_used, success: 0, failure: 0, rate_limit: 0, insufficient_credits: 0 };
      const n = Number(r.event_count ?? 0);
      if (r.outcome === "success") bucket.success += n;
      else if (r.outcome === "rate_limit") bucket.rate_limit += n;
      else if (r.outcome === "insufficient_credits") bucket.insufficient_credits += n;
      else bucket.failure += n;
      byModel.set(r.model_used, bucket);
    }
    return Array.from(byModel.values()).sort((a, b) => b.success + b.failure - (a.success + a.failure));
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Suno: генерации</h2>
          <p className="text-sm text-muted-foreground">
            Тренды успехов, ошибок, 429 и 402 по дням и моделям
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={modelFilter} onValueChange={setModelFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Модель" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все модели</SelectItem>
              {models.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={isFetching ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Всего событий</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{totals.all}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Успех</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-emerald-500">
            {totals.acc.success ?? 0}
            <div className="text-xs text-muted-foreground">
              {totals.successRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Ошибки</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-red-500">
            {(totals.acc.failure ?? 0) + (totals.acc.exception ?? 0)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">429 rate limit</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-amber-500">
            {totals.acc.rate_limit ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">402 credits</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-fuchsia-500">
            {totals.acc.insufficient_credits ?? 0}
          </CardContent>
        </Card>
      </div>

      {/* Trend by day */}
      <Card>
        <CardHeader>
          <CardTitle>Тренд по дням</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          {trend.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Нет данных за выбранный период
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" tickFormatter={formatDay} fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip
                  labelFormatter={(l) => formatDay(String(l))}
                  formatter={(v: unknown, name: unknown) => [v as number, OUTCOME_LABEL[String(name)] ?? String(name)]}
                />
                <Legend formatter={(v) => OUTCOME_LABEL[v] ?? v} />
                {OUTCOMES.map((o) => (
                  <Line
                    key={o}
                    type="monotone"
                    dataKey={o}
                    stroke={OUTCOME_COLORS[o]}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Per-model breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>По моделям</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          {perModel.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Нет данных
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perModel}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="model" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip formatter={(v: unknown, name: unknown) => [v as number, OUTCOME_LABEL[String(name)] ?? String(name)]} />
                <Legend formatter={(v) => OUTCOME_LABEL[v] ?? v} />
                <Bar dataKey="success" stackId="a" fill={OUTCOME_COLORS.success} />
                <Bar dataKey="failure" stackId="a" fill={OUTCOME_COLORS.failure} />
                <Bar dataKey="rate_limit" stackId="a" fill={OUTCOME_COLORS.rate_limit} />
                <Bar dataKey="insufficient_credits" stackId="a" fill={OUTCOME_COLORS.insufficient_credits} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Detail table */}
      <Card>
        <CardHeader>
          <CardTitle>Сырые агрегаты</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">День</th>
                <th className="py-2 pr-4">Модель</th>
                <th className="py-2 pr-4">Исход</th>
                <th className="py-2 pr-4">HTTP</th>
                <th className="py-2 pr-4">Событий</th>
                <th className="py-2 pr-4">Ср. время (мс)</th>
                <th className="py-2 pr-4">Fallback</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map((r, i) => (
                <tr key={i} className="border-t border-border/40">
                  <td className="py-1.5 pr-4">{r.day ? formatDay(r.day) : "—"}</td>
                  <td className="py-1.5 pr-4">{r.model_used ?? "—"}</td>
                  <td className="py-1.5 pr-4">
                    <Badge
                      variant="outline"
                      style={{ borderColor: OUTCOME_COLORS[r.outcome ?? ""] ?? undefined }}
                    >
                      {OUTCOME_LABEL[r.outcome ?? ""] ?? r.outcome}
                    </Badge>
                  </td>
                  <td className="py-1.5 pr-4">{r.http_status ?? "—"}</td>
                  <td className="py-1.5 pr-4">{r.event_count ?? 0}</td>
                  <td className="py-1.5 pr-4">{r.avg_duration_ms ?? "—"}</td>
                  <td className="py-1.5 pr-4">{r.fallback_count ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 200 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Показаны первые 200 строк из {filtered.length}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
