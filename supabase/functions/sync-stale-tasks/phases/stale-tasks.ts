import { type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import { getAudioUrl, getImageUrl, getModelName, getStreamUrl } from "../../_shared/suno-clip-fields.ts";
import {
  getLyrics,
  isProviderSuccess,
  isProviderFailure,
  getRecoveredVersionType,
  getRecoveredSourceType,
} from "../utils.ts";
import type { StaleTask } from "../types.ts";

const logger = createLogger("sync-stale-tasks:stale");

const SUNO_API_BASE = "https://api.sunoapi.org/api/v1/generate/record-info";

export interface StaleTaskResult {
  updated: number;
  completed: number;
  failed: number;
}

/** Check and recover tasks stuck in processing/pending for >10 minutes. */
export async function processStaleTasks(
  supabase: SupabaseClient,
  sunoApiKey: string,
  userId: string | null,
): Promise<StaleTaskResult> {
  let query = supabase
    .from("generation_tasks")
    .select("*, tracks(*)")
    .in("status", ["pending", "processing"])
    .lt("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString())
    .not("suno_task_id", "is", null);

  if (userId) query = query.eq("user_id", userId);

  const { data: staleTasks, error } = await query;
  if (error) {
    logger.error("Error fetching stale tasks", error);
    throw error;
  }

  logger.info("Found stale tasks to check with Suno API", { count: staleTasks?.length || 0 });

  let updated = 0,
    completed = 0,
    failed = 0;

  for (const task of staleTasks || []) {
    try {
      logger.info("Checking task", { taskId: task.id, sunoTaskId: task.suno_task_id });

      const taskData = await fetchSunoTask(sunoApiKey, task.suno_task_id);
      if (!taskData) {
        logger.error("Suno API error", null, { taskId: task.id, status: "network error" });
        continue;
      }

      if (taskData.code !== 200) {
        logger.error("SunoAPI query error", null, { taskId: task.id, message: taskData.msg });
        await markAsFailed(supabase, task, taskData.msg || "Suno API error");
        failed++;
        continue;
      }

      logger.info("Task status", { taskId: task.id, status: taskData.data.status });

      if (isProviderSuccess(taskData.data.status) && taskData.data.response?.sunoData?.length) {
        await handleCompletedTask(supabase, task, taskData.data);
        completed++;
      } else if (isProviderFailure(taskData.data.status)) {
        await markAsFailed(supabase, task, taskData.data.errorMessage || "Generation failed");
        failed++;
      } else {
        logger.info("Task still processing", { taskId: task.id, status: taskData.data.status });
      }
      updated++;
    } catch (err) {
      logger.error("Error processing task", err, { taskId: task.id });
    }
  }

  return { updated, completed, failed };
}

async function fetchSunoTask(apiKey: string, taskId: string): Promise<any> {
  const resp = await fetch(`${SUNO_API_BASE}?taskId=${taskId}`, {
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  });
  if (!resp.ok) return null;
  return resp.json();
}

async function markAsFailed(supabase: SupabaseClient, task: StaleTask, message: string): Promise<void> {
  await supabase
    .from("generation_tasks")
    .update({
      status: "failed",
      error_message: message,
      completed_at: new Date().toISOString(),
    })
    .eq("id", task.id);

  if (task.track_id) {
    await supabase.from("tracks").update({ status: "failed", error_message: message }).eq("id", task.track_id);
  }
}

async function handleCompletedTask(supabase: SupabaseClient, task: StaleTask, taskData: any): Promise<void> {
  const clips = taskData.response.sunoData;
  const firstClip = clips[0];
  logger.info("Task completed, processing clips", { taskId: task.id, clipCount: clips.length });

  const audioUrl = getAudioUrl(firstClip);
  const imageUrl = getImageUrl(firstClip);
  let localAudioUrl: string | null = null,
    localCoverUrl: string | null = null;

  try {
    if (audioUrl)
      localAudioUrl = await uploadFile(
        supabase,
        audioUrl,
        `tracks/${task.user_id}/${task.track_id}_${Date.now()}.mp3`,
        "audio/mpeg",
      );
    if (imageUrl)
      localCoverUrl = await uploadFile(
        supabase,
        imageUrl,
        `covers/${task.user_id}/${task.track_id}_cover_${Date.now()}.jpg`,
        "image/jpeg",
      );
  } catch (err) {
    logger.error("Error downloading files for task", err, { taskId: task.id });
  }

  await supabase
    .from("tracks")
    .update({
      status: "completed",
      audio_url: audioUrl,
      streaming_url: getStreamUrl(firstClip) || audioUrl,
      local_audio_url: localAudioUrl,
      cover_url: imageUrl,
      local_cover_url: localCoverUrl,
      title: firstClip.title || task.tracks?.title,
      duration_seconds: Math.round(firstClip.duration) || null,
      tags: firstClip.tags,
      lyrics: getLyrics(firstClip),
      suno_id: firstClip.id,
      model_name: getModelName(firstClip) || "chirp-v4",
    })
    .eq("id", task.track_id);

  await supabase
    .from("generation_tasks")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      callback_received_at: new Date().toISOString(),
      audio_clips: clips,
      received_clips: clips.length,
    })
    .eq("id", task.id);

  await saveAllVersions(supabase, task, clips);
  await sendNotifications(supabase, task, clips, firstClip);
}

async function saveAllVersions(supabase: SupabaseClient, task: StaleTask, clips: any[]): Promise<void> {
  const labels = ["A", "B", "C", "D", "E"];
  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    const label = labels[i] || `V${i + 1}`;
    const clipAudio = getAudioUrl(clip);
    const clipImage = getImageUrl(clip);

    let va: string | null = null,
      vc: string | null = null;
    try {
      if (clipAudio)
        va = await uploadFile(
          supabase,
          clipAudio,
          `tracks/${task.user_id}/${task.track_id}_v${label}_${Date.now()}.mp3`,
          "audio/mpeg",
        );
      if (clipImage)
        vc = await uploadFile(
          supabase,
          clipImage,
          `covers/${task.user_id}/${task.track_id}_v${label}_cover_${Date.now()}.jpg`,
          "image/jpeg",
        );
    } catch (err) {
      logger.error("Error downloading files for version", err, { versionLabel: label });
    }

    const { data: existing } = await supabase
      .from("track_versions")
      .select("id")
      .eq("track_id", task.track_id)
      .eq("version_label", label)
      .maybeSingle();

    const vd = {
      audio_url: va || clipAudio,
      cover_url: vc || clipImage,
      duration_seconds: Math.round(clip.duration) || null,
      version_type: getRecoveredVersionType(task.generation_mode),
      source_type: getRecoveredSourceType(task.generation_mode),
      metadata: {
        suno_id: clip.id,
        title: clip.title,
        tags: clip.tags,
        lyrics: getLyrics(clip),
        model_name: getModelName(clip),
        synced_by: "sync_stale_tasks",
      },
    };

    if (existing) {
      await supabase.from("track_versions").update(vd).eq("id", existing.id);
    } else {
      const { data: nv } = await supabase
        .from("track_versions")
        .insert({ track_id: task.track_id, ...vd, version_label: label, clip_index: i, is_primary: i === 0 })
        .select()
        .single();
      if (nv && i === 0) {
        await supabase
          .from("tracks")
          .update({ active_version_id: nv.id })
          .eq("id", task.track_id)
          .is("active_version_id", null);
      }
    }

    await supabase.from("track_change_log").insert({
      track_id: task.track_id,
      user_id: task.user_id,
      change_type: i === 0 ? "generation_completed" : "version_created",
      changed_by: "sync_stale_tasks",
      metadata: { clip_index: i, suno_clip_id: clip.id, version_label: label, auto_synced: true },
    });
  }
}

async function sendNotifications(
  supabase: SupabaseClient,
  task: StaleTask,
  clips: any[],
  firstClip: any,
): Promise<void> {
  await supabase.from("notifications").insert({
    user_id: task.user_id,
    type: "track_generated",
    title: "🎵 Трек готов!",
    message: `Ваш трек "${firstClip.title || "Без названия"}" успешно сгенерирован`,
    action_url: `/library`,
    group_key: `generation_${task.id}`,
    metadata: { taskId: task.id, trackTitle: firstClip.title },
    priority: 8,
  });

  if (task.telegram_chat_id) {
    try {
      const max = Math.min(clips.length, 2);
      for (let i = 0; i < max; i++) {
        if (i > 0) await new Promise((r) => setTimeout(r, 1000));
        const clip = clips[i];
        const label = ["A", "B", "C", "D", "E"][i] || `V${i + 1}`;
        let title = clip.title || firstClip.title;
        if (!title || title === "Untitled" || title === "Трек") {
          const lines = (task.prompt || "").split("\n").filter((l: string) => l.trim().length > 0);
          title = lines.length > 0 ? lines[0].substring(0, 60).trim() : "AI Music Track";
          title = title.replace(/^(create|generate|make)\s+/i, "");
        }
        const t = max > 1 ? `${title} (версия ${label})` : title;
        await supabase.functions.invoke("send-telegram-notification", {
          body: {
            type: "generation_complete",
            task_id: task.id,
            chat_id: task.telegram_chat_id,
            track_id: task.track_id,
            audioUrl: getAudioUrl(clip),
            coverUrl: getImageUrl(clip),
            title: t,
            duration: clip.duration,
            tags: clip.tags,
            versionsCount: clips.length,
            versionLabel: label,
            currentVersion: i + 1,
            totalVersions: max,
            style: task.tracks?.style,
          },
        });
      }
    } catch (err) {
      logger.error("Error sending Telegram notification", err);
    }
  }
}

async function uploadFile(supabase: SupabaseClient, url: string, path: string, mime: string): Promise<string | null> {
  const resp = await fetch(url);
  if (!resp.ok) return null;
  const blob = await resp.blob();
  const { data } = await supabase.storage
    .from("project-assets")
    .upload(path, blob, { contentType: mime, upsert: true });
  if (!data) return null;
  return supabase.storage.from("project-assets").getPublicUrl(path).data.publicUrl;
}
