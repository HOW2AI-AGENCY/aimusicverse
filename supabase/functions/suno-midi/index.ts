/**
 * suno-midi — MIDI generation via SunoAPI `/api/v1/midi/generate`.
 *
 * Uses stem separation taskId (from suno-separate-vocals) to generate MIDI.
 * Simple mode (2 stems): generate MIDI for all separated tracks.
 * Detailed mode (6+ stems): accept optional audioId for a specific stem.
 *
 * Request body:
 *   - taskId       (string, required) — completed stem separation taskId
 *   - audioId      (string, optional) — specific stem audioId from originData
 *   - userId       (uuid,   required)
 *
 * Returns 200: { success: true, taskId: string }
 * Returns 402: insufficient credits
 * Returns 429: rate-limited
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { createLogger } from "../_shared/logger.ts";
import { isSunoSuccessCode } from "../_shared/suno.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitHeaders, RateLimitConfigs } from "../_shared/rate-limiter.ts";

const logger = createLogger("suno-midi");
const MIDI_COST = 5;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const sunoApiKey = Deno.env.get("SUNO_API_KEY");
    if (!sunoApiKey) throw new Error("SUNO_API_KEY not configured");

    const supabase = getSupabaseClient();

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const body = await req.json();
    const { taskId, audioId, userId } = body;
    if (!taskId || !userId) {
      return new Response(JSON.stringify({ success: false, error: "taskId and userId are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (userId !== user.id) {
      return new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit
    const rateLimitResult = checkRateLimit(req, RateLimitConfigs.generation);
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({ success: false, error: "Rate limit exceeded" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json", ...getRateLimitHeaders(rateLimitResult) },
      });
    }

    // Accept either our DB row id or the provider separation_task_id.
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(taskId));
    const { data: task, error: taskError } = await supabase
      .from("stem_separation_tasks")
      .select("id, track_id, mode, status, separation_task_id")
      .eq(isUuid ? "id" : "separation_task_id", taskId)
      .maybeSingle();

    if (taskError || !task) {
      return new Response(JSON.stringify({ success: false, error: "Stem separation task not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (task.status !== "completed") {
      return new Response(JSON.stringify({ success: false, error: "Stem separation not yet completed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify track ownership
    const { data: track, error: trackError } = await supabase
      .from("tracks")
      .select("id, user_id")
      .eq("id", task.track_id)
      .single();

    if (trackError || !track || track.user_id !== userId) {
      return new Response(JSON.stringify({ success: false, error: "Track not found or access denied" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Credits check
    const { data: userCredits, error: creditsError } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if (creditsError || !userCredits) throw new Error("Failed to check user credits");

    if (userCredits.balance < MIDI_COST) {
      return new Response(JSON.stringify({ success: false, error: "Недостаточно кредитов", required: MIDI_COST, balance: userCredits.balance }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 402 });
    }

    const callbackUrl = `${supabaseUrl}/functions/v1/suno-midi-callback`;

    logger.apiCall("SunoAPI", "midi/generate", { taskId, audioId: audioId ?? "all" });

    const startTime = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const sunoBody: Record<string, unknown> = { taskId, callBackUrl: callbackUrl };
    if (audioId) sunoBody.audioId = audioId;

    const sunoResponse = await fetch("https://api.sunoapi.org/api/v1/midi/generate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sunoApiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify(sunoBody),
    });
    clearTimeout(timeout);

    const durationMs = Date.now() - startTime;
    const sunoData = await sunoResponse.json();

    logger.info("Suno MIDI API response", { duration: durationMs, status: sunoResponse.status, code: sunoData.code });

    // Log API call
    const { error: logError } = await supabase.from("api_usage_logs").insert({
      user_id: userId,
      service: "suno",
      endpoint: "midi/generate",
      method: "POST",
      request_body: sunoBody,
      response_status: sunoResponse.status,
      response_body: sunoData,
      duration_ms: durationMs,
      estimated_cost: MIDI_COST,
    });
    if (logError) logger.warn("Failed to log API usage", logError);

    if (!sunoResponse.ok || !isSunoSuccessCode(sunoData.code)) {
      throw new Error(sunoData.msg || "SunoAPI MIDI request failed");
    }

    const midiTaskId = sunoData.data?.taskId;
    if (!midiTaskId) throw new Error("No taskId returned from MIDI API");

    // Deduct credits
    const { error: deductError } = await supabase.rpc("deduct_credits", {
      p_user_id: userId,
      p_amount: MIDI_COST,
      p_action_type: "midi_generation",
      p_description: `MIDI генерация (${task.mode} mode)`,
      p_metadata: { task_id: taskId, midi_task_id: midiTaskId, audio_id: audioId ?? null },
    });
    if (deductError) logger.warn("Failed to deduct credits", deductError);

    return new Response(JSON.stringify({ success: true, taskId: midiTaskId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    logger.error("MIDI generation failed", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});