import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authorize } from "../_shared/auth.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { createLogger } from "../_shared/logger.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  getAudioUrl,
  getImageUrl,
  getModelName,
  getStreamUrl,
  validateClip,
  type SkipReason,
} from "../_shared/suno-clip-fields.ts";
import {
  type TaskRecoveryStats,
  type RecoveryTask,
  type StaleTask,
  type StemTask,
  type TrackVersion,
} from "./types.ts";
import {
  getLyrics,
  STEM_TYPE_MAP,
  getStemInfoFromResponse,
  isProviderSuccess,
  isProviderFailure,
  getRecoveredVersionType,
  getRecoveredSourceType,
  VERSION_LABELS,
  downloadAndUpload,
  downloadTrackFiles,
} from "./utils.ts";
import {
  findRecoveryTasks,
  findStaleTasks,
  findStaleStemTasks,
  expireStaleGenerations,
  updateTrackVersion,
  insertTrackVersion,
  updateTrack,
  updateGenerationTask,
  updateStemSeparationTask,
  insertTrackStems,
  logTrackChange,
  insertNotification,
  invokeTelegramNotification,
  calculateRecoveryStats,
} from "./queries.ts";

const logger = createLogger("sync-stale-tasks");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const __auth = await authorize(req, { requireAdmin: true });
  if (!__auth.ok) {
    return new Response(JSON.stringify({ error: __auth.error }), {
      status: __auth.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const sunoApiKey = Deno.env.get("SUNO_API_KEY");

    if (!sunoApiKey) {
      throw new Error("SUNO_API_KEY not configured");
    }

    const supabase = getSupabaseClient();

    // Parse request body for optional user_id filter
    let userId: string | null = null;
    try {
      const body = await req.json();
      userId = body?.user_id || null;
    } catch {
      // No body or invalid JSON, proceed without filter
    }

    logger.info("Starting stale tasks sync", { userId: userId || "all users" });

    // PHASE 1: Find tasks with completed status but track not updated
    // This handles cases where callback succeeded but track update failed.
    // Time-bounded + row-capped to prevent runaway recovery loops on legacy data.
    const RECOVERY_WINDOW_DAYS = 7;
    const RECOVERY_LIMIT = 25;
    let recoveryQuery = supabase
      .from("generation_tasks")
      .select("*, tracks(*)")
      .eq("status", "completed")
      .not("audio_clips", "is", null)
      .gte("created_at", new Date(Date.now() - RECOVERY_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(RECOVERY_LIMIT);

    if (userId) {
      recoveryQuery = recoveryQuery.eq("user_id", userId);
    }

    const { data: recoveryTasks, error: recoveryError } = await recoveryQuery;

    if (recoveryError) {
      logger.error("Error fetching recovery tasks", recoveryError);
    } else {
      logger.info("Found tasks for recovery check", { count: recoveryTasks?.length || 0 });
      let recoveredCount = 0;

      // Recover tracks where task completed but track didn't update
      for (const task of recoveryTasks || []) {
        // Skip replace_section tasks - they don't update the main track
        if (task.generation_mode === "replace_section") {
          const { data: existingVersions } = await supabase
            .from("track_versions")
            .select("id")
            .eq("track_id", task.track_id)
            .eq("metadata->>original_task_id", task.id);

          logger.info("Recovering replace_section task", { taskId: task.id });

          try {
            let clips = task.audio_clips;
            if (typeof clips === "string") {
              clips = JSON.parse(clips);
            }

            if (!clips || !Array.isArray(clips) || clips.length === 0) {
              logger.error("No valid clips in replace_section task", null, { taskId: task.id });
              continue;
            }

            const existingCount = existingVersions?.length || 0;
            if (existingCount >= clips.length) continue;

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
                logger.error("No audio URL in replace_section clip", null, {
                  taskId: task.id,
                  clipIndex: i,
                  skipCode: skip.code,
                  availableKeys: skip.availableKeys,
                });
                continue;
              }

              const audioUrl = getAudioUrl(clip) as string;
              let localAudioUrl = null;
              try {
                const audioResponse = await fetch(audioUrl);
                if (audioResponse.ok) {
                  const audioBlob = await audioResponse.blob();
                  const versionOffset = i - existingCount;
                  const versionLabelForFile = String.fromCharCode(baseLabelCode + versionOffset);
                  const audioFileName = `tracks/${task.user_id}/${task.track_id}_replace_${versionLabelForFile}_${Date.now()}.mp3`;
                  const { data: audioUpload } = await supabase.storage
                    .from("project-assets")
                    .upload(audioFileName, audioBlob, { contentType: "audio/mpeg", upsert: true });
                  if (audioUpload) {
                    localAudioUrl = supabase.storage.from("project-assets").getPublicUrl(audioFileName).data.publicUrl;
                  }
                }
              } catch (downloadError) {
                logger.error("Error downloading replace_section audio", downloadError);
              }

              const versionOffset = i - existingCount;
              const nextLabel = String.fromCharCode(baseLabelCode + versionOffset);
              const finalAudioUrl = localAudioUrl || audioUrl;
              const { data: insertedVersion, error: insertVersionError } = await supabase
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

              if (insertVersionError || !insertedVersion) {
                logger.error("Failed to create recovered replace-section version", insertVersionError, {
                  taskId: task.id,
                  trackId: task.track_id,
                  versionLabel: nextLabel,
                  clipIndex: i,
                });
                continue;
              }

              createdVersions.push({ id: insertedVersion.id, label: nextLabel, audioUrl: finalAudioUrl, clip });
              logger.info("Replace section version created", { versionLabel: nextLabel, taskId: task.id });
            }

            if (skippedClips.length > 0) {
              await supabase
                .from("generation_tasks")
                .update({
                  error_message: `${skippedClips.length}/${clips.length} clips skipped: ${skippedClips.map((s) => s.code).join(", ")}`,
                })
                .eq("id", task.id);
            }

            if (createdVersions.length === 0) continue;
            const primaryCreated = createdVersions[0];
            const { error: unsetPrimaryError } = await supabase
              .from("track_versions")
              .update({ is_primary: false })
              .eq("track_id", task.track_id);
            if (unsetPrimaryError) {
              logger.error("Failed to unset primary versions for recovered replacement", unsetPrimaryError, {
                taskId: task.id,
                trackId: task.track_id,
              });
            }

            const { error: setPrimaryError } = await supabase
              .from("track_versions")
              .update({ is_primary: true })
              .eq("id", primaryCreated.id);
            if (setPrimaryError) {
              logger.error("Failed to set recovered replacement primary", setPrimaryError, {
                taskId: task.id,
                trackId: task.track_id,
                versionId: primaryCreated.id,
              });
            }

            const { error: replacementTrackError } = await supabase
              .from("tracks")
              .update({
                active_version_id: primaryCreated.id,
                audio_url: primaryCreated.audioUrl,
                streaming_url: getStreamUrl(primaryCreated.clip) || primaryCreated.audioUrl,
                cover_url: getImageUrl(primaryCreated.clip),
                duration_seconds: Math.round(primaryCreated.clip.duration) || null,
                suno_id: primaryCreated.clip.id,
                has_stems: false,
              })
              .eq("id", task.track_id);
            if (replacementTrackError) {
              logger.error("Failed to apply recovered replacement to track", replacementTrackError, {
                taskId: task.id,
                trackId: task.track_id,
              });
            }
            recoveredCount++;
            continue;
          } catch (recoveryErr) {
            logger.error("Error recovering replace_section task", recoveryErr, { taskId: task.id });
            continue;
          }
        }

        // Skip only if track is fully healed (status=completed, has audio, and has an active version).
        // Otherwise recover: track may be marked "completed" but missing audio_url/versions.
        if (!task.tracks) continue;
        if (task.tracks.status === "completed" && task.tracks.audio_url && task.tracks.active_version_id) continue;

        logger.info("Recovering track from completed task", { trackId: task.track_id, taskId: task.id });

        try {
          // Parse audio_clips - handle both string and object
          let clips = task.audio_clips;
          if (typeof clips === "string") {
            clips = JSON.parse(clips);
          }

          if (!clips || !Array.isArray(clips) || clips.length === 0) {
            logger.error("No valid clips in task", null, { taskId: task.id });
            continue;
          }

          const firstClip = clips[0];
          const audioUrl = getAudioUrl(firstClip);
          const imageUrl = getImageUrl(firstClip);
          const lyrics = getLyrics(firstClip);

          if (!audioUrl) {
            logger.error("No audio URL in clip", null, { taskId: task.id });
            continue;
          }

          // Download and save files
          let localAudioUrl = null;
          let localCoverUrl = null;

          try {
            if (audioUrl) {
              const audioResponse = await fetch(audioUrl);
              if (audioResponse.ok) {
                const audioBlob = await audioResponse.blob();
                const audioFileName = `tracks/${task.user_id}/${task.track_id}_recovered_${Date.now()}.mp3`;
                const { data: audioUpload } = await supabase.storage
                  .from("project-assets")
                  .upload(audioFileName, audioBlob, { contentType: "audio/mpeg", upsert: true });
                if (audioUpload) {
                  localAudioUrl = supabase.storage.from("project-assets").getPublicUrl(audioFileName).data.publicUrl;
                }
              }
            }

            if (imageUrl) {
              const coverResponse = await fetch(imageUrl);
              if (coverResponse.ok) {
                const coverBlob = await coverResponse.blob();
                const coverFileName = `covers/${task.user_id}/${task.track_id}_recovered_cover_${Date.now()}.jpg`;
                const { data: coverUpload } = await supabase.storage
                  .from("project-assets")
                  .upload(coverFileName, coverBlob, { contentType: "image/jpeg", upsert: true });
                if (coverUpload) {
                  localCoverUrl = supabase.storage.from("project-assets").getPublicUrl(coverFileName).data.publicUrl;
                }
              }
            }
          } catch (downloadError) {
            logger.error("Error downloading files for recovery", downloadError);
          }

          // Update main track record
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
              lyrics: lyrics,
              suno_id: firstClip.id,
              model_name: getModelName(firstClip) || "chirp-v4",
            })
            .eq("id", task.track_id);

          // Create versions for all clips
          const versionLabels = ["A", "B", "C", "D", "E"];
          let primaryVersionId = task.tracks?.active_version_id || null;
          for (let i = 0; i < clips.length; i++) {
            const clip = clips[i];
            const versionLabel = versionLabels[i] || `V${i + 1}`;
            const clipAudioUrl = getAudioUrl(clip);
            const clipImageUrl = getImageUrl(clip);
            const shouldBePrimary = !primaryVersionId;

            // Check if version already exists. maybeSingle avoids treating
            // a legitimately missing row as an error.
            const { data: existingVersion, error: existingVersionError } = await supabase
              .from("track_versions")
              .select("id")
              .eq("track_id", task.track_id)
              .eq("version_label", versionLabel)
              .maybeSingle();

            if (existingVersionError) {
              logger.error("Failed to lookup recovered track version", existingVersionError, {
                taskId: task.id,
                trackId: task.track_id,
                versionLabel,
                clipIndex: i,
              });
              continue;
            }

            const versionData = {
              audio_url: i === 0 ? localAudioUrl || clipAudioUrl : clipAudioUrl,
              cover_url: i === 0 ? localCoverUrl || clipImageUrl : clipImageUrl,
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

            if (existingVersion) {
              const { error: versionUpdateError } = await supabase
                .from("track_versions")
                .update({ ...versionData, is_primary: shouldBePrimary })
                .eq("id", existingVersion.id);
              if (versionUpdateError) {
                logger.error("Failed to update recovered track version", versionUpdateError, {
                  taskId: task.id,
                  trackId: task.track_id,
                  versionId: existingVersion.id,
                  versionLabel,
                  clipIndex: i,
                });
                continue;
              }
              if (!primaryVersionId) primaryVersionId = existingVersion.id;
            } else {
              const { data: newVersion, error: versionInsertError } = await supabase
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

              if (versionInsertError || !newVersion) {
                logger.error("Failed to create recovered track version", versionInsertError, {
                  taskId: task.id,
                  trackId: task.track_id,
                  versionLabel,
                  clipIndex: i,
                });
                continue;
              }

              if (!primaryVersionId && newVersion) primaryVersionId = newVersion.id;
              logger.info("Version created for recovered track", { versionLabel });
            }
          }

          if (primaryVersionId && !task.tracks.active_version_id) {
            const { error: activeVersionError } = await supabase
              .from("tracks")
              .update({ active_version_id: primaryVersionId })
              .eq("id", task.track_id);

            if (activeVersionError) {
              logger.error("Failed to update recovered track active version", activeVersionError, {
                taskId: task.id,
                trackId: task.track_id,
                primaryVersionId,
              });
            }
          }

          logger.info("Track recovered successfully", { trackId: task.track_id });
          recoveredCount++;
        } catch (recoveryErr) {
          logger.error("Error recovering track", recoveryErr, { trackId: task.track_id });
        }
      }
    }

    // PHASE 2: Find tasks stuck in processing/pending for more than 10 minutes
    let staleQuery = supabase
      .from("generation_tasks")
      .select("*, tracks(*)")
      .in("status", ["pending", "processing"])
      .lt("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString())
      .not("suno_task_id", "is", null);

    if (userId) {
      staleQuery = staleQuery.eq("user_id", userId);
    }

    const { data: staleTasks, error: fetchError } = await staleQuery;

    if (fetchError) {
      logger.error("Error fetching stale tasks", fetchError);
      throw fetchError;
    }

    logger.info("Found stale tasks to check with Suno API", { count: staleTasks?.length || 0 });

    let updatedCount = 0;
    let failedCount = 0;
    let completedCount = 0;

    for (const task of staleTasks || []) {
      try {
        logger.info("Checking task", { taskId: task.id, sunoTaskId: task.suno_task_id });

        // Query Suno API for task status
        const sunoResponse = await fetch(
          `https://api.sunoapi.org/api/v1/generate/record-info?taskId=${task.suno_task_id}`,
          {
            headers: {
              Authorization: `Bearer ${sunoApiKey}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!sunoResponse.ok) {
          logger.error("Suno API error", null, { taskId: task.id, status: sunoResponse.status });
          continue;
        }

        const sunoData = await sunoResponse.json();

        if (sunoData.code !== 200) {
          logger.error("SunoAPI query error", null, { taskId: task.id, message: sunoData.msg });

          // Mark as failed if Suno API returns error
          await supabase
            .from("generation_tasks")
            .update({
              status: "failed",
              error_message: sunoData.msg || "Suno API error",
              completed_at: new Date().toISOString(),
            })
            .eq("id", task.id);

          if (task.track_id) {
            await supabase
              .from("tracks")
              .update({
                status: "failed",
                error_message: sunoData.msg || "Suno API error",
              })
              .eq("id", task.track_id);
          }

          failedCount++;
          continue;
        }

        const taskData = sunoData.data;
        logger.info("Task status", { taskId: task.id, status: taskData.status });

        // Check if generation is complete
        if (
          isProviderSuccess(taskData.status) &&
          taskData.response?.sunoData &&
          taskData.response.sunoData.length > 0
        ) {
          const clips = taskData.response.sunoData;
          const firstClip = clips[0];
          logger.info("Task completed, processing clips", { taskId: task.id, clipCount: clips.length });

          // Download and save files for first clip
          let localAudioUrl = null;
          let localCoverUrl = null;
          const audioUrl = getAudioUrl(firstClip);
          const imageUrl = getImageUrl(firstClip);

          try {
            if (audioUrl) {
              const audioResponse = await fetch(audioUrl);
              if (audioResponse.ok) {
                const audioBlob = await audioResponse.blob();
                const audioFileName = `tracks/${task.user_id}/${task.track_id}_${Date.now()}.mp3`;
                const { data: audioUpload } = await supabase.storage
                  .from("project-assets")
                  .upload(audioFileName, audioBlob, { contentType: "audio/mpeg", upsert: true });
                if (audioUpload) {
                  localAudioUrl = supabase.storage.from("project-assets").getPublicUrl(audioFileName).data.publicUrl;
                }
              }
            }

            if (imageUrl) {
              const coverResponse = await fetch(imageUrl);
              if (coverResponse.ok) {
                const coverBlob = await coverResponse.blob();
                const coverFileName = `covers/${task.user_id}/${task.track_id}_cover_${Date.now()}.jpg`;
                const { data: coverUpload } = await supabase.storage
                  .from("project-assets")
                  .upload(coverFileName, coverBlob, { contentType: "image/jpeg", upsert: true });
                if (coverUpload) {
                  localCoverUrl = supabase.storage.from("project-assets").getPublicUrl(coverFileName).data.publicUrl;
                }
              }
            }
          } catch (downloadError) {
            logger.error("Error downloading files for task", downloadError, { taskId: task.id });
          }

          // Update track with snake_case field access
          const { error: trackUpdateError } = await supabase
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

          if (trackUpdateError) {
            // Never let a write failure pass silently: an unreported failure here
            // leaves the user with a playable-looking but broken track.
            logger.error("Failed to update track during sync", trackUpdateError, {
              taskId: task.id,
              trackId: task.track_id,
            });
          }

          // Update generation task
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

          // Save ALL clips as versions
          logger.info("Saving versions", { count: clips.length });
          const versionLabels = ["A", "B", "C", "D", "E"];

          for (let i = 0; i < clips.length; i++) {
            const clip = clips[i];
            const versionLabel = versionLabels[i] || `V${i + 1}`;
            const clipAudioUrl = getAudioUrl(clip);
            const clipImageUrl = getImageUrl(clip);

            // Download files for each version
            let versionLocalAudioUrl = null;
            let versionLocalCoverUrl = null;

            try {
              if (clipAudioUrl) {
                const audioResponse = await fetch(clipAudioUrl);
                if (audioResponse.ok) {
                  const audioBlob = await audioResponse.blob();
                  const audioFileName = `tracks/${task.user_id}/${task.track_id}_v${versionLabel}_${Date.now()}.mp3`;
                  const { data: audioUpload } = await supabase.storage
                    .from("project-assets")
                    .upload(audioFileName, audioBlob, { contentType: "audio/mpeg", upsert: true });
                  if (audioUpload) {
                    versionLocalAudioUrl = supabase.storage.from("project-assets").getPublicUrl(audioFileName)
                      .data.publicUrl;
                  }
                }
              }

              if (clipImageUrl) {
                const coverResponse = await fetch(clipImageUrl);
                if (coverResponse.ok) {
                  const coverBlob = await coverResponse.blob();
                  const coverFileName = `covers/${task.user_id}/${task.track_id}_v${versionLabel}_cover_${Date.now()}.jpg`;
                  const { data: coverUpload } = await supabase.storage
                    .from("project-assets")
                    .upload(coverFileName, coverBlob, { contentType: "image/jpeg", upsert: true });
                  if (coverUpload) {
                    versionLocalCoverUrl = supabase.storage.from("project-assets").getPublicUrl(coverFileName)
                      .data.publicUrl;
                  }
                }
              }
            } catch (downloadError) {
              logger.error("Error downloading files for version", downloadError, { versionLabel });
            }

            // Check if version exists. maybeSingle avoids treating "not found" as
            // an error, but real lookup errors must be logged before writes.
            const { data: existingVersion, error: existingVersionError } = await supabase
              .from("track_versions")
              .select("id")
              .eq("track_id", task.track_id)
              .eq("version_label", versionLabel)
              .maybeSingle();

            if (existingVersionError) {
              logger.error("Failed to lookup track version during sync", existingVersionError, {
                taskId: task.id,
                trackId: task.track_id,
                versionLabel,
                clipIndex: i,
              });
              continue;
            }

            const versionData = {
              audio_url: versionLocalAudioUrl || clipAudioUrl,
              cover_url: versionLocalCoverUrl || clipImageUrl,
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

            if (existingVersion) {
              const { error: versionUpdateError } = await supabase
                .from("track_versions")
                .update(versionData)
                .eq("id", existingVersion.id);
              if (versionUpdateError) {
                logger.error("Failed to update track version during sync", versionUpdateError, {
                  taskId: task.id,
                  trackId: task.track_id,
                  versionLabel,
                });
                continue;
              }
            } else {
              const { data: newVersion, error: versionInsertError } = await supabase
                .from("track_versions")
                .insert({
                  track_id: task.track_id,
                  ...versionData,
                  version_label: versionLabel,
                  clip_index: i,
                  is_primary: i === 0,
                })
                .select()
                .single();

              if (versionInsertError || !newVersion) {
                logger.error("Failed to insert track version during sync", versionInsertError, {
                  taskId: task.id,
                  trackId: task.track_id,
                  versionLabel,
                  clipIndex: i,
                });
                continue;
              }

              if (i === 0) {
                const { error: activeVersionError } = await supabase
                  .from("tracks")
                  .update({ active_version_id: newVersion.id })
                  .eq("id", task.track_id)
                  .is("active_version_id", null);
                if (activeVersionError) {
                  logger.error("Failed to set active version during sync", activeVersionError, {
                    taskId: task.id,
                    trackId: task.track_id,
                    versionId: newVersion.id,
                  });
                }
              }
            }

            logger.info("Version saved", { versionLabel });

            // Log version creation
            await supabase.from("track_change_log").insert({
              track_id: task.track_id,
              user_id: task.user_id,
              change_type: i === 0 ? "generation_completed" : "version_created",
              changed_by: "sync_stale_tasks",
              metadata: {
                clip_index: i,
                suno_clip_id: clip.id,
                version_label: versionLabel,
                auto_synced: true,
              },
            });
          }

          // Create notification with group_key for auto-replace
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

          // Send Telegram notification if chat_id exists - send BOTH versions
          if (task.telegram_chat_id) {
            try {
              const maxClipsToSend = Math.min(clips.length, 2);
              logger.info("Sending track versions via sync-stale-tasks", { count: maxClipsToSend });

              for (let i = 0; i < maxClipsToSend; i++) {
                const clip = clips[i];
                const versionLabel = ["A", "B", "C", "D", "E"][i] || `V${i + 1}`;

                // Get readable title
                let trackTitle = clip.title || firstClip.title;
                if (!trackTitle || trackTitle === "Untitled" || trackTitle === "Трек") {
                  const promptLines = (task.prompt || "").split("\n").filter((line: string) => line.trim().length > 0);
                  trackTitle = promptLines.length > 0 ? promptLines[0].substring(0, 60).trim() : "AI Music Track";
                  trackTitle = trackTitle.replace(/^(create|generate|make)\s+/i, "");
                }

                const titleWithVersion = maxClipsToSend > 1 ? `${trackTitle} (версия ${versionLabel})` : trackTitle;

                // Delay between messages
                if (i > 0) {
                  await new Promise((resolve) => setTimeout(resolve, 1000));
                }

                await supabase.functions.invoke("send-telegram-notification", {
                  body: {
                    type: "generation_complete",
                    task_id: task.id,
                    chat_id: task.telegram_chat_id,
                    track_id: task.track_id,
                    audioUrl: getAudioUrl(clip),
                    coverUrl: getImageUrl(clip),
                    title: titleWithVersion,
                    duration: clip.duration,
                    tags: clip.tags,
                    versionsCount: clips.length,
                    versionLabel: versionLabel,
                    currentVersion: i + 1,
                    totalVersions: maxClipsToSend,
                    style: task.tracks?.style,
                  },
                });
              }
            } catch (notifError) {
              logger.error("Error sending Telegram notification", notifError);
            }
          }

          completedCount++;
        } else if (isProviderFailure(taskData.status)) {
          // Mark as failed
          const errorMessage = taskData.errorMessage || "Generation failed";
          logger.info("Task failed", { taskId: task.id, errorMessage });

          await supabase
            .from("generation_tasks")
            .update({
              status: "failed",
              error_message: errorMessage,
              completed_at: new Date().toISOString(),
            })
            .eq("id", task.id);

          if (task.track_id) {
            await supabase
              .from("tracks")
              .update({
                status: "failed",
                error_message: errorMessage,
              })
              .eq("id", task.track_id);
          }

          failedCount++;
        } else {
          logger.info("Task still processing", { taskId: task.id, status: taskData.status });
        }

        updatedCount++;
      } catch (taskError: any) {
        logger.error("Error processing task", taskError, { taskId: task.id });
      }
    }

    // PHASE 3: Recover stem-separation tasks when the provider callback was lost.
    let stemCheckedCount = 0;
    let stemCompletedCount = 0;
    let stemFailedCount = 0;
    let stemQuery = supabase
      .from("stem_separation_tasks")
      .select("*, tracks(*)")
      .eq("status", "processing")
      .lt("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .order("created_at", { ascending: true })
      .limit(20);

    if (userId) {
      stemQuery = stemQuery.eq("tracks.user_id", userId);
    }

    const { data: staleStemTasks, error: staleStemError } = await stemQuery;
    if (staleStemError) {
      logger.error("Error fetching stale stem tasks", staleStemError);
    } else {
      logger.info("Found stale stem tasks to check with Suno API", { count: staleStemTasks?.length || 0 });
    }

    for (const stemTask of staleStemTasks || []) {
      stemCheckedCount++;
      try {
        const separationTaskId = stemTask.separation_task_id;
        if (!separationTaskId) continue;

        const stemResponse = await fetch(
          `https://api.sunoapi.org/api/v1/vocal-removal/record-info?taskId=${separationTaskId}`,
          {
            headers: {
              Authorization: `Bearer ${sunoApiKey}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!stemResponse.ok) {
          logger.error("Suno stem record-info HTTP error", null, {
            taskId: stemTask.id,
            separationTaskId,
            status: stemResponse.status,
          });
          continue;
        }

        const stemData = await stemResponse.json();
        if (stemData.code !== 200) {
          logger.error("Suno stem record-info error", null, {
            taskId: stemTask.id,
            separationTaskId,
            message: stemData.msg,
          });
          continue;
        }

        const providerData = stemData.data;
        const providerStatus = providerData?.status;
        logger.info("Stem task status", { taskId: stemTask.id, separationTaskId, status: providerStatus });

        if (isProviderFailure(providerStatus)) {
          const errorMessage = providerData?.errorMessage || providerData?.error_message || "Stem separation failed";
          await supabase
            .from("stem_separation_tasks")
            .update({ status: "failed", completed_at: new Date().toISOString() })
            .eq("id", stemTask.id);
          await supabase.from("track_change_log").insert({
            track_id: stemTask.track_id,
            user_id: stemTask.tracks?.user_id,
            change_type: "vocal_separation_failed",
            changed_by: "sync_stale_tasks",
            metadata: { error: errorMessage, separation_task_id: separationTaskId, auto_synced: true },
          });
          stemFailedCount++;
          continue;
        }

        const stemInfo = getStemInfoFromResponse(providerData);
        const stemsToInsert: Array<{
          track_id: string;
          stem_type: string;
          audio_url: string;
          separation_mode: string;
        }> = [];

        for (const [key, stemType] of Object.entries(STEM_TYPE_MAP)) {
          const url = stemInfo?.[key];
          if (!url || typeof url !== "string") continue;

          let localUrl = url;
          try {
            const response = await fetch(url);
            if (response.ok) {
              const blob = await response.blob();
              const fileName = `${stemTask.track_id}_${stemType}_${Date.now()}.mp3`;
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from("project-assets")
                .upload(`stems/${fileName}`, blob, { contentType: "audio/mpeg", upsert: true });
              if (uploadError) {
                logger.error("Failed to upload recovered stem", uploadError, { trackId: stemTask.track_id, stemType });
              } else if (uploadData) {
                localUrl = supabase.storage.from("project-assets").getPublicUrl(`stems/${fileName}`).data.publicUrl;
              }
            }
          } catch (downloadError) {
            logger.error("Error downloading recovered stem", downloadError, { trackId: stemTask.track_id, stemType });
          }

          stemsToInsert.push({
            track_id: stemTask.track_id,
            stem_type: stemType,
            audio_url: localUrl,
            separation_mode: stemTask.mode || "simple",
          });
        }

        if (stemsToInsert.length === 0) {
          if (isProviderSuccess(providerStatus)) {
            await supabase
              .from("stem_separation_tasks")
              .update({ status: "failed", completed_at: new Date().toISOString() })
              .eq("id", stemTask.id);
            stemFailedCount++;
          }
          continue;
        }

        const { data: existingStems, error: existingStemsError } = await supabase
          .from("track_stems")
          .select("stem_type")
          .eq("track_id", stemTask.track_id);
        if (existingStemsError) {
          logger.error("Failed to lookup existing stems during recovery", existingStemsError, {
            trackId: stemTask.track_id,
          });
          continue;
        }

        const existingTypes = new Set((existingStems || []).map((stem: { stem_type: string }) => stem.stem_type));
        const newStems = stemsToInsert.filter((stem) => !existingTypes.has(stem.stem_type));

        if (newStems.length > 0) {
          const { error: insertStemsError } = await supabase.from("track_stems").insert(newStems);
          if (insertStemsError) {
            logger.error("Failed to insert recovered stems", insertStemsError, { trackId: stemTask.track_id });
            continue;
          }
        }

        const { error: updateTrackStemsError } = await supabase
          .from("tracks")
          .update({ has_stems: true })
          .eq("id", stemTask.track_id);
        if (updateTrackStemsError) {
          logger.error("Failed to mark recovered track as having stems", updateTrackStemsError, {
            trackId: stemTask.track_id,
          });
        }

        await supabase
          .from("stem_separation_tasks")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", stemTask.id);

        await supabase.from("track_change_log").insert({
          track_id: stemTask.track_id,
          user_id: stemTask.tracks?.user_id,
          change_type: "vocal_separation_completed",
          changed_by: "sync_stale_tasks",
          metadata: {
            stems_created: newStems.length,
            stem_types: stemsToInsert.map((stem) => stem.stem_type),
            separation_task_id: separationTaskId,
            auto_synced: true,
          },
        });
        stemCompletedCount++;
      } catch (stemTaskError: any) {
        logger.error("Error processing stale stem task", stemTaskError, { taskId: stemTask.id });
      }
    }

    // Final safety net: expire anything still "in progress" for > 30 minutes so the
    // UI never shows a track generating forever (provider callback lost / never sent).
    let expired: unknown = null;
    const { data: expireData, error: expireError } = await supabase.rpc("expire_stale_generations", {
      p_timeout_minutes: 30,
    });
    if (expireError) {
      logger.error("Failed to expire stale generations", expireError);
    } else {
      expired = expireData;
      logger.info("Expired stale generations", { expired });
    }

    logger.info("Sync completed", {
      recovered: recoveryTasks?.filter((t) => t.tracks?.status !== "completed").length || 0,
      checked: staleTasks?.length || 0,
      updated: updatedCount,
      completed: completedCount,
      failed: failedCount,
      stemChecked: stemCheckedCount,
      stemCompleted: stemCompletedCount,
      stemFailed: stemFailedCount,
      expired,
    });

    return new Response(
      JSON.stringify({
        success: true,
        recovered: recoveryTasks?.filter((t) => t.tracks?.status !== "completed").length || 0,
        checked: staleTasks?.length || 0,
        updated: updatedCount,
        completed: completedCount,
        failed: failedCount,
        stemChecked: stemCheckedCount,
        stemCompleted: stemCompletedCount,
        stemFailed: stemFailedCount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: any) {
    logger.error("Error in sync-stale-tasks", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
