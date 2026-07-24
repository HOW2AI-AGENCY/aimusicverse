import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, ImageOff, Loader2, MicOff } from "@/lib/icons";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";

interface SkipReason {
  code: string;
  message: string;
  clipIndex: number;
  clipId: string | null;
  availableKeys?: string[];
}

interface TaskRow {
  id: string;
  status: string;
  error_message: string | null;
  received_clips: number | null;
  expected_clips?: number | null;
  audio_clips: unknown;
}

interface VersionRow {
  id: string;
  version_label: string;
  clip_index: number;
  audio_url: string | null;
  cover_url: string | null;
  is_primary: boolean;
  metadata: Record<string, unknown> | null;
}

interface Props {
  trackId: string;
  className?: string;
}

const SKIP_LABELS: Record<string, string> = {
  missing_audio_url: "нет аудио-ссылки",
  missing_stream_url: "нет потоковой ссылки",
  missing_image_url: "нет обложки",
  empty_clip: "пустой клип",
};

/**
 * Диагностическая панель статуса генерации: показывает версии, обложки
 * и причины skipped/failed из notifications.metadata / generation_tasks.
 * Открывается из меню трека, помогает разобрать проблему без Sentry.
 */
export function TrackGenerationStatusPanel({ trackId, className }: Props) {
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<TaskRow | null>(null);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [skipReasons, setSkipReasons] = useState<SkipReason[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ data: trackData }, { data: versionData }] = await Promise.all([
          supabase.from("tracks").select("active_version_id").eq("id", trackId).maybeSingle(),
          supabase
            .from("track_versions")
            .select("id, version_label, clip_index, audio_url, cover_url, is_primary, metadata")
            .eq("track_id", trackId)
            .order("clip_index", { ascending: true }),
        ]);
        const { data: taskData } = await supabase
          .from("generation_tasks")
          .select("id, status, error_message, received_clips, audio_clips")
          .eq("track_id", trackId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data: notif } = await supabase
          .from("notifications")
          .select("metadata")
          .eq("group_key", taskData ? `generation_${taskData.id}` : "__none__")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cancelled) return;
        setActiveVersionId((trackData?.active_version_id as string | null) ?? null);
        setVersions((versionData ?? []) as VersionRow[]);
        setTask((taskData ?? null) as TaskRow | null);
        const meta = (notif?.metadata ?? {}) as { skippedClips?: SkipReason[] };
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
  }, [trackId]);

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
                  <span className="ml-auto rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
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
            {skipReasons.map((r, idx) => (
              <li key={idx} className="rounded bg-warning/10 p-2 text-xs">
                <div className="font-medium">
                  #{r.clipIndex + 1}: {SKIP_LABELS[r.code] ?? r.code}
                </div>
                <div className="text-muted-foreground">{r.message}</div>
                {r.availableKeys && r.availableKeys.length > 0 && (
                  <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                    keys: {r.availableKeys.slice(0, 8).join(", ")}
                    {r.availableKeys.length > 8 && "…"}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
