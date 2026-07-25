/**
 * StemBatchStatusBadge — compact realtime indicator for the current user's
 * active stem batch. Renders nothing when there is no relevant activity.
 */

import { memo } from "react";
import { Loader2, CheckCircle2, XCircle, RefreshCw, X } from "@/lib/icons";
import { useUserStemBatches } from "@/hooks/audio/useUserStemBatches";
import { cn } from "@/lib/utils";
import type { StemBatchStatus } from "@/api/batch.api";

interface StemBatchStatusBadgeProps {
  variant?: "compact" | "fullscreen";
  className?: string;
}

const LABELS: Record<StemBatchStatus["status"], string> = {
  queued: "В очереди",
  processing: "Обработка стемов",
  completed: "Стемы готовы",
  failed: "Ошибка обработки",
  cancelled: "Отменено",
};

function statusIcon(status: StemBatchStatus["status"]) {
  switch (status) {
    case "queued":
    case "processing":
      return <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />;
    case "completed":
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />;
    case "failed":
      return <XCircle className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />;
    case "cancelled":
      return <X className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />;
  }
}

export const StemBatchStatusBadge = memo(function StemBatchStatusBadge({
  variant = "compact",
  className,
}: StemBatchStatusBadgeProps) {
  const { latest, cancel, retry } = useUserStemBatches();

  // Auto-dismiss terminal statuses shortly after they arrive by not rendering
  // if the row has no active progress and is >30s old (updated_at tracked via
  // supabase automatically — we only rely on presence of `latest`).
  if (!latest) return null;

  const isActive = latest.status === "queued" || latest.status === "processing";
  const isFailed = latest.status === "failed";

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="stem-batch-status-badge"
      className={cn(
        "flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-[0.6875rem] backdrop-blur",
        variant === "fullscreen" && "text-xs",
        className,
      )}
    >
      {statusIcon(latest.status)}
      <span className="line-clamp-1 max-w-[10rem]">{LABELS[latest.status]}</span>
      {isActive && (
        <span className="tabular-nums text-muted-foreground">{Math.round(latest.progress)}%</span>
      )}
      {isActive && (
        <button
          type="button"
          onClick={() => void cancel(latest.id)}
          className="rounded-full p-0.5 hover:bg-muted/40"
          aria-label="Отменить обработку стемов"
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      )}
      {isFailed && (
        <button
          type="button"
          onClick={() => void retry(latest.id)}
          className="flex items-center gap-1 rounded-full bg-destructive/15 px-1.5 py-0.5 text-destructive hover:bg-destructive/25"
          aria-label="Повторить обработку стемов"
        >
          <RefreshCw className="h-3 w-3" aria-hidden="true" />
          <span>Повторить</span>
        </button>
      )}
    </div>
  );
});
