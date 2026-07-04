import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { createLogger } from "../_shared/logger.ts";
import { corsHeaders } from "../_shared/cors.ts";

const logger = createLogger("suno-sounds-status");

/**
 * Sprint 053-A1: Status polling endpoint for SFX generation.
 *
 * Reads the `sound_effects` row by suno_task_id. The client polls this endpoint
 * (every ~2.5s) until status is 'completed' or 'failed'.
 *
 * Returns 200 with the row data; 404 if the task is not yet known to us.
 *
 * Request:  { taskId: string }
 * Response: { success, status, audio_url?, image_url?, duration?, prompt? }
 */

interface SoundEffectRow {
  status: "processing" | "completed" | "failed";
  audio_url: string | null;
  image_url: string | null;
  duration: number | null;
  prompt: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient();
    const body = await req.json();
    const taskId: string | undefined = body?.taskId;

    if (!taskId) {
      throw new Error("taskId is required");
    }

    const { data, error } = await supabase
      .from("sound_effects")
      .select("status, audio_url, image_url, duration, prompt")
      .eq("suno_task_id", taskId)
      .maybeSingle();

    if (error) {
      logger.warn("suno-sounds-status query failed", { taskId, error });
      throw error;
    }

    if (!data) {
      // Not yet persisted — callback hasn't fired or row insert failed in suno-sounds.
      const response: { success: boolean; status: "processing" } = {
        success: true,
        status: "processing",
      };
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const row = data as SoundEffectRow;

    return new Response(
      JSON.stringify({
        success: true,
        status: row.status,
        audio_url: row.audio_url,
        image_url: row.image_url,
        duration: row.duration,
        prompt: row.prompt,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error: unknown) {
    logger.error("suno-sounds-status failed", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
