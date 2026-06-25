/**
 * Error Trends Panel - Enhanced with Edge Function grouping and stack trace parsing
 * Shows error statistics and trends over time
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { AlertTriangle, AlertCircle, Info, Server, ChevronDown, ChevronUp, Code } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ErrorTrends {
  total_errors: number;
  critical_errors: number;
  unique_fingerprints: number;
  errors_by_day: Array<{
    day: string;
    count: number;
    critical: number;
  }>;
  errors_by_type: Record<string, number>;
  errors_by_severity: Record<string, number>;
  top_error_fingerprints: Array<{
    error_fingerprint: string;
    error_type: string;
    error_message: string;
    occurrences: number;
    affected_users: number;
    last_seen: string;
    error_stack?: string;
    component?: string;
    url?: string;
  }>;
}

interface ErrorTrendsPanelProps {
  data: ErrorTrends | null | undefined;
  isLoading: boolean;
}

// Parse stack trace to extract useful info
function parseStackTrace(stack?: string | null): { file: string; line: string; func: string } | null {
  if (!stack) return null;

  // Match patterns like "at functionName (file.js:123:45)" or "functionName@file.js:123:45"
  const match = stack.match(/at\s+(\w+)?\s*\(?([^:]+):(\d+):\d+\)?|(\w+)@([^:]+):(\d+)/);
  if (match) {
    return {
      func: match[1] || match[4] || "anonymous",
      file: (match[2] || match[5] || "").split("/").pop() || "unknown",
      line: match[3] || match[6] || "?",
    };
  }
  return null;
}

// Extract edge function name from URL or error context
function extractEdgeFunction(url?: string, component?: string): string | null {
  if (url?.includes("/functions/")) {
    const match = url.match(/\/functions\/([^/?]+)/);
    return match?.[1] || null;
  }
  if (component?.includes("edge-")) {
    return component.replace("edge-", "");
  }
  return null;
}

// Group errors by edge function
function groupByEdgeFunction(errors: ErrorTrends["top_error_fingerprints"]): Record<string, number> {
  const groups: Record<string, number> = {};

  errors.forEach((error) => {
    const fn = extractEdgeFunction(error.url, error.component) || "frontend";
    groups[fn] = (groups[fn] || 0) + error.occurrences;
  });

  return groups;
}

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"];

export function ErrorTrendsPanel({ data, isLoading }: ErrorTrendsPanelProps) {
  const [expandedError, setExpandedError] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Нет данных об ошибках за выбранный период
        </CardContent>
      </Card>
    );
  }

  // Format errors by day for chart
  const errorsByDayData = (data.errors_by_day || []).map((d) => ({
    ...d,
    day: new Date(d.day).toLocaleDateString("ru-RU", { month: "short", day: "numeric" }),
  }));

  // Format errors by type for bar chart
  const errorsByTypeData = Object.entries(data.errors_by_type || {})
    .map(([name, count]) => ({ name: formatErrorType(name), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Group by edge function
  const edgeFunctionGroups = groupByEdgeFunction(data.top_error_fingerprints || []);
  const edgeFunctionData = Object.entries(edgeFunctionGroups)
    .map(([name, count]) => ({ name: name.slice(0, 12), count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
      {/* Errors Over Time */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-sm sm:text-base">Ошибки по дням</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {errorsByDayData.length > 0 ? (
            <ResponsiveContainer width="100%" height={150} className="sm:h-[200px]">
              <LineChart data={errorsByDayData}>
                <XAxis dataKey="day" fontSize={10} tickLine={false} />
                <YAxis fontSize={10} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  name="Всего"
                />
                <Line
                  type="monotone"
                  dataKey="critical"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  name="Критических"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-6 text-sm">Нет данных</p>
          )}
        </CardContent>
      </Card>

      {/* Errors by Edge Function */}
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Server className="h-4 w-4" />
            По источнику
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {edgeFunctionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={edgeFunctionData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={60}
                  paddingAngle={2}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {edgeFunctionData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-6 text-sm">Нет данных</p>
          )}
        </CardContent>
      </Card>

      {/* Errors by Type */}
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-sm sm:text-base">По типам</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {errorsByTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={140} className="sm:h-[180px]">
              <BarChart data={errorsByTypeData} layout="vertical">
                <XAxis type="number" fontSize={10} />
                <YAxis type="category" dataKey="name" width={70} fontSize={9} className="sm:text-[11px]" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-6 text-sm">Нет ошибок</p>
          )}
        </CardContent>
      </Card>

      {/* Errors by Severity */}
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-sm sm:text-base">По серьёзности</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 sm:space-y-3">
            {Object.entries(data.errors_by_severity || {}).map(([severity, count]) => (
              <div key={severity} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <SeverityIcon severity={severity} />
                  <span className="text-xs sm:text-sm capitalize">{formatSeverity(severity)}</span>
                </div>
                <Badge variant={getSeverityVariant(severity)} className="text-xs">
                  {count}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edge Function Summary */}
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Code className="h-4 w-4" />
            Edge Functions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {edgeFunctionData.slice(0, 5).map((fn, i) => (
              <div key={fn.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-sm font-mono">{fn.name}</span>
                </div>
                <Badge variant={fn.count > 10 ? "destructive" : "secondary"}>{fn.count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Error Fingerprints with Stack Traces */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-sm sm:text-base">Частые ошибки</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 sm:space-y-3">
            {data.top_error_fingerprints?.slice(0, 5).map((error, i) => {
              const stackInfo = parseStackTrace(error.error_stack);
              const edgeFn = extractEdgeFunction(error.url, error.component);
              const isExpanded = expandedError === i;

              return (
                <div key={i} className="p-2 sm:p-3 rounded-lg bg-muted/50 border border-border/50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs sm:text-sm font-medium">{error.error_type}</p>
                        {edgeFn && (
                          <Badge variant="outline" className="text-[10px] font-mono">
                            <Server className="h-2.5 w-2.5 mr-1" />
                            {edgeFn}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2">
                        {error.error_message}
                      </p>

                      {stackInfo && (
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground font-mono">
                          <Code className="h-3 w-3" />
                          <span>{stackInfo.func}</span>
                          <span className="text-muted-foreground/50">@</span>
                          <span>
                            {stackInfo.file}:{stackInfo.line}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="destructive" className="text-[10px] sm:text-xs">
                        {error.occurrences}×
                      </Badge>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                        {error.affected_users} польз.
                      </p>
                    </div>
                  </div>

                  {/* Expandable stack trace */}
                  {error.error_stack && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 mt-2 text-[10px]"
                        onClick={() => setExpandedError(isExpanded ? null : i)}
                      >
                        {isExpanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                        Stack trace
                      </Button>

                      {isExpanded && (
                        <pre className="mt-2 p-2 bg-zinc-900/90 rounded text-[9px] text-green-400 overflow-x-auto max-h-32 font-mono">
                          {error.error_stack}
                        </pre>
                      )}
                    </>
                  )}

                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2">
                    Последняя: {new Date(error.last_seen).toLocaleString("ru-RU")}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SeverityIcon({ severity }: { severity: string }) {
  const s = severity.toLowerCase();
  if (s === "critical" || s === "error") {
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  }
  if (s === "warning") {
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  }
  return <Info className="h-4 w-4 text-blue-500" />;
}

function getSeverityVariant(severity: string): "destructive" | "secondary" | "outline" {
  const s = severity.toLowerCase();
  if (s === "critical" || s === "error") return "destructive";
  if (s === "warning") return "secondary";
  return "outline";
}

function formatSeverity(s: string): string {
  const map: Record<string, string> = {
    critical: "Критические",
    error: "Ошибки",
    warning: "Предупреждения",
    info: "Информация",
  };
  return map[s.toLowerCase()] || s;
}

function formatErrorType(type: string): string {
  return type
    .replace(/Error$/i, "")
    .replace(/([A-Z])/g, " $1")
    .trim()
    .slice(0, 15);
}
