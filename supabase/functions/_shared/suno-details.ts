/**
 * Shared helpers for Suno per-task details endpoints.
 *
 * Sprint 054 — Details Suite.
 * Each `suno-*-details` edge function is 15-30 lines that delegates to
 * `fetchSunoTaskDetails(taskType, taskId)`. This keeps the contract uniform
 * across all 6 details endpoints and lets the dispatcher in `suno-check-status`
 * route calls by `taskType`.
 *
 * Endpoint map (per https://docs.sunoapi.org/llms.txt):
 *   - music       → /api/v1/generate/details
 *   - cover       → /api/v1/image/details
 *   - video       → /api/v1/mp4/details
 *   - wav         → /api/v1/generate/wav/details
 *   - midi        → /api/v1/generate/midi/details
 *   - lyrics      → /api/v1/lyrics/details
 *   - separation  → /api/v1/vocal-removal/details
 */

import { createLogger } from "./logger.ts";
import { isSunoSuccessCode } from "./suno.ts";

export type SunoTaskType = "music" | "cover" | "video" | "wav" | "midi" | "lyrics" | "separation";

export interface SunoTaskDetails {
  taskId: string;
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";
  // music + wav + separation return clips with urls; others return a single payload
  // Keep `data` flexible: each details endpoint has a different shape.
  data: Record<string, unknown>;
}

const ENDPOINT_BY_TYPE: Record<SunoTaskType, string> = {
  music: "https://api.sunoapi.org/api/v1/generate/details",
  cover: "https://api.sunoapi.org/api/v1/image/details",
  video: "https://api.sunoapi.org/api/v1/mp4/details",
  wav: "https://api.sunoapi.org/api/v1/generate/wav/details",
  midi: "https://api.sunoapi.org/api/v1/generate/midi/details",
  lyrics: "https://api.sunoapi.org/api/v1/lyrics/details",
  separation: "https://api.sunoapi.org/api/v1/vocal-removal/details",
};

/**
 * Backoff per task type. Some Suno tasks are quick (lyrics), others are slow (midi).
 * Values are base delay in ms; dispatcher applies exponential growth.
 */
export const BACKOFF_MS_BY_TYPE: Record<SunoTaskType, number> = {
  lyrics: 1500,
  cover: 2000,
  music: 2000,
  wav: 3000,
  video: 3000,
  separation: 4000,
  midi: 5000,
};

/**
 * Fetch raw details for a Suno task. Caller (each `*-details` edge) is
 * responsible for mapping the response into a UI-friendly payload.
 *
 * @throws Error if SUNO_API_KEY is missing, taskId is empty, or Suno API rejects
 */
export async function fetchSunoTaskDetails(taskType: SunoTaskType, taskId: string): Promise<SunoTaskDetails> {
  const log = createLogger("suno-details");
  const sunoApiKey = Deno.env.get("SUNO_API_KEY");

  if (!sunoApiKey) {
    throw new Error("SUNO_API_KEY not configured");
  }
  if (!taskId || typeof taskId !== "string") {
    throw new Error("taskId is required");
  }

  const url = ENDPOINT_BY_TYPE[taskType];
  log.info("Fetching Suno task details", { taskType, taskId });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sunoApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ taskId }),
  });

  const json = await response.json();
  if (!response.ok || !isSunoSuccessCode(json.code)) {
    log.warn("Suno details request failed", { taskType, taskId, status: response.status, body: json });
    throw new Error(json.msg || `Suno details request failed (${response.status})`);
  }

  // Suno returns `{ code, msg, data }`; `data` shape depends on taskType.
  // For uniformity we wrap it; the dispatcher or edge maps to UI fields.
  return {
    taskId,
    status: (json.data?.status as SunoTaskDetails["status"]) ?? "PROCESSING",
    data: json.data ?? {},
  };
}

/**
 * Validate that a string is one of the supported task types.
 * Used by `suno-check-status` dispatcher to reject unknown values early.
 */
export function isSunoTaskType(value: unknown): value is SunoTaskType {
  return typeof value === "string" && value in ENDPOINT_BY_TYPE;
}
