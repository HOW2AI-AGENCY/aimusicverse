import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Flag,
  MoreVertical,
  Music,
  XCircle,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  useAdminModerationReports,
  useUpdateReportStatus,
  useModerationStats,
} from "@/hooks/useAdminModerationReports";

type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";

const STATUS_CONFIG = {
  pending: { label: "Ожидает", icon: Clock, color: "bg-yellow-500" },
  reviewed: { label: "На рассмотрении", icon: Eye, color: "bg-blue-500" },
  resolved: { label: "Решено", icon: CheckCircle, color: "bg-green-500" },
  dismissed: { label: "Отклонено", icon: XCircle, color: "bg-muted" },
};

const REASON_LABELS: Record<string, string> = {
  copyright: "Авторские права",
  inappropriate: "Неприемлемый контент",
  spam: "Спам/мошенничество",
  hate: "Разжигание ненависти",
  other: "Другое",
};

export function ModerationReportsPanel() {
  const [statusFilter, setStatusFilter] = useState("pending");
  const { data: reports, isLoading } = useAdminModerationReports(statusFilter);
  const { data: stats } = useModerationStats();
  const updateStatus = useUpdateReportStatus();

  const handleQuickAction = (reportId: string, status: ReportStatus) => {
    updateStatus.mutate({ reportId, status });
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards - Swipeable on mobile */}
      <div className="grid grid-cols-4 gap-2 md:gap-3">
        <StatCard
          title="Ожидают"
          value={stats?.pending || 0}
          icon={<Clock className="h-4 w-4 text-yellow-500" />}
          variant="warning"
          active={statusFilter === "pending"}
          onClick={() => setStatusFilter("pending")}
        />
        <StatCard
          title="Рассмотр."
          value={stats?.reviewed || 0}
          icon={<Eye className="h-4 w-4 text-blue-500" />}
          variant="info"
          active={statusFilter === "reviewed"}
          onClick={() => setStatusFilter("reviewed")}
        />
        <StatCard
          title="Решено"
          value={stats?.resolved || 0}
          icon={<CheckCircle className="h-4 w-4 text-green-500" />}
          variant="success"
          active={statusFilter === "resolved"}
          onClick={() => setStatusFilter("resolved")}
        />
        <StatCard
          title="Отклон."
          value={stats?.dismissed || 0}
          icon={<XCircle className="h-4 w-4 text-muted-foreground" />}
          variant="muted"
          active={statusFilter === "dismissed"}
          onClick={() => setStatusFilter("dismissed")}
        />
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Жалобы ({reports?.length || 0})
            </CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Фильтр по статусу" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="pending">Ожидают</SelectItem>
                <SelectItem value="reviewed">На рассмотрении</SelectItem>
                <SelectItem value="resolved">Решено</SelectItem>
                <SelectItem value="dismissed">Отклонено</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !reports?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Нет жалоб</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] md:h-[500px]">
              <div className="space-y-3">
                {reports.map((report) => {
                  const statusConfig = STATUS_CONFIG[report.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                  const StatusIcon = statusConfig.icon;

                  return (
                    <div
                      key={report.id}
                      className="p-3 rounded-lg border bg-card space-y-2.5 hover:border-border transition-colors"
                    >
                      {/* Header with badges */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge
                            variant="outline"
                            className={`${statusConfig.color} text-white border-0 text-[10px] px-1.5 py-0`}
                          >
                            <StatusIcon className="h-3 w-3 mr-0.5" />
                            <span className="hidden sm:inline">{statusConfig.label}</span>
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {REASON_LABELS[report.reason] || report.reason}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(report.created_at), {
                            addSuffix: true,
                            locale: ru,
                          })}
                        </span>
                      </div>

                      {/* Track Info */}
                      {report.entity_type === "track" && report.track && (
                        <div className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                          <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                            {report.track.cover_url ? (
                              <img
                                src={report.track.cover_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Music className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">
                              {report.track.title || "Без названия"}
                            </p>
                            <p className="text-xs text-muted-foreground">Трек</p>
                          </div>
                        </div>
                      )}

                      {/* Details */}
                      {report.details && (
                        <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                          {report.details}
                        </p>
                      )}

                      {/* Quick Actions - Mobile Friendly */}
                      <div className="flex items-center justify-between pt-1 border-t border-border/50">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <span>@{report.reporter?.username || report.reporter?.first_name || "—"}</span>
                          <span>→</span>
                          <span>@{report.reported_user?.username || report.reported_user?.first_name || "—"}</span>
                        </div>
                        
                        {/* Quick action buttons for pending reports */}
                        {report.status === "pending" && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleQuickAction(report.id, "reviewed")}
                              disabled={updateStatus.isPending}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Рассм.</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-500/10"
                              onClick={() => handleQuickAction(report.id, "resolved")}
                              disabled={updateStatus.isPending}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Решено</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleQuickAction(report.id, "dismissed")}
                              disabled={updateStatus.isPending}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Откл.</span>
                            </Button>
                          </div>
                        )}
                        
                        {/* Show dropdown for non-pending */}
                        {report.status !== "pending" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 px-2">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleQuickAction(report.id, "pending")}
                              >
                                <Clock className="h-4 w-4 mr-2" />
                                Вернуть в ожидание
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleQuickAction(report.id, "resolved")}
                                disabled={report.status === "resolved"}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Решено
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleQuickAction(report.id, "dismissed")}
                                disabled={report.status === "dismissed"}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Отклонить
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  variant,
  active,
  onClick,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  variant: "warning" | "info" | "success" | "muted";
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:border-primary/50",
        active && "border-primary bg-primary/5"
      )}
      onClick={onClick}
    >
      <CardContent className="p-2 md:p-3">
        <div className="flex items-center justify-between mb-1">
          {icon}
          <p className="text-lg md:text-xl font-bold">{value}</p>
        </div>
        <p className="text-[10px] md:text-xs text-muted-foreground truncate">{title}</p>
      </CardContent>
    </Card>
  );
}
