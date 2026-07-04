import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { createLogger } from "../_shared/logger.ts";
import { isSunoSuccessCode } from "../_shared/suno.ts";
import { corsHeaders } from "../_shared/cors.ts";

const logger = createLogger("suno-sounds-callback");

/**
 * Sprint 053-A2: Callback receiver for Suno `/api/v1/sound/generate`.
 *
 * Suno posts `{ code, msg, data: { taskId, status, clips: [{ audio_url, image_url, duration }] } }`
 * to this endpoint when SFX generation completes (or fails).
 *
 * On SUCCESS: locate the `sound_effects` row by suno_task_id, persist audio/image/duration, mark completed.
 * On FAILED: mark the row failed so UI polling stops.
 *
 * Returns 200 even on idempotent re-delivery (no double-write).
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient();
    const payload = await req.json();

    logger.info("Suno SFX callback received", {
      code: payload?.code,
      taskId: payload?.data?.taskId,
      status: payload?.data?.status,
    });

    if (!isSunoSuccessCode(payload?.code)) {
      logger.warn("Callback with non-success code", { payload });
      // Still return 200 — Suno won't retry, and we don't want to be noisy.
      return new Response(JSON.stringify({ success: false, error: payload?.msg || "non-success code" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const taskId: string | undefined = payload?.data?.taskId;
    const status: string | undefined = payload?.data?.status;
    const clips: Array<{ audio_url?: string; image_url?: string; duration?: number }> = payload?.data?.clips ?? [];

    if (!taskId) {
      throw new Error("callback missing taskId");
    }

    // Resolve user_id from the existing pending row (saved when /suno-sounds was called).
    const { data: existing, error: fetchError } = await supabase
      .from("sound_effects")
      .select("id, user_id, status")
      .eq("suno_task_id", taskId)
      .single();

    if (fetchError || !existing) {
      logger.warn("No sound_effects row for task", { taskId, fetchError });
      return new Response(JSON.stringify({ success: false, error: "task not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (existing.status === "completed") {
      // Idempotent — already processed.
      logger.info("SFX already processed, skipping", { taskId });
      return new Response(JSON.stringify({ success: true, idempotent: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (status === "FAILED" || status === "failed") {
      await supabase
        .from("sound_effects")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      logger.warn("SFX generation failed", { taskId });
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // SUCCESS — extract first clip (SFX always returns single clip per call)
    const clip = clips[0];
    if (!clip?.audio_url) {
      throw new Error("callback success but no clip audio_url");
    }

    const { error: updateError } = await supabase
      .from("sound_effects")
      .update({
        audio_url: clip.audio_url,
        image_url: clip.image_url ?? null,
        duration: clip.duration ?? null,
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (updateError) {
      logger.error("Failed to update sound_effects", updateError);
      throw new Error("Failed to persist SFX result");
    }

    logger.info("SFX generation completed", {
      taskId,
      userId: existing.user_id,
      duration: clip.duration,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    logger.error("SFX callback handler failed", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // 200 even on error — Suno doesn't retry
    });
  }
});
