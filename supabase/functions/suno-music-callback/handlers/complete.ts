/**
 * Complete callback handler — self-contained.
 * Processes final generation results: versions, project linking, credits, notifications.
 * ponytail: inlined over 6 premature single-caller service modules.
 *   Extract if a second caller appears.
 */

import { getSupabaseClient } from "../../_shared/supabase-client.ts";
import { createLogger } from "../../_shared/logger.ts";
import { sanitizeAndCleanTitle } from "../../_shared/track-naming.ts";
import { getGenerationCost } from "../../_shared/economy.ts";
import { VERSION_LABELS, getVersionType } from "../utils/version-types.ts";
import { fetchWithRetry } from "../utils/fetch-retry.ts";
import { logAuditAction } from "../utils/audit-log.ts";
import {
  extractClipFields,
  getAudioUrl,
  getImageUrl,
  getStreamUrl,
  validateClip,
  type SkipReason,
} from "../../_shared/suno-clip-fields.ts";

const logger = createLogger("complete-callback");

export async function handleCompleteCallback(payload: any, task: any, supabaseUrl: string, supabaseServiceKey: string) {
  const { data } = payload;
  const { taskId, task_id, data: audioData } = data || {};
  const sunoTaskId = taskId || task_id;
  const trackId = task.track_id;
  const supabase = getSupabaseClient();

  const clips = audioData || [];
  if (clips.length === 0) throw new Error("No audio clips in completion callback");

  logger.info("Generation complete", { clipsCount: clips.length });

  let trackTitle = "";
  const skippedClips: SkipReason[] = [];
  const missingCovers: number[] = [];

  // ── Version creation per clip ──
  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    const versionLabel = VERSION_LABELS[i] || `V${i + 1}`;
    const fields = extractClipFields(clip);
    const skip = validateClip(clip, i, { requireAudio: true });

    if (skip) {
      skippedClips.push(skip);
      logger.error("Skipping clip — validation failed", null, {
        skipCode: skip.code,
        clipIndex: i,
        versionLabel,
        availableKeys: skip.availableKeys,
        message: skip.message,
      });
      continue;
    }
    const audioUrl = fields.audioUrl as string;
    const streamUrl = fields.streamUrl;
    if (!fields.imageUrl) {
      missingCovers.push(i);
      logger.warn("Clip has no cover image — proceeding without cover", {
        clipIndex: i,
        versionLabel,
        clipId: fields.id,
      });
    }

    // Download + upload to storage (retry)
    let localAudioUrl: string | null = null;
    try {
      const resp = await fetchWithRetry(audioUrl, 3, 2000);
      const blob = await resp.blob();
      const fileName = `tracks/${task.user_id}/${trackId}_v${versionLabel}_${Date.now()}.mp3`;
      const { data: uploaded, error: upErr } = await supabase.storage
        .from("project-assets")
        .upload(fileName, blob, { contentType: "audio/mpeg", upsert: true });
      if (upErr) throw upErr;
      if (uploaded) {
        localAudioUrl = supabase.storage.from("project-assets").getPublicUrl(fileName).data.publicUrl;
      }
    } catch (e) {
      logger.error("Audio download/upload failed", e, { clipIndex: i, versionLabel });
    }

    const finalAudioUrl = localAudioUrl || audioUrl;
    const rawTitle = clip.title || task.prompt?.split("\n")[0]?.substring(0, 100) || "Трек";
    trackTitle = sanitizeAndCleanTitle(rawTitle, "Трек");

    // Insert or update version
    const { data: existing } = await supabase
      .from("track_versions")
      .select("id")
      .eq("track_id", trackId)
      .eq("version_label", versionLabel)
      .single();

    const clipModelName = clip.modelName || clip.model_name;
    const clipImageUrl = getImageUrl(clip);
    const versionData = {
      audio_url: finalAudioUrl,
      cover_url: clipImageUrl || null,
      duration_seconds: Math.round(clip.duration) || null,
      metadata: {
        suno_id: clip.id,
        suno_task_id: sunoTaskId,
        clip_index: i,
        title: trackTitle,
        tags: clip.tags,
        lyrics: clip.prompt,
        model_name: clipModelName,
        prompt: task.prompt,
        local_storage: { audio: localAudioUrl },
        status: "completed",
      },
    };

    if (existing) {
      await supabase.from("track_versions").update(versionData).eq("id", existing.id);
    } else {
      const generationMode = task.generation_mode || task.tracks?.generation_mode;
      const { data: newVersion } = await supabase
        .from("track_versions")
        .insert({
          track_id: trackId,
          ...versionData,
          version_type: getVersionType(generationMode),
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
          .eq("id", trackId)
          .is("active_version_id", null);
      }
    }

    // Update main track on first clip
    if (i === 0) {
      const taskMeta =
        typeof task.audio_clips === "string" ? JSON.parse(task.audio_clips || "{}") : task.audio_clips || {};
      const projectTrackId =
        taskMeta?.project_track_id && taskMeta.project_track_id !== "null" && taskMeta.project_track_id !== "undefined"
          ? taskMeta.project_track_id
          : null;
      const rawProjectId = task.tracks?.project_id;
      const safeProjectId =
        rawProjectId && rawProjectId !== "null" && rawProjectId !== "undefined" ? rawProjectId : null;

      await supabase
        .from("tracks")
        .update({
          status: "completed",
          audio_url: finalAudioUrl,
          streaming_url: streamUrl || finalAudioUrl,
          local_audio_url: localAudioUrl,
          cover_url: clipImageUrl || null,
          title: trackTitle,
          duration_seconds: Math.round(clip.duration) || null,
          tags: clip.tags || task.tracks?.tags,
          lyrics: clip.prompt || task.tracks?.lyrics,
          suno_id: clip.id,
          model_name: clipModelName || "chirp-v4",
          suno_task_id: sunoTaskId,
          project_id: safeProjectId,
          project_track_id: projectTrackId,
        })
        .eq("id", trackId);
    }

    await supabase.from("track_change_log").insert({
      track_id: trackId,
      user_id: task.user_id,
      change_type: "version_created",
      changed_by: "suno_api",
      ai_model_used: clipModelName || "chirp-v4",
      prompt_used: task.prompt,
      new_value: versionLabel,
      metadata: { version_label: versionLabel, clip_index: i, suno_clip_id: clip.id, title: trackTitle },
    });
  }

  // ── Cover generation ──
  try {
    await fetch(`${supabaseUrl}/functions/v1/generate-track-cover`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseServiceKey}` },
      body: JSON.stringify({
        trackId,
        title: trackTitle,
        style: task.tracks?.style || clips[0]?.tags || "",
        lyrics: clips[0]?.prompt || task.prompt || "",
        userId: task.user_id,
        projectId: task.tracks?.project_id || null,
      }),
    });
  } catch (e) {
    logger.error("Cover generation error", e);
  }

  // ── Project linking ──
  const taskMeta = typeof task.audio_clips === "string" ? JSON.parse(task.audio_clips || "{}") : task.audio_clips || {};
  let projectTrackId = taskMeta?.project_track_id;
  const projectId = task.tracks?.project_id;

  if (!projectTrackId && projectId && trackTitle) {
    const { data: match } = await supabase
      .from("project_tracks")
      .select("id")
      .eq("project_id", projectId)
      .ilike("title", trackTitle)
      .is("track_id", null)
      .order("position", { ascending: true })
      .limit(1)
      .single();
    if (match) projectTrackId = match.id;
  }
  if (projectTrackId) {
    await supabase.from("project_tracks").update({ track_id: trackId, status: "completed" }).eq("id", projectTrackId);
  }

  // ── Studio project integration (add_instrumental) ──
  const studioProjectId = taskMeta?.studio_project_id;
  const pendingTrackId = taskMeta?.pending_track_id;
  if (studioProjectId && pendingTrackId && task.generation_mode === "add_instrumental") {
    await handleStudioInstrumental(supabase, task, clips, studioProjectId, pendingTrackId);
  }

  const openInStudio = taskMeta?.open_in_studio;
  const originalTrackId = taskMeta?.original_track_id;
  if (openInStudio && !studioProjectId && task.generation_mode === "add_instrumental" && originalTrackId) {
    await createStudioProject(supabase, task, clips, trackId, originalTrackId, trackTitle);
  }

  // ── Task completion ──
  const expectedClips = task.expected_clips ?? 2;
  const deliveryComplete = clips.length >= expectedClips;
  await supabase
    .from("generation_tasks")
    .update({
      status: deliveryComplete ? "completed" : "partial_delivery",
      completed_at: new Date().toISOString(),
      callback_received_at: new Date().toISOString(),
      audio_clips: JSON.stringify(clips),
      received_clips: clips.length,
    })
    .eq("id", task.id);

  // ── Audit log ──
  await logAuditAction(supabaseUrl, supabaseServiceKey, {
    entityType: "track",
    entityId: trackId,
    userId: task.user_id,
    actorType: "ai",
    aiModelUsed: clips[0]?.model_name || task.model_used || "suno-chirp-v4",
    actionType: "generated",
    actionCategory: "generation",
    contentUrl: clips[0] ? getAudioUrl(clips[0]) : undefined,
    promptUsed: task.prompt,
    inputMetadata: {
      suno_task_id: sunoTaskId,
      generation_mode: task.generation_mode,
      clips_count: clips.length,
      reference_audio_id: task.tracks?.reference_audio_id || null,
      style: task.tracks?.style,
    },
    outputMetadata: {
      audio_url: clips[0] ? getAudioUrl(clips[0]) : null,
      duration_seconds: clips[0]?.duration,
      title: trackTitle,
      tags: clips[0]?.tags,
    },
    chainId: task.id,
  });

  // ── Credits ──
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: task.user_id, _role: "admin" });
  if (!isAdmin) {
    const cost = getGenerationCost(task.model_used || "V4_5ALL");
    try {
      await supabase.rpc("deduct_generation_credits", {
        p_user_id: task.user_id,
        p_cost: cost,
        p_description: `Генерация трека: ${clips[0]?.title || "Трек"}`,
        p_metadata: { trackId, clips: clips.length, model: task.model_used, cost },
      });
    } catch (e) {
      logger.error("Credit deduction error", e);
    }
  }

  // ── XP reward ──
  try {
    await supabase.functions.invoke("reward-action", {
      body: { userId: task.user_id, actionType: "generation_complete", metadata: { trackId, clips: clips.length } },
    });
  } catch (e) {
    logger.error("XP reward error", e);
  }

  // ── Notifications ──
  await supabase.from("notifications").insert({
    user_id: task.user_id,
    title: "🎵 Трек готов!",
    message: `Ваш трек "${trackTitle}" успешно сгенерирован (${clips.length} версии)`,
    type: "success",
    action_url: `/library?track=${trackId}`,
    group_key: `generation_${task.id}`,
    metadata: { taskId: task.id, trackId, trackTitle, clipsCount: clips.length },
    priority: 8,
    read: false,
  });

  // ── Telegram notification ──
  if (task.telegram_chat_id && clips.length > 0) {
    await sendTelegramResults(supabase, task, clips, trackId, trackTitle);
  }

  // ── Auto MIDI ──
  try {
    const { data: settings } = await supabase
      .from("user_notification_settings")
      .select("auto_midi_enabled, auto_midi_model, auto_midi_stems_only")
      .eq("user_id", task.user_id)
      .single();
    if (settings?.auto_midi_enabled && !settings?.auto_midi_stems_only) {
      const url = getAudioUrl(clips[0]);
      if (url) {
        await supabase.functions.invoke("transcribe-midi", {
          body: {
            track_id: trackId,
            audio_url: url,
            model_type: settings.auto_midi_model || "basic-pitch",
            auto_select: false,
          },
        });
      }
    }
  } catch (e) {
    /* midi is best-effort */
  }

  return { success: true, callbackType: "complete", trackId, trackTitle, clipsCount: clips.length };
}

// ── Inline helpers (ponytail: single-caller, inline until second caller) ──

async function handleStudioInstrumental(
  supabase: any,
  task: any,
  clips: any[],
  studioProjectId: string,
  pendingTrackId: string,
) {
  try {
    const { data: project } = await supabase
      .from("studio_projects")
      .select("tracks")
      .eq("id", studioProjectId)
      .single();
    if (!project) return;

    const versions = clips.slice(0, 2).map((c: any, i: number) => ({
      label: ["A", "B"][i] || `V${i + 1}`,
      audioUrl: getAudioUrl(c),
      duration: Math.round(c.duration) || 180,
    }));

    const tracks = (project.tracks as any[]) || [];
    const updated = tracks.map((t: any) => {
      if (t.id !== pendingTrackId || t.status !== "pending") return t;
      return {
        ...t,
        status: "ready",
        versions,
        audioUrl: versions[0]?.audioUrl,
        activeVersionLabel: versions[0]?.label || "A",
        clips: versions[0]
          ? [
              {
                id: `clip-${Date.now()}`,
                trackId: t.id,
                audioUrl: versions[0].audioUrl,
                name: t.name.replace(" (генерация...)", ""),
                startTime: 0,
                duration: versions[0].duration,
                trimStart: 0,
                trimEnd: 0,
                fadeIn: 0,
                fadeOut: 0,
              },
            ]
          : [],
        name: t.name.replace(" (генерация...)", ""),
      };
    });

    await supabase
      .from("studio_projects")
      .update({ tracks: updated, updated_at: new Date().toISOString() })
      .eq("id", studioProjectId);
  } catch (e) {
    logger.error("Studio instrumental update error", e);
  }
}

async function createStudioProject(
  supabase: any,
  task: any,
  clips: any[],
  trackId: string,
  originalTrackId: string,
  trackTitle: string,
) {
  try {
    const { data: orig } = await supabase
      .from("tracks")
      .select("id, title, audio_url, duration_seconds, style")
      .eq("id", originalTrackId)
      .single();
    const { data: next } = await supabase
      .from("tracks")
      .select("id, title, audio_url, duration_seconds, style")
      .eq("id", trackId)
      .single();
    if (!orig || !next) return;

    const now = Date.now();
    const studioTracks = [
      {
        id: `track-vocal-${now}`,
        name: orig.title || "Вокал",
        type: "vocals",
        audioUrl: orig.audio_url,
        sourceTrackId: orig.id,
        volume: 0.8,
        pan: 0,
        mute: false,
        solo: false,
        status: "ready",
        clips: [
          {
            id: `clip-vocal-${now}`,
            trackId: `track-vocal-${now}`,
            audioUrl: orig.audio_url,
            name: orig.title || "Вокал",
            startTime: 0,
            duration: orig.duration_seconds || 180,
            trimStart: 0,
            trimEnd: 0,
            fadeIn: 0,
            fadeOut: 0,
          },
        ],
      },
      {
        id: `track-instrumental-${now + 1}`,
        name: next.title || "Инструментал",
        type: "instrumental",
        audioUrl: next.audio_url,
        sourceTrackId: next.id,
        volume: 0.7,
        pan: 0,
        mute: false,
        solo: false,
        status: "ready",
        clips: [
          {
            id: `clip-instrumental-${now + 1}`,
            trackId: `track-instrumental-${now + 1}`,
            audioUrl: next.audio_url,
            name: next.title || "Инструментал",
            startTime: 0,
            duration: next.duration_seconds || 180,
            trimStart: 0,
            trimEnd: 0,
            fadeIn: 0,
            fadeOut: 0,
          },
        ],
      },
    ];

    const { data: newProject } = await supabase
      .from("studio_projects")
      .insert({
        user_id: task.user_id,
        source_track_id: orig.id,
        name: `${orig.title || "Трек"} + Инструментал`,
        description: "Автоматически создано из добавления инструментала",
        status: "draft",
        stems_mode: "simple",
        tracks: studioTracks,
        duration_seconds: Math.max(orig.duration_seconds || 180, next.duration_seconds || 180),
      })
      .select("id")
      .single();

    if (newProject) {
      await supabase.from("notifications").insert({
        user_id: task.user_id,
        type: "studio_ready",
        title: "Инструментал готов! 🎸",
        message: `Инструментал для "${orig.title || "трека"}" готов. Открыть студию для сведения?`,
        action_url: `/studio-v2/project/${newProject.id}`,
        metadata: {
          studio_project_id: newProject.id,
          original_track_id: originalTrackId,
          instrumental_track_id: trackId,
        },
      });
    }
  } catch (e) {
    logger.error("Studio project creation error", e);
  }
}

async function sendTelegramResults(supabase: any, task: any, clips: any[], trackId: string, trackTitle: string) {
  // Delete progress message
  if (task.telegram_message_id) {
    try {
      await supabase.functions.invoke("send-telegram-notification", {
        body: { type: "delete_progress", chatId: task.telegram_chat_id, messageId: task.telegram_message_id },
      });
    } catch (e) {
      /* best-effort */
    }
  }

  // Wait for cover
  await new Promise((r) => setTimeout(r, 6000));

  const { data: fresh } = await supabase
    .from("tracks")
    .select("title, style, cover_url, local_cover_url, tags")
    .eq("id", trackId)
    .single();
  const cover = fresh?.local_cover_url || fresh?.cover_url;
  let title = fresh?.title || clips[0]?.title;
  if (!title || title === "Untitled" || title === "Трек") {
    title =
      (task.prompt || "")
        .split("\n")
        .filter((l: string) => l.trim())[0]
        ?.substring(0, 60)
        .trim()
        .replace(/^(create|generate|make)\s+/i, "") || "AI Music Track";
  }

  const maxClips = Math.min(clips.length, 2);
  const audioClipsData = [];
  for (let i = 0; i < maxClips; i++) {
    const c = clips[i];
    const lyrics = (c.prompt || task.prompt || "")
      .split("\n")
      .filter((l: string) => l.trim() && !l.trim().startsWith("["))
      .slice(0, 2)
      .join("\n")
      .substring(0, 150);
    audioClipsData.push({
      audioUrl: getAudioUrl(c),
      title: `${title} (${["A", "B"][i]})`,
      duration: c.duration,
      versionLabel: ["A", "B"][i],
      lyricsPreview: lyrics,
      coverUrl: cover,
    });
  }

  try {
    const { error } = await supabase.functions.invoke("send-telegram-notification", {
      body: {
        type: "generation_complete_multi",
        chatId: task.telegram_chat_id,
        trackId,
        coverUrl: cover,
        title,
        audioClips: audioClipsData,
        tags: fresh?.tags || clips[0]?.tags,
        style: fresh?.style || task.tracks?.style,
        versionsCount: clips.length,
      },
    });
    if (error) {
      // Fallback: single notifications
      for (let i = 0; i < maxClips; i++) {
        await supabase.functions.invoke("send-telegram-notification", {
          body: {
            type: "generation_complete",
            chatId: task.telegram_chat_id,
            trackId,
            audioUrl: audioClipsData[i].audioUrl,
            coverUrl: cover,
            title: audioClipsData[i].title,
            duration: audioClipsData[i].duration,
            tags: fresh?.tags || clips[0]?.tags,
            style: fresh?.style,
            versionLabel: audioClipsData[i].versionLabel,
            currentVersion: i + 1,
            totalVersions: maxClips,
          },
        });
        if (i < maxClips - 1) await new Promise((r) => setTimeout(r, 1000));
      }
    }
  } catch (e) {
    logger.error("Telegram notification error", e);
  }
}
