/**
 * Sprint 054-A8: Generic API bridge for Suno per-task details endpoints.
 *
 * The 7 `suno-*-details` edge functions share a uniform contract:
 *   Request:  { taskId: string }
 *   Response: { success, taskId, status, ...taskTypeSpecific }
 *
 * Each edge maps the raw Suno response into a UI-friendly payload, but the
 * `status` field is normalized across all 7 endpoints:
 *   "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED"
 *
 * Used by `useSunoTaskDetails` generic hook (see
 * `src/hooks/generation/useSunoTaskDetails.ts`).
 */

import { supabase } from "@/integrations/supabase/client";

export type SunoTaskType = "music" | "cover" | "video" | "wav" | "midi" | "lyrics" | "separation";

/**
 * Terminal statuses from Suno per-task details endpoints.
 * Polling stops when status is SUCCESS or FAILED.
 */
export type SunoTaskStatus = "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";

export interface SunoTaskDetailsResponse {
  success: boolean;
  taskId: string;
  status: SunoTaskStatus;
  error?: string;
}

/**
 * Edge function name → task type. Each edge handles one Suno endpoint.
 */
const EDGE_FUNCTION_BY_TYPE: Record<SunoTaskType, string> = {
  music: "suno-music-details",
  cover: "suno-cover-details",
  video: "suno-video-details",
  wav: "suno-wav-details",
  midi: "suno-midi-details",
  lyrics: "suno-lyrics-details",
  separation: "suno-separation-details",
};

/**
 * Per-task-type polling interval (ms). Mirrors `BACKOFF_MS_BY_TYPE`
 * in `supabase/functions/_shared/suno-details.ts` — kept in sync by hand
 * (Deno ↔ frontend can't share code without publishing the helper).
 */
export const POLL_INTERVAL_MS_BY_TYPE: Record<SunoTaskType, number> = {
  lyrics: 1500,
  cover: 2000,
  music: 2000,
  wav: 3000,
  video: 3000,
  separation: 4000,
  midi: 5000,
};

/**
 * Fetch details for any Suno task. Returns the raw edge response — the
 * generic hook returns `T` so callers can narrow to task-type-specific
 * fields (clips, videoUrl, midiUrl, etc.) via the generic parameter.
 *
 * Throws on network/edge errors. Caller is responsible for handling
 * `success: false` payloads (the edge returns these for non-2xx upstream
 * responses from Suno).
 */
export async function getSunoTaskDetails<T extends SunoTaskDetailsResponse = SunoTaskDetailsResponse>(
  taskType: SunoTaskType,
  taskId: string,
): Promise<T> {
  const edgeFn = EDGE_FUNCTION_BY_TYPE[taskType];
  const { data, error } = await supabase.functions.invoke<T>(edgeFn, { body: { taskId } });

  if (error) {
    throw new Error(error.message || `suno-${taskType}-details failed`);
  }
  if (!data) {
    throw new Error(`suno-${taskType}-details returned no data`);
  }
  return data;
}

/**
 * Validate that a string is a supported task type. Used by the generic
 * hook to reject malformed inputs before invoking the edge.
 */
export function isSunoTaskType(value: unknown): value is SunoTaskType {
  return typeof value === "string" && value in EDGE_FUNCTION_BY_TYPE;
}
