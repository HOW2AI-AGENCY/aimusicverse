import { type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import {
  getAudioUrl,
  getImageUrl,
  getModelName,
  getStreamUrl,
  validateClip,
  type SkipReason,
} from "../../_shared/suno-clip-fields.ts";
import { getLyrics, getRecoveredVersionType, getRecoveredSourceType } from "../utils.ts";
import type { RecoveryTask } from "../types.ts";

const logger = createLogger("sync-stale-tasks:recovery");

/** Recover tracks where task completed but track didn't update. */
export async function recoverCompletedTasks(supabase: SupabaseClient, userId: string | null): Promise<number> {
  const RECOVERY_WINDOW_DAYS = 7;
  const RECOVERY_LIMIT = 25;

  let query = supabase
    .from("generation_tasks")
    .select("*, tracks(*)")
    .eq("status", "completed")
    .not("audio_clips", "is", null)
    .gte("created_at", new Date(Date.now() - RECOVERY_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(RECOVERY_LIMIT);

  if (userId) query = query.eq("user_id", userId);

  const { data: recoveryTasks, error } = await query;
  if (error) {
    logger.error("Error fetching recovery tasks", error);
    return 0;
  }

  logger.info("Found tasks for recovery check", { count: recoveryTasks?.length || 0 });
  let recoveredCount = 0;

  for (const task of recoveryTasks || []) {
    if (task.generation_mode === "replace_section") {
      recoveredCount += await recoverReplaceSection(supabase, task);
      continue;
    }

    if (!task.tracks) continue;
    if (task.tracks.status === "completed" && task.tracks.audio_url && task.tracks.active_version_id) continue;

    logger.info("Recovering track from completed task", { trackId: task.track_id, taskId: task.id });

    try {
      const clips = parseClips(task.audio_clips);
      if (!clips?.length) continue;

      await saveTrack(supabase, task, clips);
      await saveVersions(supabase, task, clips);
      recoveredCount++;
    } catch (err) {
      logger.error("Error recovering track", err, { trackId: task.track_id });
    }
  }

  return recoveredCount;
}

async function recoverReplaceSection(supabase: SupabaseClient, task: RecoveryTask): Promise<number> {
  const { data: existingVersions } = await supabase
    .from("track_versions")
    .select("id")
    .eq("track_id", task.track_id)
    .eq("metadata->>original_task_id", task.id);

  logger.info("Recovering replace_section task", { taskId: task.id });

  try {
    const clips = parseClips(task.audio_clips);
    if (!clips?.length) return 0;

    const existingCount = existingVersions?.length || 0;
    if (existingCount >= clips.length) return 0;

    const { data: latestVersion } = await supabase
      .from("track_versions")
      .select("version_label, clip_index")
      .eq("track_id", task.track_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const baseLabelCode =
      latestVersion?.version_label?.length === 1 ? latestVersion.version_label.charCodeAt(0) + 1 : 65;
    const skippedClips: SkipReason[] = [];
    const createdVersions: { id: string; label: string; audioUrl: string; clip: any }[] = [];

    for (let i = existingCount; i < clips.length; i++) {
      const clip = clips[i];
      const skip = validateClip(clip, i, { requireAudio: true });
      if (skip) {
        skippedClips.push(skip);
        logger.error("No audio URL in replace_section clip", null, { taskId: task.id, clipIndex: i });
        continue;
      }

      const audioUrl = getAudioUrl(clip) as string;
      const localAudioUrl = await downloadAndUploadSync(supabase, task, audioUrl, i, existingCount, baseLabelCode);
      const versionOffset = i - existingCount;
      const nextLabel = String.fromCharCode(baseLabelCode + versionOffset);
      const finalAudioUrl = localAudioUrl || audioUrl;

      const { data: insertedVersion, error: insertError } = await supabase
        .from("track_versions")
        .insert({
          track_id: task.track_id,
          audio_url: finalAudioUrl,
          cover_url: getImageUrl(clip),
          duration_seconds: Math.round(clip.duration) || null,
          version_type: "replace_section",
          version_label: nextLabel,
          clip_index: (latestVersion?.clip_index ?? 0) + versionOffset + 1,
          is_primary: false,
          metadata: {
            suno_id: clip.id,
            suno_task_id: task.suno_task_id,
            replace_section: true,
            original_task_id: task.id,
            source_audio_url: audioUrl,
            stream_audio_url: getStreamUrl(clip),
            recovered: true,
          },
        })
        .select("id")
        .single();

      if (insertError || !insertedVersion) {
        logger.error("Failed to create replace-section version", insertError, {
          taskId: task.id,
          trackId: task.track_id,
          versionLabel: nextLabel,
        });
        continue;
      }
      createdVersions.push({ id: insertedVersion.id, label: nextLabel, audioUrl: finalAudioUrl, clip });
    }

    if (skippedClips.length > 0) {
      await supabase
        .from("generation_tasks")
        .update({
          error_message: `${skippedClips.length}/${clips.length} clips skipped: ${skippedClips.map((s) => s.code).join(", ")}`,
        })
        .eq("id", task.id);
    }

    if (!createdVersions.length) return 0;
    const primary = createdVersions[0];
    await supabase.from("track_versions").update({ is_primary: false }).eq("track_id", task.track_id);
    await supabase.from("track_versions").update({ is_primary: true }).eq("id", primary.id);
    await supabase
      .from("tracks")
      .update({
        active_version_id: primary.id,
        audio_url: primary.audioUrl,
        streaming_url: getStreamUrl(primary.clip) || primary.audioUrl,
        cover_url: getImageUrl(primary.clip),
        duration_seconds: Math.round(primary.clip.duration) || null,
        suno_id: primary.clip.id,
        has_stems: false,
      })
      .eq("id", task.track_id);

    return 1;
  } catch (err) {
    logger.error("Error recovering replace_section task", err, { taskId: task.id });
    return 0;
  }
}

function parseClips(audioClips: unknown): any[] | null {
  let clips = audioClips;
  if (typeof clips === "string") {
    try {
      clips = JSON.parse(clips);
    } catch {
      return null;
    }
  }
  if (!clips || !Array.isArray(clips) || clips.length === 0) return null;
  return clips;
}

async function saveTrack(supabase: SupabaseClient, task: RecoveryTask, clips: any[]): Promise<void> {
  const firstClip = clips[0];
  const audioUrl = getAudioUrl(firstClip);
  const imageUrl = getImageUrl(firstClip);
  if (!audioUrl) return;

  let localAudioUrl: string | null = null;
  let localCoverUrl: string | null = null;

  try {
    if (audioUrl)
      localAudioUrl = await uploadRemoteFile(
        supabase,
        audioUrl,
        `tracks/${task.user_id}/${task.track_id}_recovered_${Date.now()}.mp3`,
        "audio/mpeg",
      );
    if (imageUrl)
      localCoverUrl = await uploadRemoteFile(
        supabase,
        imageUrl,
        `covers/${task.user_id}/${task.track_id}_recovered_cover_${Date.now()}.jpg`,
        "image/jpeg",
      );
  } catch (err) {
    logger.error("Error downloading files for recovery", err);
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
      title: firstClip.title || task.tracks?.title || "Recovered Track",
      duration_seconds: Math.round(firstClip.duration) || null,
      tags: firstClip.tags || task.tracks?.tags,
      lyrics: getLyrics(firstClip),
      suno_id: firstClip.id,
      model_name: getModelName(firstClip) || "chirp-v4",
    })
    .eq("id", task.track_id);
}

async function saveVersions(supabase: SupabaseClient, task: RecoveryTask, clips: any[]): Promise<void> {
  const versionLabels = ["A", "B", "C", "D", "E"];
  let primaryVersionId = task.tracks?.active_version_id || null;

  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    const versionLabel = versionLabels[i] || `V${i + 1}`;
    const clipAudioUrl = getAudioUrl(clip);
    const clipImageUrl = getImageUrl(clip);
    const shouldBePrimary = !primaryVersionId;

    const { data: existing } = await supabase
      .from("track_versions")
      .select("id")
      .eq("track_id", task.track_id)
      .eq("version_label", versionLabel)
      .maybeSingle();

    const versionData = {
      audio_url: clipAudioUrl,
      cover_url: clipImageUrl,
      duration_seconds: Math.round(clip.duration) || null,
      version_type: getRecoveredVersionType(task.generation_mode),
      source_type: getRecoveredSourceType(task.generation_mode),
      metadata: {
        suno_id: clip.id,
        title: clip.title,
        tags: clip.tags,
        lyrics: getLyrics(clip),
        model_name: getModelName(clip),
        recovered: true,
      },
    };

    if (existing) {
      await supabase
        .from("track_versions")
        .update({ ...versionData, is_primary: shouldBePrimary })
        .eq("id", existing.id);
      if (!primaryVersionId) primaryVersionId = existing.id;
    } else {
      const { data: newVersion } = await supabase
        .from("track_versions")
        .insert({
          track_id: task.track_id,
          ...versionData,
          version_label: versionLabel,
          clip_index: i,
          is_primary: shouldBePrimary,
        })
        .select("id")
        .single();

      if (newVersion && !primaryVersionId) primaryVersionId = newVersion.id;
    }
  }

  if (primaryVersionId && !task.tracks?.active_version_id) {
    await supabase.from("tracks").update({ active_version_id: primaryVersionId }).eq("id", task.track_id);
  }
}

async function uploadRemoteFile(
  supabase: SupabaseClient,
  url: string,
  path: string,
  mime: string,
): Promise<string | null> {
  const resp = await fetch(url);
  if (!resp.ok) return null;
  const blob = await resp.blob();
  const { data } = await supabase.storage
    .from("project-assets")
    .upload(path, blob, { contentType: mime, upsert: true });
  if (!data) return null;
  return supabase.storage.from("project-assets").getPublicUrl(path).data.publicUrl;
}

async function downloadAndUploadSync(
  supabase: SupabaseClient,
  task: RecoveryTask,
  url: string,
  i: number,
  existingCount: number,
  baseLabelCode: number,
): Promise<string | null> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const blob = await resp.blob();
    const offset = i - existingCount;
    const label = String.fromCharCode(baseLabelCode + offset);
    const path = `tracks/${task.user_id}/${task.track_id}_replace_${label}_${Date.now()}.mp3`;
    const { data } = await supabase.storage
      .from("project-assets")
      .upload(path, blob, { contentType: "audio/mpeg", upsert: true });
    if (!data) return null;
    return supabase.storage.from("project-assets").getPublicUrl(path).data.publicUrl;
  } catch {
    return null;
  }
}
