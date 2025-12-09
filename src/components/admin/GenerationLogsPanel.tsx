import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Music
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ru } from "date-fns/locale";

interface GenerationLog {
  id: string;
  userId: string;
  username: string;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  duration?: number;
  error?: string;
  trackTitle?: string;
  style?: string;
  model?: string;
}

// Mock data for demonstration
const mockLogs: GenerationLog[] = [
  {
    id: '1',
    userId: '123',
    username: 'user123',
    prompt: 'Энергичный рок трек с гитарой',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 5),
    completedAt: new Date(Date.now() - 1000 * 60 * 3),
    duration: 120,
    trackTitle: 'Rock Energy',
    style: 'rock',
    model: 'v5'
  },
  {
    id: '2',
    userId: '456',
    username: 'user456',
    prompt: 'Мелодичный поп с вокалом',
    status: 'processing',
    createdAt: new Date(Date.now() - 1000 * 60 * 2),
    style: 'pop',
    model: 'v5'
  },
  {
    id: '3',
    userId: '789',
    username: 'user789',
    prompt: 'Ambient электроника',
    status: 'failed',
    createdAt: new Date(Date.now() - 1000 * 60 * 10),
    completedAt: new Date(Date.now() - 1000 * 60 * 9),
    duration: 60,
    error: 'API timeout',
    style: 'electronic',
    model: 'v5'
  },
];

export function GenerationLogsPanel() {
  const [logs] = useState<GenerationLog[]>(mockLogs);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchQuery === "" || 
      log.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.trackTitle?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === null || log.status === filterStatus;
    
    return matchesSearch && matchesFilter;
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
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
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
    // Implement export functionality
    const csv = [
      ['ID', 'User', 'Prompt', 'Status', 'Created', 'Duration', 'Error'].join(','),
      ...filteredLogs.map(log => [
        log.id,
        log.username,
        `"${log.prompt}"`,
        log.status,
        format(log.createdAt, 'yyyy-MM-dd HH:mm:ss'),
        log.duration || '',
        log.error || ''
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Логи генерации
            </CardTitle>
            <CardDescription>
              История генерации треков ({filteredLogs.length} записей)
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportLogs}>
              <Download className="h-4 w-4 mr-2" />
              Экспорт
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по промпту, пользователю или названию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button 
            variant={filterStatus === null ? "outline" : "default"}
            size="sm"
            onClick={() => setFilterStatus(null)}
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

        {/* Logs List */}
        <ScrollArea className="h-[500px]">
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
                      <span className="text-sm font-medium truncate">@{log.username}</span>
                      {log.trackTitle && (
                        <>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-sm text-muted-foreground truncate">{log.trackTitle}</span>
                        </>
                      )}
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
                      {formatDistanceToNow(log.createdAt, { addSuffix: true, locale: ru })}
                    </div>
                    
                    {log.duration && (
                      <div className="flex items-center gap-1">
                        <span>⏱️</span>
                        <span>{log.duration}s</span>
                      </div>
                    )}

                    {log.style && (
                      <Badge variant="outline" className="text-xs">
                        {log.style}
                      </Badge>
                    )}

                    {log.model && (
                      <Badge variant="outline" className="text-xs font-mono">
                        {log.model}
                      </Badge>
                    )}

                    <code className="text-xs">ID: {log.id}</code>
                  </div>

                  {/* Error Message */}
                  {log.error && (
                    <div className="flex items-center gap-2 p-2 rounded bg-destructive/10 text-destructive text-xs">
                      <AlertCircle className="h-3 w-3 flex-shrink-0" />
                      <span>{log.error}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
