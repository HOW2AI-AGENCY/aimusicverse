import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { createLogger } from "../_shared/logger.ts";
import { isSunoSuccessCode } from "../_shared/suno.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitHeaders, RateLimitConfigs } from "../_shared/rate-limiter.ts";

const logger = createLogger("suno-sounds");

/**
 * Sprint 053-A1: SFX generation via Suno `/api/v1/sound/generate`.
 *
 * Sound effects are always instrumental — Suno's SFX endpoint does not accept
 * vocals. Generation cost is fixed (lower than full music generation).
 *
 * Request body:
 *   - prompt    (string, required) — natural-language description of the sound
 *   - model     (enum, optional)   — "V5" | "V4_5ALL" | "V4_5" | "V4"
 *   - tempo     (number, optional) — 60-200 BPM
 *   - key       (string, optional) — "C" | "C#" | "D" | ... | "B"
 *   - duration  (number, optional) — 1-60 seconds
 *   - userId    (uuid, required)
 *
 * Returns 200:
 *   { success: true, taskId: string }
 *
 * Returns 402 if user has insufficient credits.
 * Returns 429 if rate-limited.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sunoApiKey = Deno.env.get("SUNO_API_KEY");
    if (!sunoApiKey) {
      throw new Error("SUNO_API_KEY not configured");
    }

    const supabase = getSupabaseClient();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    const body = await req.json();
    const {
      prompt,
      model = "V5",
      tempo,
      key,
      duration,
      userId,
    } = body as {
      prompt?: string;
      model?: string;
      tempo?: number;
      key?: string;
      duration?: number;
      userId?: string;
    };

    logger.info("SFX generation request", { prompt, model, tempo, key, duration, userId });

    if (!prompt || typeof prompt !== "string") {
      throw new Error("prompt is required");
    }
    if (!userId) {
      throw new Error("userId is required");
    }

    // Range validation
    if (tempo !== undefined && (tempo < 60 || tempo > 200)) {
      throw new Error("tempo must be between 60 and 200 BPM");
    }
    if (duration !== undefined && (duration < 1 || duration > 60)) {
      throw new Error("duration must be between 1 and 60 seconds");
    }
    const validKeys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    if (key !== undefined && !validKeys.includes(key)) {
      throw new Error(`key must be one of: ${validKeys.join(", ")}`);
    }

    // Rate limit check
    const rateLimit = await checkRateLimit(userId, "suno-sounds", RateLimitConfigs.SUNO_GENERATION);
    if (!rateLimit.allowed) {
      logger.warn("Rate limit exceeded", { userId });
      return new Response(
        JSON.stringify({ success: false, error: "Rate limit exceeded", retryAfter: rateLimit.retryAfter }),
        {
          headers: { ...corsHeaders, ...getRateLimitHeaders(rateLimit), "Content-Type": "application/json" },
          status: 429,
        },
      );
    }

    // Credits check (SFX cost is fixed)
    const cost = 1;
    const { data: userCredits, error: creditsError } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if (creditsError || !userCredits) {
      logger.error("Failed to check user credits", creditsError);
      throw new Error("Failed to check user credits");
    }

    if (userCredits.balance < cost) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Недостаточно кредитов",
          required: cost,
          balance: userCredits.balance,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 402 },
      );
    }

    const callbackUrl = `${supabaseUrl}/functions/v1/suno-sounds-callback`;

    const requestBody: Record<string, unknown> = {
      prompt,
      model,
      make_instrumental: true, // SFX endpoint requires instrumental
      callBackUrl: callbackUrl,
    };
    if (tempo !== undefined) requestBody.tempo = tempo;
    if (key !== undefined) requestBody.key = key;
    if (duration !== undefined) requestBody.duration = duration;

    logger.apiCall("SunoAPI", "sound/generate", { model, tempo, key, duration });

    const startTime = Date.now();
    const sunoResponse = await fetch("https://api.sunoapi.org/api/v1/sound/generate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sunoApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const durationMs = Date.now() - startTime;
    const sunoData = await sunoResponse.json();

    logger.info("Suno API response", { duration: durationMs, status: sunoResponse.status, code: sunoData.code });

    // Log API call
    const { error: logError } = await supabase.from("api_usage_logs").insert({
      user_id: userId,
      service: "suno",
      endpoint: "sound/generate",
      method: "POST",
      request_body: requestBody,
      response_status: sunoResponse.status,
      response_body: sunoData,
      duration_ms: durationMs,
      estimated_cost: cost,
    });
    if (logError) logger.warn("Failed to log API usage", logError);

    if (!sunoResponse.ok || !isSunoSuccessCode(sunoData.code)) {
      throw new Error(sunoData.msg || "SunoAPI SFX request failed");
    }

    const taskId = sunoData.data?.taskId;
    if (!taskId) {
      throw new Error("No taskId returned from Suno SFX API");
    }

    logger.info("SFX generation initiated", { taskId });

    // Persist pending row so callback can resolve user_id and update status.
    const { error: insertError } = await supabase.from("sound_effects").insert({
      user_id: userId,
      suno_task_id: taskId,
      prompt,
      model,
      tempo: tempo ?? null,
      key: key ?? null,
      duration: duration ?? null,
      status: "processing",
    });

    if (insertError) {
      logger.warn("Failed to insert sound_effects row", insertError);
      // Don't fail the request — callback can still resolve by taskId lookup from log if needed.
    }

    // Deduct credits
    const { error: deductError } = await supabase.rpc("deduct_credits", {
      p_user_id: userId,
      p_amount: cost,
      p_action_type: "sfx_generation",
      p_description: "Генерация звукового эффекта",
      p_metadata: { task_id: taskId, prompt, model, tempo, key, duration },
    });

    if (deductError) {
      logger.warn("Failed to deduct credits", deductError);
    } else {
      logger.info("Credits deducted", { cost });
      await supabase.from("credit_transactions").insert({
        user_id: userId,
        amount: -cost,
        transaction_type: "debit",
        action_type: "sfx_generation",
        description: "Генерация звукового эффекта",
        metadata: { task_id: taskId, prompt, model, tempo, key, duration },
      });
    }

    return new Response(JSON.stringify({ success: true, taskId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    logger.error("SFX generation failed", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
