// Structured metrics logging for suno-music-generate outcomes.
// Rows are aggregated by the `suno_generation_stats_daily` view for monitoring.
import { createLogger } from "../_shared/logger.ts";

const logger = createLogger("suno-music-generate");

export type SunoOutcome =
  | "success"
  | "failure"
  | "rate_limit"
  | "insufficient_credits"
  | "validation_error"
  | "unauthorized"
  | "exception";

export interface RecordEventParams {
  correlationId: string;
  userId: string | null;
  outcome: SunoOutcome;
  httpStatus?: number | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  modelRequested?: string | null;
  modelUsed?: string | null;
  retryCount?: number;
  fallbackUsed?: boolean;
  durationMs?: number | null;
  trackId?: string | null;
  taskId?: string | null;
  sunoTaskId?: string | null;
  metadata?: Record<string, unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function recordSunoEvent(supabase: any, p: RecordEventParams): Promise<void> {
  try {
    const { error } = await supabase.from("suno_generation_events").insert({
      user_id: p.userId,
      correlation_id: p.correlationId,
      outcome: p.outcome,
      http_status: p.httpStatus ?? null,
      error_code: p.errorCode ?? null,
      error_message: p.errorMessage ? String(p.errorMessage).slice(0, 500) : null,
      model_requested: p.modelRequested ?? null,
      model_used: p.modelUsed ?? null,
      retry_count: p.retryCount ?? 0,
      fallback_used: p.fallbackUsed ?? false,
      duration_ms: p.durationMs ?? null,
      track_id: p.trackId ?? null,
      task_id: p.taskId ?? null,
      suno_task_id: p.sunoTaskId ?? null,
      metadata: p.metadata ?? {},
    });
    if (error) {
      logger.warn("Failed to insert suno_generation_events", {
        correlationId: p.correlationId,
        outcome: p.outcome,
        error: error.message,
      });
    }
  } catch (err) {
    logger.warn("recordSunoEvent threw", {
      correlationId: p.correlationId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error: (err as any)?.message,
    });
  }
}
