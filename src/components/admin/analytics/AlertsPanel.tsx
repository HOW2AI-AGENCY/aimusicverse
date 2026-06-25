/**
 * AlertsPanel - Display active alerts and health status
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle2, XCircle, Bell, RefreshCw, Activity, Clock, Zap, DollarSign } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useAlerts } from "@/hooks/admin/useAlerts";
import { formatDistanceToNow } from "@/lib/date-utils";

export function AlertsPanel() {
  const { currentMetrics, activeAlerts, healthStatus, isLoading, refetch } = useAlerts();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base">Состояние системы</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Состояние системы
          </CardTitle>
          <div className="flex items-center gap-2">
            <StatusBadge status={healthStatus} />
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <MetricCard
            icon={Zap}
            label="Генерации"
            value={`${currentMetrics?.generation_failure_rate.toFixed(1)}%`}
            subtext="% ошибок"
            status={getMetricStatus("generation_failure_rate", currentMetrics?.generation_failure_rate || 0)}
          />
          <MetricCard
            icon={Activity}
            label="LCP"
            value={`${Math.round(currentMetrics?.lcp_ms || 0)}ms`}
            subtext="среднее"
            status={getMetricStatus("lcp_ms", currentMetrics?.lcp_ms || 0)}
          />
          <MetricCard
            icon={AlertTriangle}
            label="Ошибки"
            value={String(currentMetrics?.errors_per_hour || 0)}
            subtext="за час"
            status={getMetricStatus("errors_per_hour", currentMetrics?.errors_per_hour || 0)}
          />
          <MetricCard
            icon={Clock}
            label="API"
            value={`${Math.round(currentMetrics?.api_latency_ms || 0)}ms`}
            subtext="задержка"
            status={getMetricStatus("api_latency_ms", currentMetrics?.api_latency_ms || 0)}
          />
          <MetricCard
            icon={DollarSign}
            label="Suno"
            value={`${currentMetrics?.suno_credits.toFixed(0)}`}
            subtext="кредиты"
            status={getMetricStatus("suno_credits", currentMetrics?.suno_credits || 0)}
          />
        </div>

        {/* Active Alerts */}
        {activeAlerts.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Активные алерты</h4>
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border",
                  alert.severity === "critical" && "bg-red-500/10 border-red-500/30",
                  alert.severity === "warning" && "bg-yellow-500/10 border-yellow-500/30",
                  alert.severity === "info" && "bg-blue-500/10 border-blue-500/30",
                )}
              >
                {alert.severity === "critical" ? (
                  <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                ) : alert.severity === "warning" ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                ) : (
                  <Bell className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(alert.triggeredAt, { addSuffix: true })}
                  </p>
                </div>
                <Badge
                  variant={
                    alert.severity === "critical"
                      ? "destructive"
                      : alert.severity === "warning"
                        ? "secondary"
                        : "outline"
                  }
                  className="shrink-0"
                >
                  {alert.severity}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">Все системы работают нормально</p>
              <p className="text-xs text-muted-foreground mt-0.5">Нет активных алертов</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant={
        status === "healthy"
          ? "default"
          : status === "warning"
            ? "secondary"
            : status === "critical"
              ? "destructive"
              : "outline"
      }
      className="gap-1"
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          status === "healthy" && "bg-green-500 animate-pulse",
          status === "warning" && "bg-yellow-500 animate-pulse",
          status === "critical" && "bg-red-500 animate-pulse",
          status === "loading" && "bg-gray-400",
        )}
      />
      {status === "healthy"
        ? "OK"
        : status === "warning"
          ? "Внимание"
          : status === "critical"
            ? "Критично"
            : "Загрузка"}
    </Badge>
  );
}

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtext: string;
  status: "good" | "warning" | "critical";
}

function MetricCard({ icon: Icon, label, value, subtext, status }: MetricCardProps) {
  return (
    <div
      className={cn(
        "p-2.5 rounded-lg border text-center",
        status === "good" && "bg-green-500/5 border-green-500/20",
        status === "warning" && "bg-yellow-500/5 border-yellow-500/20",
        status === "critical" && "bg-red-500/5 border-red-500/20",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 mx-auto mb-1",
          status === "good" && "text-green-500",
          status === "warning" && "text-yellow-500",
          status === "critical" && "text-red-500",
        )}
      />
      <div className="text-sm font-bold">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function getMetricStatus(metric: string, value: number): "good" | "warning" | "critical" {
  switch (metric) {
    case "generation_failure_rate":
      if (value <= 8) return "good";
      if (value <= 15) return "warning";
      return "critical";
    case "lcp_ms":
      if (value <= 2500) return "good";
      if (value <= 4000) return "warning";
      return "critical";
    case "errors_per_hour":
      if (value <= 20) return "good";
      if (value <= 50) return "warning";
      return "critical";
    case "api_latency_ms":
      if (value <= 1000) return "good";
      if (value <= 3000) return "warning";
      return "critical";
    case "suno_credits":
      if (value >= 100) return "good";
      if (value >= 20) return "warning";
      return "critical";
    default:
      return "good";
  }
}
