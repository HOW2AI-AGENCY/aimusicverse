import { getSupabaseClient } from "../../_shared/supabase-client.ts";
import { createLogger } from "../../_shared/logger.ts";

const supabase = getSupabaseClient();
const logger = createLogger("task-completion-utils");

export async function completeGenerationTask(
  taskId: string,
  trackId: string,
  clips: any[],
  savedVersionIds: Set<string>,
  skippedClips: any[],
  persistenceFailures: any[],
) {
  const expectedClips = 2;
  const createdClips = savedVersionIds.size;
  const allSkippedClips = [...skippedClips, ...persistenceFailures];
  const deliveryComplete = createdClips >= expectedClips;

  if (allSkippedClips.length > 0) {
    logger.warn("Some clips skipped in complete callback", {
      totalClips: clips.length,
      skippedCount: allSkippedClips.length,
      reasons: allSkippedClips.map((s: any) => ({ code: s.code, index: s.clipIndex, keys: s.availableKeys })),
    });
  }

  const { error: taskCompleteError } = await supabase
    .from("generation_tasks")
    .update({
      status: deliveryComplete ? "completed" : createdClips === 0 ? "failed" : "partial_delivery",
      completed_at: new Date().toISOString(),
      callback_received_at: new Date().toISOString(),
      audio_clips: JSON.stringify(clips),
      received_clips: createdClips,
      error_message:
        allSkippedClips.length > 0
          ? `${allSkippedClips.length}/${clips.length} clips skipped: ${allSkippedClips.map((s: any) => s.code).join(", ")}`
          : null,
    })
    .eq("id", taskId);
  if (taskCompleteError) {
    logger.error("Failed to mark generation task complete", taskCompleteError, { taskId, trackId });
  }
}

export async function createGenerationNotification(
  userId: string,
  trackId: string,
  trackTitle: string,
  clips: any[],
  savedVersionIds: Set<string>,
  skippedClips: any[],
  persistenceFailures: any[],
) {
  const allSkippedClips = [...skippedClips, ...persistenceFailures];
  const hasSkips = allSkippedClips.length > 0;
  const createdClips = savedVersionIds.size;

  const notifTitle = hasSkips
    ? createdClips === 0
      ? "⚠️ Генерация не удалась"
      : "⚠️ Трек готов частично"
    : "🎵 Трек готов!";
  const notifMessage = hasSkips
    ? `${createdClips}/${clips.length} версий создано. Пропущены: ${allSkippedClips.map((s: any) => `#${s.clipIndex + 1} (${s.code})`).join(", ")}`
    : `Ваш трек "${trackTitle}" успешно сгенерирован (${clips.length} версии)`;

  const { error: notificationError } = await supabase.from("notifications").insert({
    user_id: userId,
    title: notifTitle,
    message: notifMessage,
    type: hasSkips ? (createdClips === 0 ? "error" : "warning") : "success",
    action_url: `/library?track=${trackId}`,
    group_key: `generation_${taskId}`,
    metadata: {
      taskId,
      trackId,
      trackTitle,
      clipsCount: clips.length,
      createdClips,
      skippedClips: allSkippedClips,
    },
    priority: 8,
    read: false,
  });
  if (notificationError) {
    logger.error("Failed to create generation completion notification", notificationError, { taskId, trackId });
  }
}
