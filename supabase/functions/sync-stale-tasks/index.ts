import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authorize } from "../_shared/auth.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { createLogger } from "../_shared/logger.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getAudioUrl, getImageUrl, getModelName, getStreamUrl } from "../_shared/suno-clip-fields.ts";

const logger = createLogger("sync-stale-tasks");

const getLyrics = (clip: any) => clip?.prompt || clip?.lyrics || clip?.lyric || ""; // Suno uses 'prompt' for lyrics

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
          // For replace_section, check if version was created
          const { data: existingVersion } = await supabase
            .from("track_versions")
            .select("id")
            .eq("track_id", task.track_id)
            .eq("metadata->>original_task_id", task.id)
            .single();

          if (existingVersion) continue; // Already processed

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

            const clip = clips[0];
            const audioUrl = getAudioUrl(clip);

            if (!audioUrl) {
              logger.error("No audio URL in replace_section clip", null, { taskId: task.id });
              continue;
            }

            // Download audio
            let localAudioUrl = null;
            try {
              const audioResponse = await fetch(audioUrl);
              if (audioResponse.ok) {
                const audioBlob = await audioResponse.blob();
                const audioFileName = `tracks/${task.user_id}/${task.track_id}_replace_${Date.now()}.mp3`;
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

            // Get next version label
            const { data: latestVersion } = await supabase
              .from("track_versions")
              .select("version_label")
              .eq("track_id", task.track_id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single();

            const nextLabel = latestVersion?.version_label
              ? String.fromCharCode(latestVersion.version_label.charCodeAt(0) + 1)
              : "A";

            // Create version
            await supabase.from("track_versions").insert({
              track_id: task.track_id,
              audio_url: localAudioUrl || audioUrl,
              duration_seconds: Math.round(clip.duration) || null,
              version_type: "replace_section",
              version_label: nextLabel,
              is_primary: false,
              metadata: {
                suno_id: clip.id,
                suno_task_id: task.suno_task_id,
                replace_section: true,
                original_task_id: task.id,
                recovered: true,
              },
            });

            logger.info("Replace section version created", { versionLabel: nextLabel, taskId: task.id });
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

            // Check if version already exists
            const { data: existingVersion } = await supabase
              .from("track_versions")
              .select("id")
              .eq("track_id", task.track_id)
              .eq("version_label", versionLabel)
              .single();

            const versionData = {
              audio_url: i === 0 ? localAudioUrl || clipAudioUrl : clipAudioUrl,
              cover_url: i === 0 ? localCoverUrl || clipImageUrl : clipImageUrl,
              duration_seconds: Math.round(clip.duration) || null,
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
              await supabase
                .from("track_versions")
                .update({ ...versionData, is_primary: shouldBePrimary })
                .eq("id", existingVersion.id);
              if (!primaryVersionId) primaryVersionId = existingVersion.id;
            } else {
              const { data: newVersion } = await supabase
                .from("track_versions")
                .insert({
                  track_id: task.track_id,
                  ...versionData,
                  version_type: i === 0 ? "initial" : "original",
                  version_label: versionLabel,
                  clip_index: i,
                  is_primary: shouldBePrimary,
                })
                .select("id")
                .single();
              if (!primaryVersionId && newVersion) primaryVersionId = newVersion.id;
              logger.info("Version created for recovered track", { versionLabel });
            }
          }

          if (primaryVersionId && !task.tracks.active_version_id) {
            await supabase.from("tracks").update({ active_version_id: primaryVersionId }).eq("id", task.track_id);
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
        if (taskData.status === "SUCCESS" && taskData.response?.sunoData && taskData.response.sunoData.length > 0) {
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

            // Check if version exists
            const { data: existingVersion } = await supabase
              .from("track_versions")
              .select("id")
              .eq("track_id", task.track_id)
              .eq("version_label", versionLabel)
              .single();

            const versionData = {
              audio_url: versionLocalAudioUrl || clipAudioUrl,
              cover_url: versionLocalCoverUrl || clipImageUrl,
              duration_seconds: Math.round(clip.duration) || null,
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
              await supabase.from("track_versions").update(versionData).eq("id", existingVersion.id);
            } else {
              const { data: newVersion } = await supabase
                .from("track_versions")
                .insert({
                  track_id: task.track_id,
                  ...versionData,
                  version_type: i === 0 ? "initial" : "original",
                  version_label: versionLabel,
                  clip_index: i,
                  is_primary: i === 0,
                })
                .select()
                .single();

              if (newVersion && i === 0) {
                await supabase
                  .from("tracks")
                  .update({ active_version_id: newVersion.id })
                  .eq("id", task.track_id)
                  .is("active_version_id", null);
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
        } else if (taskData.status && (taskData.status.includes("FAILED") || taskData.status.includes("ERROR"))) {
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

    logger.info("Sync completed", {
      recovered: recoveryTasks?.filter((t) => t.tracks?.status !== "completed").length || 0,
      checked: staleTasks?.length || 0,
      updated: updatedCount,
      completed: completedCount,
      failed: failedCount,
    });

    return new Response(
      JSON.stringify({
        success: true,
        recovered: recoveryTasks?.filter((t) => t.tracks?.status !== "completed").length || 0,
        checked: staleTasks?.length || 0,
        updated: updatedCount,
        completed: completedCount,
        failed: failedCount,
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
