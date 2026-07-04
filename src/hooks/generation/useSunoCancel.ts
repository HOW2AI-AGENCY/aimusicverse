/**
 * useSunoCancel — Sprint 055 P0-4 (055-A4)
 *
 * Soft-cancel mutation for an in-flight generation. Implementation note: the
 * Suno API does NOT expose a `/cancel` endpoint (verified 2026-07-04 vs.
 * gcui-art/suno-api docs); the upstream task continues running server-side.
 * What this hook actually does:
 *
 *   1. Updates `generation_tasks.status = 'cancelled'`, sets `cancelled_at`,
 *      and records `abort_reason` (default: `user_cancelled`). The local
 *      row reaches a terminal state so the polling loop in
 *      `useGenerateFormSubmit` (and any other loader reading generation
 *      status) exits cleanly.
 *
 *   2. Calls `invalidateQueries(['generation-tasks'])` — covers all consumers
 *      without enumerating each query key.
 *
 *   3. Emits a `feature_used → generation_cancel` analytics event with the
 *      userId and a boolean `succeeded` flag for outcome tracking.
 *
 * The hook returns `isCancelling` (rendering gate for the cancel button) plus
 * the `cancel(taskId)` callback. The component is responsible for closing
 * the sheet or routing away on success.
 *
 * Idempotency: calling cancel twice on the same taskId is a no-op on the DB
 * side (status was already 'cancelled'); the mutation only fails if RLS or
 * network blocks it.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cancelGenerationTask } from "@/api/generation.api";
import { useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/services/analytics/events.service";
import { logger } from "@/lib/logger";

interface UseSunoCancelResult {
  cancel: (taskId: string) => Promise<void>;
  isCancelling: boolean;
}

export function useSunoCancel(): UseSunoCancelResult {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (taskId: string) => {
      await cancelGenerationTask(taskId, "user_cancelled");
    },
    onSuccess: (_data, taskId) => {
      // Refresh everything that might be reading the task status.
      queryClient.invalidateQueries({ queryKey: ["generation-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["active-generations"] });
      // Sprint 055 analytics: cancel success.
      void trackEvent(
        {
          eventType: "feature_used",
          pagePath: "generation",
          metadata: { action: "cancel_complete", task_id: taskId, succeeded: true },
        },
        user?.id,
      );
      toast.success("Генерация отменена", {
        description: "Трек не будет создан. Запустите новую генерацию, когда будете готовы.",
        duration: 4000,
      });
    },
    onError: (error: unknown, taskId) => {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Suno cancel failed", error, { taskId });
      void trackEvent(
        {
          eventType: "feature_used",
          pagePath: "generation",
          metadata: { action: "cancel_complete", task_id: taskId, succeeded: false, error: message },
        },
        user?.id,
      );
      toast.error("Не удалось отменить генерацию", {
        description: "Кнопка будет доступна через несколько секунд.",
      });
    },
  });

  return {
    cancel: async (taskId: string) => {
      await mutation.mutateAsync(taskId);
    },
    isCancelling: mutation.isPending,
  };
}
