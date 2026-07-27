/**
 * Replace section callback handler
 * Processes section replacement generation results
 */

import { getSupabaseClient } from "../../_shared/supabase-client.ts";
import { createLogger } from "../../_shared/logger.ts";
import {
  getAudioUrl,
  getImageUrl,
  getModelName,
  getStreamUrl,
  validateClip,
  type SkipReason,
} from "../../_shared/suno-clip-fields.ts";
import { logAuditAction } from "../utils/audit-log.ts";

const logger = createLogger("replace-callback");

function parseObject(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
    } catch (_) {
      return {};
    }
  }

  return typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function pickString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

function getReplacementFullLyrics(task: any, clip: any): string | null {
  const params = parseObject(task.generation_params);
  return pickString(params.fullLyrics, params.full_lyrics, clip?.prompt);
}

function getReplacementTags(task: any, clip: any): string | null {
  const params = parseObject(task.generation_params);
  return pickString(clip?.tags, params.tags);
}

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

  const clips = Array.isArray(audioData) ? audioData : audioData ? [audioData] : [];
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

  const skippedClips: SkipReason[] = [];
  const createdVersions: { id: string; label: string; audioUrl: string; clip: any }[] = [];

  // Idempotency guard: check if versions for this task already exist (duplicate callback).
  const { data: existingVersions } = await supabase
    .from("track_versions")
    .select("id")
    .eq("track_id", trackId)
    .eq("metadata->>original_task_id", task.id);
  if (existingVersions && existingVersions.length > 0) {
    logger.info("Replace-section versions already exist for task, skipping duplicate callback", {
      taskId: task.id,
      trackId,
      existingCount: existingVersions.length,
    });
    return { success: true, callbackType: "replace_section_complete", versionsCreated: existingVersions.length };
  }

  // Create new versions for every returned variant (Suno normally returns A/B)
  const { data: latestVersion } = await supabase
    .from("track_versions")
    .select("version_label, clip_index")
    .eq("track_id", trackId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const baseLabelCode = latestVersion?.version_label?.length === 1 ? latestVersion.version_label.charCodeAt(0) + 1 : 65;

  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    const skip = validateClip(clip, i, { requireAudio: true });
    if (skip) {
      skippedClips.push(skip);
      logger.error("Skipping replace-section clip — validation failed", null, {
        skipCode: skip.code,
        clipIndex: i,
        availableKeys: skip.availableKeys,
        message: skip.message,
      });
      continue;
    }

    const audioUrl = getAudioUrl(clip) as string;
    const streamUrl = getStreamUrl(clip);
    const coverUrl = getImageUrl(clip);
    const replacementFullLyrics = getReplacementFullLyrics(task, clip);
    const replacementTags = getReplacementTags(task, clip);
    const versionLabel = String.fromCharCode(baseLabelCode + createdVersions.length);
    logger.info("Replace section clip received", {
      clipIndex: i,
      versionLabel,
      audioUrl: !!audioUrl,
      duration: clip.duration,
    });

    let localAudioUrl: string | null = null;
    try {
      const audioResponse = await fetch(audioUrl);
      if (audioResponse.ok) {
        const audioBlob = await audioResponse.blob();
        const audioFileName = `tracks/${task.user_id}/${trackId}_replace_${versionLabel}_${Date.now()}.mp3`;
        const { data: audioUpload } = await supabase.storage
          .from("project-assets")
          .upload(audioFileName, audioBlob, { contentType: "audio/mpeg", upsert: true });
        if (audioUpload) {
          localAudioUrl = supabase.storage.from("project-assets").getPublicUrl(audioFileName).data.publicUrl;
          logger.success("Replace section audio uploaded", { versionLabel });
        }
      }
    } catch (e) {
      logger.error("Failed to upload replace section audio", e, { versionLabel });
    }

    const finalAudioUrl = localAudioUrl || audioUrl;
    const { data: newVersion, error: versionInsertError } = await supabase
      .from("track_versions")
      .insert({
        track_id: trackId,
        audio_url: finalAudioUrl,
        cover_url: coverUrl || null,
        duration_seconds: Math.round(clip.duration) || null,
        version_type: "replace_section",
        version_label: versionLabel,
        clip_index: (latestVersion?.clip_index ?? 0) + i + 1,
        is_primary: false,
        metadata: {
          suno_id: clip.id,
          suno_task_id: task.suno_task_id,
          replace_section: true,
          original_task_id: task.id,
          source_audio_url: audioUrl,
          stream_audio_url: streamUrl,
          title: pickString(clip.title) || undefined,
          tags: replacementTags || undefined,
          lyrics: replacementFullLyrics || undefined,
          local_storage: { audio: localAudioUrl },
        },
      })
      .select()
      .single();

    if (versionInsertError || !newVersion) {
      logger.error("Failed to create replace-section version", versionInsertError, {
        taskId: task.id,
        trackId,
        versionLabel,
        clipIndex: i,
      });
      continue;
    }

    createdVersions.push({ id: newVersion.id, label: versionLabel, audioUrl: finalAudioUrl, clip });
    logger.success("Replace section version created", { versionLabel, versionId: newVersion.id });
  }

  if (createdVersions.length === 0) {
    await supabase
      .from("generation_tasks")
      .update({
        status: "failed",
        error_message: `No playable replace-section clips: ${skippedClips.map((s) => s.code).join(", ")}`,
        callback_received_at: new Date().toISOString(),
        audio_clips: clips,
        received_clips: 0,
      })
      .eq("id", task.id);
    return { success: false, error: "No playable clips" };
  }

  // Update task
  await supabase
    .from("generation_tasks")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      callback_received_at: new Date().toISOString(),
      audio_clips: clips,
      received_clips: createdVersions.length,
      error_message:
        skippedClips.length > 0
          ? `${skippedClips.length}/${clips.length} clips skipped: ${skippedClips.map((s) => s.code).join(", ")}`
          : null,
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

  await supabase.from("track_change_log").insert(
    createdVersions.map((version) => ({
      track_id: trackId,
      user_id: task.user_id,
      change_type: "replace_section_completed",
      changed_by: "suno_api",
      version_id: version.id,
      metadata: {
        taskId: task.suno_task_id,
        audioUrl: version.audioUrl,
        versionLabel: version.label,
        infillStartS: sectionStart,
        infillEndS: sectionEnd,
      },
    })),
  );

  const primaryCreated = createdVersions[0];

  // Atomically apply the replacement version (unset old primary,
  // set new primary, update track — all in one transaction).
  const { error: applyError } = await supabase.rpc("apply_replacement_version", {
    p_track_id: trackId,
    p_version_id: primaryCreated.id,
    p_audio_url: primaryCreated.audioUrl,
    p_streaming_url: getStreamUrl(primaryCreated.clip) || primaryCreated.audioUrl,
    p_cover_url: getImageUrl(primaryCreated.clip) || null,
    p_duration_seconds: primaryCreated.clip.duration ? Math.round(primaryCreated.clip.duration) : null,
    p_suno_id: primaryCreated.clip.id,
    p_suno_task_id: task.suno_task_id,
  });
  if (applyError) {
    logger.error("Failed to atomically apply replacement version", applyError, {
      taskId: task.id,
      trackId,
      versionId: primaryCreated.id,
    });
  }

  const primaryLyrics = getReplacementFullLyrics(task, primaryCreated.clip);
  const primaryTags = getReplacementTags(task, primaryCreated.clip);
  const trackContentUpdate: Record<string, unknown> = {};
  if (primaryLyrics) trackContentUpdate.lyrics = primaryLyrics;
  if (primaryTags) trackContentUpdate.tags = primaryTags;

  if (Object.keys(trackContentUpdate).length > 0) {
    const { error: contentUpdateError } = await supabase
      .from("tracks")
      .update(trackContentUpdate)
      .eq("id", trackId);

    if (contentUpdateError) {
      logger.error("Failed to persist replacement lyrics/tags on track", contentUpdateError, {
        taskId: task.id,
        trackId,
        hasLyrics: Boolean(primaryLyrics),
        hasTags: Boolean(primaryTags),
      });
    }
  }

  // Audit log
  await logAuditAction(supabaseUrl, supabaseServiceKey, {
    entityType: "track",
    entityId: trackId,
    userId: task.user_id,
    actorType: "ai",
    aiModelUsed: getModelName(primaryCreated.clip) || "suno-chirp-v4",
    actionType: "section_replaced",
    actionCategory: "modification",
    contentUrl: primaryCreated.audioUrl,
    promptUsed: task.prompt,
    inputMetadata: {
      suno_task_id: task.suno_task_id,
      section_start: sectionStart,
      section_end: sectionEnd,
      version_label: primaryCreated.label,
      variants_count: createdVersions.length,
    },
    outputMetadata: {
      audio_url: primaryCreated.audioUrl,
      duration_seconds: Math.round(primaryCreated.clip.duration),
      version_id: primaryCreated.id,
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
        audioUrl: primaryCreated.audioUrl,
        title: trackData?.title || "Новая секция",
        coverUrl: trackData?.cover_url,
        versionLabel: createdVersions.map((v) => v.label).join("/"),
        message: `Секция трека успешно заменена! Версии ${createdVersions.map((v) => v.label).join("/")}`,
      },
    });
  }

  await supabase.from("notifications").insert({
    user_id: task.user_id,
    type: "section_replaced",
    title: "Секция заменена 🎵",
    message:
      createdVersions.length > 1
        ? "Две версии секции готовы для прослушивания"
        : "Новая версия секции готова для прослушивания",
    action_url: `/studio/${trackId}`,
    group_key: `section_${task.id}`,
    metadata: { taskId: task.id, trackId, versionIds: createdVersions.map((v) => v.id) },
    priority: 6,
  });

  return { success: true, callbackType: "replace_section_complete", versionsCreated: createdVersions.length };
}
