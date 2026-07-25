import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, ImageOff, Loader2, MicOff, RefreshCw } from "@/lib/icons";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { labelForSkipCode } from "@/lib/generation/skipLabels";
import { toast } from "sonner";
import {
  fetchTrackGenerationStatus,
  invokeRetryTrackProcessing,
  type StatusTaskRow as TaskRow,
  type StatusVersionRow as VersionRow,
} from "@/api/track-generation-status.api";

interface SkipReason {
  code: string;
  message: string;
  clipIndex: number;
  clipId: string | null;
  availableKeys?: string[];
}

interface Props {
  trackId: string;
  className?: string;
}

/**
 * Диагностическая панель статуса генерации: показывает версии, обложки,
 * человекочитаемые причины skipped/failed и позволяет запросить повторную
 * обработку задачи, если audio_url/image_url пришли позже.
 */
export function TrackGenerationStatusPanel({ trackId, className }: Props) {
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<TaskRow | null>(null);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [skipReasons, setSkipReasons] = useState<SkipReason[]>([]);
  const [retrying, setRetrying] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { activeVersionId, versions, task, notificationMetadata } =
          await fetchTrackGenerationStatus(trackId);
        if (cancelled) return;
        setActiveVersionId(activeVersionId);
        setVersions(versions);
        setTask(task);
        const meta = (notificationMetadata ?? {}) as { skippedClips?: SkipReason[] };
        setSkipReasons(Array.isArray(meta.skippedClips) ? meta.skippedClips : []);
      } catch (err) {
        logger.error("TrackGenerationStatusPanel load failed", err, { trackId });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [trackId, reloadKey]);

  const missingAudio = versions.some((v) => !v.audio_url) || versions.length < 2;
  const missingCover = versions.some((v) => !v.cover_url);
  const canRetry = Boolean(task?.id) && (missingAudio || missingCover || skipReasons.length > 0);

  const handleRetry = useCallback(async () => {
    if (!task) return;
    setRetrying(true);
    try {
      const data = await invokeRetryTrackProcessing(trackId);
      const created = data?.versions_created ?? 0;
      const updated = data?.versions_updated ?? 0;
      if (created === 0 && updated === 0) {
        toast.info("Новых данных пока нет. Попробуйте чуть позже.");
      } else {
        toast.success(`Готово: создано ${created}, обновлено ${updated}.`);
      }
      setReloadKey((k) => k + 1);
    } catch (err) {
      logger.error("retry-track-processing failed", err, { trackId });
      toast.error("Не удалось запустить повторную обработку.");
    } finally {
      setRetrying(false);
    }
  }, [task, trackId]);

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm", className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Загружаем статус генерации…
      </div>
    );
  }

  const status = task?.status ?? "unknown";
  const isFailed = status === "failed";
  const isPartial = status === "partial_delivery" || skipReasons.length > 0;

  return (
    <div className={cn("space-y-3 rounded-lg border border-border bg-card p-3 text-sm", className)}>
      <header className="flex items-center gap-2">
        {isFailed ? (
          <AlertCircle className="h-4 w-4 text-destructive" />
        ) : isPartial ? (
          <AlertCircle className="h-4 w-4 text-warning" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-success" />
        )}
        <span className="font-semibold">Статус генерации</span>
        <span className="ml-auto text-xs text-muted-foreground">{status}</span>
      </header>

      {task?.error_message && (
        <p className="rounded bg-destructive/10 p-2 text-xs text-destructive">{task.error_message}</p>
      )}

      <section>
        <h4 className="mb-1 text-xs font-medium text-muted-foreground">Версии ({versions.length})</h4>
        {versions.length === 0 ? (
          <p className="text-xs text-muted-foreground">Версии ещё не созданы.</p>
        ) : (
          <ul className="space-y-1">
            {versions.map((v) => (
              <li key={v.id} className="flex items-center gap-2 rounded bg-muted/40 p-2">
                <span className="font-mono text-xs">V{v.version_label}</span>
                {v.cover_url ? (
                  <img src={v.cover_url} alt="" className="h-6 w-6 rounded object-cover" loading="lazy" />
                ) : (
                  <ImageOff className="h-4 w-4 text-muted-foreground" aria-label="Нет обложки" />
                )}
                {v.audio_url ? (
                  <span className="truncate text-xs text-muted-foreground">{v.audio_url.split("/").pop()}</span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-destructive">
                    <MicOff className="h-3 w-3" /> нет аудио
                  </span>
                )}
                {v.id === activeVersionId && (
                  <span className="ml-auto rounded bg-primary/20 px-1.5 py-0.5 text-[0.625rem] font-medium text-primary">
                    active
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {skipReasons.length > 0 && (
        <section>
          <h4 className="mb-1 text-xs font-medium text-warning">
            Пропущенные клипы ({skipReasons.length})
          </h4>
          <ul className="space-y-1">
            {skipReasons.map((r, idx) => {
              const label = labelForSkipCode(r.code);
              return (
                <li key={idx} className="rounded bg-warning/10 p-2 text-xs">
                  <div className="font-medium">
                    #{r.clipIndex + 1}: {label.title}
                  </div>
                  <div className="text-muted-foreground">{label.hint}</div>
                  {r.availableKeys && r.availableKeys.length > 0 && (
                    <div className="mt-0.5 font-mono text-[0.625rem] text-muted-foreground">
                      keys: {r.availableKeys.slice(0, 8).join(", ")}
                      {r.availableKeys.length > 8 && "…"}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {canRetry && (
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          className={cn(
            "inline-flex items-center gap-2 rounded-md border border-border bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground",
            "hover:bg-primary/90 disabled:opacity-60",
          )}
        >
          {retrying ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Повторить обработку
        </button>
      )}
    </div>
  );
}
