import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { createLogger } from "../_shared/logger.ts";
import { isSunoSuccessCode } from "../_shared/suno.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitHeaders, RateLimitConfigs } from "../_shared/rate-limiter.ts";

const logger = createLogger("suno-midi");

/**
 * Sprint 053-A3: MIDI generation via Suno `/api/v1/generate/midi`.
 *
 * Difference from SFX:
 *   - Input is an existing track_version (NOT a free-form prompt)
 *   - We resolve trackVersion.audio_url → forward to Suno
 *   - Suno's callback writes the resulting .mid file to Supabase Storage
 *     and updates track_versions.midi_url (handled in suno-midi-callback).
 *
 * Request body:
 *   - trackVersionId (uuid, required) — must belong to userId
 *   - userId         (uuid, required) — for credit deduction + RLS scope
 *
 * Returns 200: { success: true, taskId: string }
 * Returns 402: insufficient credits
 * Returns 429: rate-limited
 * Returns 404: track version not found / not owned by user
 */

const MIDI_COST = 5; // Per-call credit cost (parity with Replicate transcription)

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
    const { trackVersionId, userId } = body as {
      trackVersionId?: string;
      userId?: string;
    };

    logger.info("Suno MIDI generation request", { trackVersionId, userId });

    if (!trackVersionId) throw new Error("trackVersionId is required");
    if (!userId) throw new Error("userId is required");

    // Rate limit
    const rateLimit = await checkRateLimit(userId, "suno-midi", RateLimitConfigs.SUNO_GENERATION);
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

    // Resolve track_version → audio_url + parent track ownership check.
    // Untyped .select() because track_versions is in generated Database but we use
    // a narrow projection and want to avoid tying this edge to the generated types.
    const { data: versionRow, error: versionError } = await supabase
      .from("track_versions")
      .select("id, audio_url, track_id, tracks!inner(user_id, is_public)")
      .eq("id", trackVersionId)
      .maybeSingle();

    if (versionError || !versionRow) {
      logger.warn("Track version not found", { trackVersionId, versionError });
      return new Response(JSON.stringify({ success: false, error: "Track version not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Verify ownership (the inner join only enforces RLS for SELECT, but we double-check
    // explicitly so we don't accidentally bill a wrong user).
    const trackOwner = (versionRow as unknown as { tracks: { user_id: string } | { user_id: string }[] }).tracks;
    const ownerId = Array.isArray(trackOwner) ? trackOwner[0]?.user_id : trackOwner?.user_id;
    if (ownerId !== userId) {
      logger.warn("User does not own track version", { userId, ownerId, trackVersionId });
      return new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const audioUrl = (versionRow as unknown as { audio_url: string | null }).audio_url;
    if (!audioUrl) {
      return new Response(JSON.stringify({ success: false, error: "Track version has no audio_url yet" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Credits check
    const { data: userCredits, error: creditsError } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if (creditsError || !userCredits) {
      logger.error("Failed to check user credits", creditsError);
      throw new Error("Failed to check user credits");
    }

    if (userCredits.balance < MIDI_COST) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Недостаточно кредитов",
          required: MIDI_COST,
          balance: userCredits.balance,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 402 },
      );
    }

    const callbackUrl = `${supabaseUrl}/functions/v1/suno-midi-callback`;

    logger.apiCall("SunoAPI", "generate/midi", { trackVersionId });

    const startTime = Date.now();
    const sunoResponse = await fetch("https://api.sunoapi.org/api/v1/generate/midi", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sunoApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        callBackUrl: callbackUrl,
      }),
    });

    const durationMs = Date.now() - startTime;
    const sunoData = await sunoResponse.json();

    logger.info("Suno MIDI API response", {
      duration: durationMs,
      status: sunoResponse.status,
      code: sunoData.code,
    });

    // Log the API call for billing / analytics
    const { error: logError } = await supabase.from("api_usage_logs").insert({
      user_id: userId,
      service: "suno",
      endpoint: "generate/midi",
      method: "POST",
      request_body: { trackVersionId, audio_url: audioUrl },
      response_status: sunoResponse.status,
      response_body: sunoData,
      duration_ms: durationMs,
      estimated_cost: MIDI_COST,
    });
    if (logError) logger.warn("Failed to log API usage", logError);

    if (!sunoResponse.ok || !isSunoSuccessCode(sunoData.code)) {
      throw new Error(sunoData.msg || "SunoAPI MIDI request failed");
    }

    const taskId = sunoData.data?.taskId;
    if (!taskId) {
      throw new Error("No taskId returned from Suno MIDI API");
    }

    // Persist pending provenance on the track_version so the callback knows
    // to update midi_generation_source='suno' (rather than leaving it null
    // if Replicate also wrote a row). Only mark if not already set.
    const { error: markError } = await supabase
      .from("track_versions")
      .update({
        midi_generation_source: "suno",
        updated_at: new Date().toISOString(),
      })
      .eq("id", trackVersionId)
      .is("midi_url", null); // Don't overwrite an already-completed MIDI
    if (markError) logger.warn("Failed to mark midi_generation_source", markError);

    // Deduct credits
    const { error: deductError } = await supabase.rpc("deduct_credits", {
      p_user_id: userId,
      p_amount: MIDI_COST,
      p_action_type: "midi_generation_suno",
      p_description: "Генерация MIDI (Suno)",
      p_metadata: { task_id: taskId, track_version_id: trackVersionId },
    });

    if (deductError) {
      logger.warn("Failed to deduct credits", deductError);
    } else {
      logger.info("Credits deducted", { cost: MIDI_COST });
      await supabase.from("credit_transactions").insert({
        user_id: userId,
        amount: -MIDI_COST,
        transaction_type: "debit",
        action_type: "midi_generation_suno",
        description: "Генерация MIDI (Suno)",
        metadata: { task_id: taskId, track_version_id: trackVersionId },
      });
    }

    return new Response(JSON.stringify({ success: true, taskId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    logger.error("Suno MIDI generation failed", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
