/**
 * Replace section callback handler
 * Processes section replacement generation results
 */

import { getSupabaseClient } from "../../_shared/supabase-client.ts";
import { createLogger } from "../../_shared/logger.ts";
import { logAuditAction } from "../utils/audit-log.ts";

const logger = createLogger("replace-callback");
const getAudioUrl = (clip: any) => clip.source_audio_url || clip.audio_url;

export async function handleReplaceSection(payload: any, task: any, supabaseUrl: string, supabaseServiceKey: string) {
  const { data } = payload;
  const audioData = data?.data;
  const trackId = task.track_id;
  const supabase = getSupabaseClient();

  const callbackType = data?.callbackType;
  logger.info("Processing replace_section callback", { callbackType });

  if (callbackType !== "complete") {
    return { success: true, callbackType, skipped: true };
  }

  const clips = audioData || [];
  if (clips.length === 0) {
    logger.error("No audio clips in replace_section callback");
    await supabase
      .from("generation_tasks")
      .update({
        status: "failed",
        error_message: "No audio clips received",
        callback_received_at: new Date().toISOString(),
      })
      .eq("id", task.id);
    return { success: false, error: "No clips" };
  }

  const clip = clips[0];
  const audioUrl = getAudioUrl(clip);
  logger.info("Replace section clip received", { audioUrl: !!audioUrl, duration: clip.duration });

  // Upload to storage
  let localAudioUrl = null;
  try {
    const audioResponse = await fetch(audioUrl);
    if (audioResponse.ok) {
      const audioBlob = await audioResponse.blob();
      const audioFileName = `tracks/${task.user_id}/${trackId}_replace_${Date.now()}.mp3`;
      const { data: audioUpload } = await supabase.storage
        .from("project-assets")
        .upload(audioFileName, audioBlob, { contentType: "audio/mpeg", upsert: true });
      if (audioUpload) {
        localAudioUrl = supabase.storage.from("project-assets").getPublicUrl(audioFileName).data.publicUrl;
        logger.success("Replace section audio uploaded");
      }
    }
  } catch (e) {
    logger.error("Failed to upload replace section audio", e);
  }

  const finalAudioUrl = localAudioUrl || audioUrl;

  // Create new version for replaced section
  const { data: latestVersion } = await supabase
    .from("track_versions")
    .select("version_label")
    .eq("track_id", trackId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const nextLabel = latestVersion?.version_label
    ? String.fromCharCode(latestVersion.version_label.charCodeAt(0) + 1)
    : "A";

  const { data: newVersion } = await supabase
    .from("track_versions")
    .insert({
      track_id: trackId,
      audio_url: finalAudioUrl,
      duration_seconds: Math.round(clip.duration) || null,
      version_type: "replace_section",
      version_label: nextLabel,
      is_primary: false,
      metadata: {
        suno_id: clip.id,
        suno_task_id: task.suno_task_id,
        replace_section: true,
        original_task_id: task.id,
      },
    })
    .select()
    .single();

  logger.success("Replace section version created", { versionLabel: nextLabel });

  // Update task
  await supabase
    .from("generation_tasks")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      callback_received_at: new Date().toISOString(),
      audio_clips: JSON.stringify(clips),
      received_clips: 1,
    })
    .eq("id", task.id);

  // Get section timing from log
  let sectionStart = 0;
  let sectionEnd = 0;
  try {
    const { data: startedLog } = await supabase
      .from("track_change_log")
      .select("metadata")
      .eq("track_id", trackId)
      .eq("change_type", "replace_section_started")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (startedLog?.metadata) {
      const meta = startedLog.metadata as { infillStartS?: number; infillEndS?: number };
      sectionStart = meta.infillStartS ?? 0;
      sectionEnd = meta.infillEndS ?? 0;
    }
  } catch (e) {
    logger.warn("Could not fetch section timing from started log");
  }

  // Log completion
  await supabase.from("track_change_log").insert({
    track_id: trackId,
    user_id: task.user_id,
    change_type: "replace_section_completed",
    changed_by: "suno_api",
    version_id: newVersion?.id,
    metadata: {
      taskId: task.suno_task_id,
      audioUrl: finalAudioUrl,
      versionLabel: nextLabel,
      infillStartS: sectionStart,
      infillEndS: sectionEnd,
    },
  });

  // Audit log
  await logAuditAction(supabaseUrl, supabaseServiceKey, {
    entityType: "track",
    entityId: trackId,
    userId: task.user_id,
    actorType: "ai",
    aiModelUsed: clip.model_name || "suno-chirp-v4",
    actionType: "section_replaced",
    actionCategory: "modification",
    contentUrl: finalAudioUrl,
    promptUsed: task.prompt,
    inputMetadata: {
      suno_task_id: task.suno_task_id,
      section_start: sectionStart,
      section_end: sectionEnd,
      version_label: nextLabel,
    },
    outputMetadata: {
      audio_url: finalAudioUrl,
      duration_seconds: Math.round(clip.duration),
      version_id: newVersion?.id,
    },
    chainId: task.id,
  });

  // Send notification
  if (task.telegram_chat_id) {
    const { data: trackData } = await supabase.from("tracks").select("title, cover_url").eq("id", trackId).single();

    await supabase.functions.invoke("send-telegram-notification", {
      body: {
        type: "section_replaced",
        chatId: task.telegram_chat_id,
        trackId,
        audioUrl: finalAudioUrl,
        title: trackData?.title || "Новая секция",
        coverUrl: trackData?.cover_url,
        versionLabel: nextLabel,
        message: `Секция трека успешно заменена! Версия ${nextLabel}`,
      },
    });
  }

  await supabase.from("notifications").insert({
    user_id: task.user_id,
    type: "section_replaced",
    title: "Секция заменена 🎵",
    message: "Новая версия секции готова для прослушивания",
    action_url: `/studio/${trackId}`,
    group_key: `section_${task.id}`,
    metadata: { taskId: task.id, trackId },
    priority: 6,
  });

  return { success: true, callbackType: "replace_section_complete" };
}
