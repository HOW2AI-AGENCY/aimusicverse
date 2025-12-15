import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  useAdminModerationReports,
  useUpdateReportStatus,
  useModerationStats,
} from "@/hooks/useAdminModerationReports";

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

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="Ожидают"
          value={stats?.pending || 0}
          icon={<Clock className="h-4 w-4 text-yellow-500" />}
          variant="warning"
        />
        <StatCard
          title="На рассмотрении"
          value={stats?.reviewed || 0}
          icon={<Eye className="h-4 w-4 text-blue-500" />}
          variant="info"
        />
        <StatCard
          title="Решено"
          value={stats?.resolved || 0}
          icon={<CheckCircle className="h-4 w-4 text-green-500" />}
          variant="success"
        />
        <StatCard
          title="Отклонено"
          value={stats?.dismissed || 0}
          icon={<XCircle className="h-4 w-4 text-muted-foreground" />}
          variant="muted"
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
                      className="p-3 md:p-4 rounded-lg border bg-card space-y-3"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge
                            variant="outline"
                            className={`${statusConfig.color} text-white border-0 text-xs`}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {REASON_LABELS[report.reason] || report.reason}
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => updateStatus.mutate({ reportId: report.id, status: "reviewed" })}
                              disabled={report.status === "reviewed"}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              На рассмотрение
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateStatus.mutate({ reportId: report.id, status: "resolved" })}
                              disabled={report.status === "resolved"}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Решено
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateStatus.mutate({ reportId: report.id, status: "dismissed" })}
                              disabled={report.status === "dismissed"}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Отклонить
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

                      {/* Footer */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span>От:</span>
                          <span className="font-medium">
                            @{report.reporter?.username || report.reporter?.first_name || "—"}
                          </span>
                          <span>→</span>
                          <span className="font-medium">
                            @{report.reported_user?.username || report.reported_user?.first_name || "—"}
                          </span>
                        </div>
                        <span>
                          {formatDistanceToNow(new Date(report.created_at), {
                            addSuffix: true,
                            locale: ru,
                          })}
                        </span>
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
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  variant: "warning" | "info" | "success" | "muted";
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-3 md:px-4">
        <div className="flex items-center justify-between">
          <p className="text-xs md:text-sm text-muted-foreground">{title}</p>
          {icon}
        </div>
        <p className="text-xl md:text-2xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}
