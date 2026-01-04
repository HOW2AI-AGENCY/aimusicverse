import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Download, 
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Music,
  Loader2
} from "lucide-react";
import { formatDistanceToNow, format, ru } from '@/lib/date-utils';
import { useGenerationLogs, useGenerationStats } from "@/hooks/useGenerationLogs";

export function GenerationLogsPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  const { logs, isLoading, refetch } = useGenerationLogs({ 
    limit: 100, 
    status: filterStatus,
    timeRange 
  });
  
  const { data: stats } = useGenerationStats(timeRange);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchQuery === "" || 
      log.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.suno_task_id?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      processing: "secondary",
      failed: "destructive",
      pending: "outline"
    };
    
    const labels: Record<string, string> = {
      completed: "Готово",
      processing: "В процессе",
      failed: "Ошибка",
      pending: "Ожидание"
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const exportLogs = () => {
    const csv = [
      ['ID', 'User ID', 'Prompt', 'Status', 'Model', 'Source', 'Created', 'Completed', 'Error'].join(','),
      ...filteredLogs.map(log => [
        log.id,
        log.user_id,
        `"${log.prompt.replace(/"/g, '""')}"`,
        log.status,
        log.model_used || '',
        log.source || '',
        log.created_at,
        log.completed_at || '',
        log.error_message || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generation-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Логи генерации
            </CardTitle>
            <CardDescription>
              {isLoading ? "Загрузка..." : `${filteredLogs.length} записей`}
              {stats && ` | Успешность: ${stats.success_rate?.toFixed(1) || 0}%`}
            </CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1 час</SelectItem>
                <SelectItem value="24h">24 часа</SelectItem>
                <SelectItem value="7d">7 дней</SelectItem>
                <SelectItem value="30d">30 дней</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportLogs}>
              <Download className="h-4 w-4 mr-2" />
              Экспорт
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Summary */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <div className="text-lg font-bold">{stats.total_generations}</div>
              <div className="text-xs text-muted-foreground">Всего</div>
            </div>
            <div className="p-2 rounded-lg bg-green-500/10 text-center">
              <div className="text-lg font-bold text-green-600">{stats.completed}</div>
              <div className="text-xs text-muted-foreground">Успешно</div>
            </div>
            <div className="p-2 rounded-lg bg-red-500/10 text-center">
              <div className="text-lg font-bold text-red-600">{stats.failed}</div>
              <div className="text-xs text-muted-foreground">Ошибок</div>
            </div>
            <div className="p-2 rounded-lg bg-yellow-500/10 text-center">
              <div className="text-lg font-bold text-yellow-600">{stats.pending + stats.processing}</div>
              <div className="text-xs text-muted-foreground">В процессе</div>
            </div>
            <div className="p-2 rounded-lg bg-blue-500/10 text-center">
              <div className="text-lg font-bold text-blue-600">{stats.avg_duration_seconds?.toFixed(0) || 0}s</div>
              <div className="text-xs text-muted-foreground">Ср. время</div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по промпту или ID задачи..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant={!filterStatus ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(undefined)}
            >
              Все
            </Button>
            <Button 
              variant={filterStatus === 'completed' ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus('completed')}
            >
              Готово
            </Button>
            <Button 
              variant={filterStatus === 'processing' ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus('processing')}
            >
              В процессе
            </Button>
            <Button 
              variant={filterStatus === 'failed' ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus('failed')}
            >
              Ошибки
            </Button>
          </div>
        </div>

        {/* Logs List */}
        <ScrollArea className="h-[500px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              Нет записей
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(log.status)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs font-mono truncate">{log.user_id.slice(0, 8)}...</span>
                      </div>
                      {getStatusBadge(log.status)}
                    </div>

                    {/* Prompt */}
                    <p className="text-sm text-foreground line-clamp-2">
                      {log.prompt}
                    </p>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ru })}
                      </div>
                      
                      {log.model_used && (
                        <Badge variant="outline" className="text-xs font-mono">
                          {log.model_used}
                        </Badge>
                      )}

                      {log.source && (
                        <Badge variant="outline" className="text-xs">
                          {log.source}
                        </Badge>
                      )}

                      {log.suno_task_id && (
                        <code className="text-xs">Task: {log.suno_task_id.slice(0, 8)}...</code>
                      )}

                      {log.expected_clips && log.received_clips !== null && (
                        <span className="text-xs">
                          Клипы: {log.received_clips}/{log.expected_clips}
                        </span>
                      )}
                    </div>

                    {/* Error Message */}
                    {log.error_message && (
                      <div className="flex items-center gap-2 p-2 rounded bg-destructive/10 text-destructive text-xs">
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        <span className="line-clamp-2">{log.error_message}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
