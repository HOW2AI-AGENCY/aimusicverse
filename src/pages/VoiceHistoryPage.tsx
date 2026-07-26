import { useMemo, useState } from "react";
import { History, RefreshCw, CheckCircle2, AlertCircle, Clock, Filter, Trash2 } from "@/lib/icons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useCustomVoices, type CustomVoice } from "@/hooks/voice/useCustomVoices";
import { voiceCloneApi } from "@/api/voice-clone.api";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

type TypeFilter = "all" | "validation" | "generation";
type StatusFilter = "all" | "ready" | "failed" | "in_progress";

function statusBadge(v: CustomVoice) {
  if (v.status === "ready")
    return (
      <Badge variant="secondary" className="gap-1">
        <CheckCircle2 className="h-3 w-3 text-green-500" />
        Готов
      </Badge>
    );
  if (v.status === "failed")
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertCircle className="h-3 w-3" />
        Ошибка
      </Badge>
    );
  return (
    <Badge variant="outline" className="gap-1">
      <Clock className="h-3 w-3 animate-pulse" />
      {v.status}
    </Badge>
  );
}

function typeLabel(v: CustomVoice): "validation" | "generation" {
  return v.generate_task_id ? "generation" : "validation";
}

function isInProgress(v: CustomVoice) {
  return ["validating", "phrase_ready", "generating", "pending"].includes(v.status);
}

export default function VoiceHistoryPage() {
  const { voices, isLoading, deleteVoice } = useCustomVoices();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return voices.filter((v) => {
      if (typeFilter !== "all" && typeLabel(v) !== typeFilter) return false;
      if (statusFilter === "ready" && v.status !== "ready") return false;
      if (statusFilter === "failed" && v.status !== "failed") return false;
      if (statusFilter === "in_progress" && !isInProgress(v)) return false;
      if (query && !v.voice_name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [voices, typeFilter, statusFilter, query]);

  async function retry(v: CustomVoice) {
    setRetryingId(v.id);
    try {
      if (!v.voice_id && v.validate_task_id) {
        // Validation failed before phrase — restart by re-polling current task
        const info = await voiceCloneApi.validateInfo(v.validate_task_id);
        if (info.status === "phrase_ready") {
          toast.success("Фраза готова — откройте мастер для записи");
        } else {
          toast.info(`Статус: ${info.status}`);
        }
      } else if (v.validate_task_id) {
        const res = await voiceCloneApi.regenerate(v.id);
        toast.success("Запрошена новая контрольная фраза", { description: `Task: ${res.taskId}` });
      } else {
        toast.error("Невозможно повторить: нет задачи валидации");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Catch-all unknown error from retry RPC
    } catch (e) {
      logger.error("Retry failed", e);
      toast.error(e instanceof Error ? e.message : "Ошибка повтора");
    } finally {
      setRetryingId(null);
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-4">
      <div className="flex items-center gap-2">
        <History className="h-6 w-6" />
        <div>
          <h1 className="text-2xl font-bold">История запросов</h1>
          <p className="text-sm text-muted-foreground">Валидации и генерации кастомных голосов</p>
        </div>
      </div>

      <Card className="p-3 flex flex-wrap gap-2 items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все типы</SelectItem>
            <SelectItem value="validation">Валидация</SelectItem>
            <SelectItem value="generation">Генерация</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="ready">Готовые</SelectItem>
            <SelectItem value="failed">Ошибки</SelectItem>
            <SelectItem value="in_progress">В процессе</SelectItem>
          </SelectContent>
        </Select>
        <Input
          className="flex-1 min-w-[160px]"
          placeholder="Поиск по названию…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </Card>

      {isLoading && <p className="text-sm text-muted-foreground">Загрузка…</p>}

      {!isLoading && filtered.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Нет записей по выбранным фильтрам</p>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map((v) => {
          const t = typeLabel(v);
          const taskId = t === "generation" ? v.generate_task_id : v.validate_task_id;
          return (
            <Card key={v.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{v.voice_name}</h3>
                    <Badge variant="outline" className="text-[0.625rem]">
                      {t === "generation" ? "Генерация" : "Валидация"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(v.created_at).toLocaleString("ru-RU")} · Task:{" "}
                    <span className="font-mono">{taskId?.slice(0, 12) || "—"}</span>
                  </p>
                </div>
                {statusBadge(v)}
              </div>
              {v.error_message && (
                <p className="text-xs text-destructive bg-destructive/10 rounded p-2">{v.error_message}</p>
              )}
              <div className="flex gap-2">
                {(v.status === "failed" || isInProgress(v)) && (
                  <Button size="sm" variant="outline" disabled={retryingId === v.id} onClick={() => retry(v)}>
                    <RefreshCw className={`mr-2 h-3 w-3 ${retryingId === v.id ? "animate-spin" : ""}`} />
                    Повторить
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`Удалить запись «${v.voice_name}»?`)) deleteVoice(v.id);
                  }}
                >
                  <Trash2 className="mr-2 h-3 w-3" />
                  Удалить
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
