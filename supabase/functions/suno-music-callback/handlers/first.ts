/**
 * First clip callback handler
 * Handles the initial streaming-ready clip (first version)
 */

import { getSupabaseClient } from "../../_shared/supabase-client.ts";
import { createLogger } from "../../_shared/logger.ts";
import { sanitizeAndCleanTitle } from "../../_shared/track-naming.ts";
import { extractClipFields, validateClip } from "../../_shared/suno-clip-fields.ts";

const logger = createLogger("first-callback");

export async function handleFirstCallback(payload: any, task: any) {
  const { data } = payload;
  const audioData = data?.data;
  const trackId = task.track_id;

  logger.info("First clip ready for streaming");
  const firstClip = audioData?.[0];
  if (!firstClip) {
    logger.warn("First callback with no clips", { trackId });
    return { success: true, callbackType: "first", skipped: true, reason: "empty_payload" };
  }

  const fields = extractClipFields(firstClip);
  // For "first" callbacks streaming URL is preferred but final audio URL is a valid fallback.
  const streamUrl = fields.streamUrl || fields.audioUrl;
  const imageUrl = fields.imageUrl;

  logger.debug("First clip data", {
    id: fields.id,
    title: fields.title,
    hasStream: !!streamUrl,
    hasImage: !!imageUrl,
    availableKeys: Object.keys(firstClip),
  });

  if (!streamUrl) {
    const skip = validateClip(firstClip, 0, { requireAudio: true });
    logger.error("First callback missing playable URL — skipping version creation", null, {
      trackId,
      skipCode: skip?.code,
      availableKeys: skip?.availableKeys,
    });
    return { success: true, callbackType: "first", skipped: true, reason: skip?.code ?? "missing_stream_url" };
  }
  if (!imageUrl) {
    logger.warn("First clip has no cover image yet", { trackId, clipId: fields.id });
  }

  const cleanedTitle = sanitizeAndCleanTitle(firstClip.title || task.tracks?.title, "Трек");
  const supabase = getSupabaseClient();

  const { error: trackUpdateError } = await supabase
    .from("tracks")
    .update({
      status: "streaming_ready",
      streaming_url: streamUrl,
      cover_url: imageUrl || null,
      title: cleanedTitle,
    })
    .eq("id", trackId);
  if (trackUpdateError) {
    logger.error("First callback failed to update track streaming fields", trackUpdateError, { trackId });
  }

  const { data: existingVersion, error: existingVersionError } = await supabase
    .from("track_versions")
    .select("id")
    .eq("track_id", trackId)
    .eq("version_label", "A")
    .maybeSingle();
  if (existingVersionError) {
    logger.error("First callback failed to lookup Version A", existingVersionError, { trackId });
  }

  if (!existingVersion && !existingVersionError) {
    const { data: newVersion, error: versionInsertError } = await supabase
      .from("track_versions")
      .insert({
        track_id: trackId,
        audio_url: streamUrl,
        cover_url: imageUrl,
        version_type: "initial",
        version_label: "A",
        clip_index: 0,
        is_primary: true,
        metadata: {
          suno_id: firstClip.id,
          suno_task_id: payload.data?.taskId || payload.data?.task_id,
          title: firstClip.title,
          status: "streaming",
        },
      })
      .select()
      .single();

    if (versionInsertError) {
      logger.error("First callback failed to create Version A", versionInsertError, { trackId, clipId: fields.id });
    }

    if (newVersion) {
      const { error: activeVersionError } = await supabase
        .from("tracks")
        .update({ active_version_id: newVersion.id })
        .eq("id", trackId);
      if (activeVersionError) {
        logger.error("First callback failed to set active Version A", activeVersionError, {
          trackId,
          versionId: newVersion.id,
        });
      }
      logger.success("Version A created", { versionId: newVersion.id });
    }
  }

  const { error: taskUpdateError } = await supabase
    .from("generation_tasks")
    .update({
      audio_clips: JSON.stringify([firstClip]),
      received_clips: 1,
      status: "streaming_ready",
    })
    .eq("id", task.id);
  if (taskUpdateError) {
    logger.error("First callback failed to update generation task", taskUpdateError, { trackId, taskId: task.id });
  }

  // Send progress notification to Telegram
  if (task.telegram_chat_id) {
    try {
      const notificationBody = task.telegram_message_id
        ? {
            type: "progress_update",
            chatId: task.telegram_chat_id,
            messageId: task.telegram_message_id,
            title: firstClip.title || task.prompt?.substring(0, 50) || "Трек",
            progress: 70,
            message: "🎵 Первая версия готова, обрабатываем...",
          }
        : {
            type: "progress",
            chatId: task.telegram_chat_id,
            trackId,
            title: firstClip.title || task.prompt?.substring(0, 50) || "Трек",
            progress: 70,
            message: "🎵 Первая версия готова, обрабатываем...",
          };

      await supabase.functions.invoke("send-telegram-notification", {
        body: notificationBody,
      });
    } catch (progressErr) {
      logger.warn("Failed to send progress notification", { error: progressErr });
    }
  }

  return {
    success: true,
    callbackType: "first",
    trackId,
    trackTitle: cleanedTitle,
  };
}
