/**
 * Suno mashup callback — handles mashup completion from SunoAPI.
 *
 * Creates track_versions from completed clips and updates track status.
 * generation_mode is set to "mashup" for all track records created by this handler.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { createLogger } from "../_shared/logger.ts";
import { isSunoSuccessCode, verifySunoSignature, getSunoSignatureHeaders } from "../_shared/suno.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { sanitizeAndCleanTitle } from "../_shared/track-naming.ts";
import { extractClipFields, validateClip } from "../_shared/suno-clip-fields.ts";

const logger = createLogger("suno-mashup-callback");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Signature verification ──
    const rawBody = await req.text();
    const { signature, timestamp } = getSunoSignatureHeaders(req);
    if (!(await verifySunoSignature(rawBody, signature, timestamp))) {
      return new Response(JSON.stringify({ success: false, error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = getSupabaseClient();
    const payload = JSON.parse(rawBody);
    const { code, msg, data } = payload;
    const { callbackType, taskId, task_id } = data || {};
    const sunoTaskId = taskId || task_id;

    logger.info("Mashup callback received", { code: payload.code, callbackType, sunoTaskId });

    if (!sunoTaskId) {
      return new Response(JSON.stringify({ success: false, error: "Missing taskId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Find the generation task ──
    const { data: task, error: taskError } = await supabase
      .from("generation_tasks")
      .select("*, tracks(*)")
      .eq("suno_task_id", sunoTaskId)
      .single();

    if (taskError || !task) {
      logger.error("Task not found for mashup callback", null, { sunoTaskId });
      return new Response(JSON.stringify({ success: false, error: "Invalid or unknown taskId" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (task.status === "completed") {
      logger.info("Mashup task already completed", { sunoTaskId });
      return new Response(JSON.stringify({ success: true, status: "already_processed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const trackId = task.track_id;

    // ── Failure handling ──
    if (!isSunoSuccessCode(code)) {
      logger.error("SunoAPI mashup generation failed", null, { msg, sunoTaskId });

      await supabase
        .from("generation_tasks")
        .update({
          status: "failed",
          error_message: msg || "Mashup generation failed",
          callback_received_at: new Date().toISOString(),
        })
        .eq("id", task.id);

      await supabase
        .from("tracks")
        .update({ status: "failed", error_message: msg || "Mashup generation failed" })
        .eq("id", trackId);

      return new Response(JSON.stringify({ success: true, status: "failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Extract clips from callback ──
    const audioData = data?.data;
    const clips = audioData || [];

    if (clips.length === 0) {
      logger.warn("Mashup callback with no clips", { sunoTaskId, trackId });
      return new Response(JSON.stringify({ success: true, status: "no_clips" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logger.info("Processing mashup clips", { clipsCount: clips.length, callbackType });

    let primaryVersionId: string | null = null;
    let trackTitle = "";

    // ── Process each clip as a track version ──
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      const versionLabel = String.fromCharCode(65 + i); // A, B, C...
      const fields = extractClipFields(clip);
      const skip = validateClip(clip, i, { requireAudio: true });

      if (skip) {
        logger.warn("Skipping mashup clip — validation failed", {
          clipIndex: i,
          code: skip.code,
        });
        continue;
      }

      const audioUrl = fields.audioUrl as string;
      const streamUrl = fields.streamUrl;
      const clipImageUrl = fields.imageUrl;
      const clipModelName = fields.modelName;
      const clipDuration = typeof fields.duration === "number" ? fields.duration : null;
      const rawTitle = fields.title || task.prompt || "Mashup";
      trackTitle = sanitizeAndCleanTitle(rawTitle, "Mashup");
      const isPrimary = !primaryVersionId;

      // Check if version already exists for this clip index
      const { data: existingVersion } = await supabase
        .from("track_versions")
        .select("id")
        .eq("track_id", trackId)
        .eq("clip_index", i)
        .maybeSingle();

      const versionData = {
        audio_url: audioUrl,
        cover_url: clipImageUrl || null,
        duration_seconds: clipDuration ? Math.round(clipDuration) : null,
        metadata: {
          suno_id: fields.id,
          suno_task_id: sunoTaskId,
          clip_index: i,
          title: trackTitle,
          model_name: clipModelName,
          prompt: task.prompt,
          status: "completed",
        },
      };

      if (existingVersion) {
        const { error: updateErr } = await supabase
          .from("track_versions")
          .update({
            ...versionData,
            is_primary: isPrimary,
            version_type: "initial",
            source_type: "suno_mashup",
          })
          .eq("id", existingVersion.id);

        if (updateErr) {
          logger.error("Failed to update existing version", updateErr, { trackId, clipIndex: i });
        } else {
          if (!primaryVersionId) primaryVersionId = existingVersion.id;
        }
      } else {
        const { data: newVersion, error: insertErr } = await supabase
          .from("track_versions")
          .insert({
            track_id: trackId,
            ...versionData,
            version_type: "initial",
            source_type: "suno_mashup",
            version_label: versionLabel,
            clip_index: i,
            is_primary: isPrimary,
          })
          .select()
          .single();

        if (insertErr) {
          logger.error("Failed to create version", insertErr, { trackId, clipIndex: i });
        } else if (newVersion && !primaryVersionId) {
          primaryVersionId = newVersion.id;
        }
      }

      // Update track fields from the first valid clip
      if (i === 0) {
        const { error: trackUpdateErr } = await supabase
          .from("tracks")
          .update({
            status: "completed",
            audio_url: audioUrl,
            streaming_url: streamUrl || audioUrl,
            cover_url: clipImageUrl || null,
            title: trackTitle,
            duration_seconds: clipDuration ? Math.round(clipDuration) : null,
            suno_id: fields.id,
            model_name: clipModelName || null,
            suno_task_id: sunoTaskId,
          })
          .eq("id", trackId);

        if (trackUpdateErr) {
          logger.error("Failed to update track from callback", trackUpdateErr, { trackId });
        }
      }
    }

    // ── Set primary version and active version ──
    if (primaryVersionId) {
      await supabase
        .from("track_versions")
        .update({ is_primary: false })
        .eq("track_id", trackId)
        .neq("id", primaryVersionId);

      await supabase
        .from("tracks")
        .update({ active_version_id: primaryVersionId })
        .eq("id", trackId);
    }

    // ── Mark generation task as completed ──
    const { error: taskCompleteErr } = await supabase
      .from("generation_tasks")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        callback_received_at: new Date().toISOString(),
        audio_clips: JSON.stringify(clips),
        received_clips: clips.length,
      })
      .eq("id", task.id);

    if (taskCompleteErr) {
      logger.error("Failed to mark task complete", taskCompleteErr, { taskId: task.id, trackId });
    }

    logger.success("Mashup generation completed", {
      trackId,
      sunoTaskId,
      clipsCount: clips.length,
      trackTitle,
    });

    return new Response(
      JSON.stringify({ success: true, status: "completed", trackId, trackTitle }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Mashup callback error", error);
    return new Response(JSON.stringify({ success: false, error: error.message || "Unknown error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
