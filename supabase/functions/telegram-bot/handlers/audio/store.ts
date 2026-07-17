/**
 * Extracted helper to store temporary audio information for later actions.
 * Used by both the auto‑upload pipeline and classification flow.
 */

import { setPendingAudio } from "../../core/db-session-store.ts";
import { createLogger } from "../../../_shared/logger.ts";

const logger = createLogger("telegram-audio-store");

export async function storeTemporaryAudio(
  userId: number,
  fileId: string,
  type: "audio" | "voice" | "document",
  analysisResult?: { style?: string; genre?: string; mood?: string; lyrics?: string; hasVocals?: boolean },
): Promise<void> {
  try {
    await setPendingAudio(userId, fileId, type, analysisResult);
  } catch (e) {
    logger.error("Failed to store temporary audio", e);
  }
}
