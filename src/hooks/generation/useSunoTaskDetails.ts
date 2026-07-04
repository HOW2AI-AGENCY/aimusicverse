/**
 * Sprint 054-A8: Generic polling hook for all 7 Suno per-task details endpoints.
 *
 * Replaces the previous plan of refactoring `suno-check-status` (which turned
 * out to be dead code — no client callers). This hook is the modern entry
 * point for any client-side Suno task polling.
 *
 * Pattern (per Sprint 052 retro): every TanStack Query hook MUST have unit
 * tests verifying the polling behavior, error surfacing, and terminal-status
 * stop condition.
 *
 * Usage:
 * ```ts
 * const { data, isPolling, stopPolling } = useSunoTaskDetails<MyShape>(
 *   taskId,
 *   "music",
 * );
 * ```
 *
 * Backoff per task type is sourced from `POLL_INTERVAL_MS_BY_TYPE`:
 *   - lyrics      1500ms
 *   - cover/music 2000ms
 *   - wav/video   3000ms
 *   - separation  4000ms
 *   - midi        5000ms
 *
 * Polling automatically stops on SUCCESS / FAILED status.
 */

import { useQuery } from "@tanstack/react-query";
import {
  getSunoTaskDetails,
  isSunoTaskType,
  POLL_INTERVAL_MS_BY_TYPE,
  type SunoTaskDetailsResponse,
  type SunoTaskType,
} from "@/api/suno-task-details.api";
import { logger } from "@/lib/logger";

export function useSunoTaskDetails<T extends SunoTaskDetailsResponse = SunoTaskDetailsResponse>(
  taskId: string | null | undefined,
  taskType: SunoTaskType,
) {
  const enabled = !!taskId && isSunoTaskType(taskType);
  const intervalMs = POLL_INTERVAL_MS_BY_TYPE[taskType] ?? 3000;

  return useQuery<T>({
    queryKey: ["suno-task-details", taskType, taskId] as const,
    queryFn: async () => {
      if (!taskId) throw new Error("taskId is required");
      if (!isSunoTaskType(taskType)) {
        throw new Error(`Unknown Suno taskType: ${String(taskType)}`);
      }
      const result = await getSunoTaskDetails<T>(taskType, taskId);
      logger.info("Suno task details fetched", { taskType, taskId, status: result.status });
      return result;
    },
    enabled,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === "SUCCESS" || data?.status === "FAILED") return false;
      return intervalMs;
    },
    refetchIntervalInBackground: false,
    staleTime: 0,
  });
}
