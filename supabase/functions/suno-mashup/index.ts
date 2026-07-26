/**
 * Suno Mashup — blend two audio files into a mashup via SunoAPI.
 *
 * Uses /api/v1/generate/mashup endpoint.
 * Accepts up to 2 direct audio URLs (uploadUrlList).
 *
 * Cost: 10 credits per mashup generation
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { isSunoSuccessCode } from "../_shared/suno.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { ECONOMY } from "../_shared/economy.ts";
import { getApiModelName } from "../_shared/suno-models.ts";
import { createLogger } from "../_shared/logger.ts";

const logger = createLogger("suno-mashup");
const MASHUP_COST = ECONOMY.COVER_GENERATION_COST; // 10 credits

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const sunoApiKey = Deno.env.get("SUNO_API_KEY");

    if (!sunoApiKey) {
      throw new Error("SUNO_API_KEY not configured");
    }

    const supabase = getSupabaseClient();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check user credit balance
    const { data: credits, error: creditsError } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    if (creditsError) {
      logger.error("Credits check error", creditsError);
      throw new Error("Failed to check credit balance");
    }

    const currentBalance = credits?.balance ?? 0;
    if (currentBalance < MASHUP_COST) {
      throw new Error(`Insufficient credits. Need ${MASHUP_COST}, have ${currentBalance}`);
    }

    const body = await req.json();
    const {
      uploadUrlList,    // [string, string] — exactly 2 audio URLs
      customMode,
      prompt,
      style,
      title,
      instrumental = false,
      model = "V4_5ALL",
    } = body;

    // Validate uploadUrlList: exactly 2 non-empty URLs
    if (!Array.isArray(uploadUrlList) || uploadUrlList.length !== 2) {
      throw new Error("uploadUrlList must be an array of exactly 2 audio URLs");
    }
    if (!uploadUrlList[0] || !uploadUrlList[1]) {
      throw new Error("Both audio URLs in uploadUrlList must be non-empty");
    }
    if (uploadUrlList[0] === uploadUrlList[1]) {
      throw new Error("uploadUrlList entries must be different URLs");
    }

    if (typeof customMode !== "boolean") {
      throw new Error("customMode (boolean) is required");
    }

    const effectiveModel = getApiModelName(model);

    // URL accessibility checks
    for (let i = 0; i < uploadUrlList.length; i++) {
      try {
        const urlCheckController = new AbortController();
        const urlCheckTimeout = setTimeout(() => urlCheckController.abort(), 30000);
        const urlCheck = await fetch(uploadUrlList[i], { method: "HEAD", signal: urlCheckController.signal });
        clearTimeout(urlCheckTimeout);
        logger.info(`URL ${i + 1} accessibility check`, {
          status: urlCheck.status,
          contentType: urlCheck.headers.get("content-type"),
          accessible: urlCheck.ok,
        });
        if (!urlCheck.ok) {
          logger.warn(`URL ${i + 1} may not be accessible`, {
            status: urlCheck.status,
            statusText: urlCheck.statusText,
          });
        }
      } catch (urlError) {
        logger.warn(`URL ${i + 1} validation failed`, urlError as Error);
      }
    }

    logger.info("Creating mashup", {
      customMode,
      instrumental,
      model: effectiveModel,
    });

    // Create new track record
    const { data: newTrack, error: newTrackError } = await supabase
      .from("tracks")
      .insert({
        user_id: user.id,
        project_id: null,
        prompt: prompt || "Mashup",
        title: title || "AI Mashup",
        style: style || null,
        has_vocals: !instrumental,
        status: "pending",
        provider: "suno",
        suno_model: effectiveModel,
        generation_mode: "mashup",
      })
      .select()
      .single();

    if (newTrackError || !newTrack) {
      logger.error("Failed to create track record", newTrackError);
      throw new Error("Failed to create track record");
    }

    // Get telegram_chat_id if available
    const { data: profile } = await supabase.from("profiles").select("telegram_id").eq("user_id", user.id).single();

    // Create generation task
    const { data: task, error: taskError } = await supabase
      .from("generation_tasks")
      .insert({
        user_id: user.id,
        prompt: prompt || "Mashup",
        status: "pending",
        track_id: newTrack.id,
        telegram_chat_id: profile?.telegram_id || null,
        source: "mini_app",
        generation_mode: "mashup",
        model_used: effectiveModel,
        audio_clips: JSON.stringify({
          source_urls: uploadUrlList,
        }),
      })
      .select()
      .single();

    if (taskError || !task) {
      logger.error("Failed to create generation task", taskError);
      throw new Error("Failed to create generation task");
    }

    const callbackUrl = `${supabaseUrl}/functions/v1/suno-mashup-callback`;

    // Build payload for mashup endpoint
    const sunoPayload: Record<string, unknown> = {
      uploadUrlList,
      customMode,
      title: title || "AI Mashup",
      instrumental,
      model: effectiveModel,
      callBackUrl: callbackUrl,
      callBackType: "all",
    };

    if (customMode) {
      if (prompt) sunoPayload.prompt = prompt;
      if (style) sunoPayload.style = style;
    } else if (prompt) {
      sunoPayload.prompt = prompt;
    }

    logger.info("Sending to mashup endpoint", {
      model: effectiveModel,
      customMode,
      instrumental,
    });

    // Call SunoAPI mashup endpoint
    const mashupController = new AbortController();
    const mashupTimeout = setTimeout(() => mashupController.abort(), 30000);
    const startTime = Date.now();
    const sunoResponse = await fetch("https://api.sunoapi.org/api/v1/generate/mashup", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sunoApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sunoPayload),
      signal: mashupController.signal,
    });
    clearTimeout(mashupTimeout);

    const duration = Date.now() - startTime;
    const sunoData = await sunoResponse.json();

    logger.info(`Response (${duration}ms)`, { response: JSON.stringify(sunoData).substring(0, 300) });

    // Log API call
    await supabase.from("api_usage_logs").insert({
      user_id: user.id,
      service: "suno",
      endpoint: "generate/mashup",
      method: "POST",
      request_body: {
        uploadUrlList: uploadUrlList.map((u: string) => u?.substring(0, 100)),
        customMode,
        prompt,
        style,
        title,
        instrumental,
        model: effectiveModel,
      },
      response_status: sunoResponse.status,
      response_body: sunoData,
      duration_ms: duration,
      estimated_cost: 0.04,
    });

    if (!sunoResponse.ok || !isSunoSuccessCode(sunoData.code)) {
      const errorMsg = sunoData.msg || `SunoAPI mashup failed (${sunoResponse.status})`;
      logger.error("API error", undefined, { errorMsg, sunoData });

      await supabase
        .from("generation_tasks")
        .update({
          status: "failed",
          error_message: errorMsg,
        })
        .eq("id", task.id);

      await supabase
        .from("tracks")
        .update({
          status: "failed",
          error_message: errorMsg,
        })
        .eq("id", newTrack.id);

      throw new Error(errorMsg);
    }

    const sunoTaskId = sunoData.data?.taskId;

    if (!sunoTaskId) {
      throw new Error("No taskId returned from SunoAPI");
    }

    await supabase
      .from("generation_tasks")
      .update({
        suno_task_id: sunoTaskId,
        status: "processing",
      })
      .eq("id", task.id);

    await supabase
      .from("tracks")
      .update({
        suno_task_id: sunoTaskId,
        status: "processing",
      })
      .eq("id", newTrack.id);

    // Deduct credits after successful API call
    const { error: deductError } = await supabase.rpc("deduct_credits", {
      p_user_id: user.id,
      p_amount: MASHUP_COST,
      p_action_type: "mashup_generation",
      p_description: `Mashup generation: ${title || "AI Mashup"}`,
    });

    if (deductError) {
      logger.error("Credit deduct failed", undefined, {
        userId: user.id,
        trackId: newTrack.id,
        sunoTaskId,
        amount: MASHUP_COST,
        error: deductError.message,
      });
      // Don't fail the request, just log it
    } else {
      logger.info("Credit deducted", {
        userId: user.id,
        trackId: newTrack.id,
        sunoTaskId,
        amount: MASHUP_COST,
      });
    }

    logger.success("Mashup generation started", {
      trackId: newTrack.id,
      sunoTaskId,
      creditsDeducted: MASHUP_COST,
    });

    return new Response(
      JSON.stringify({
        success: true,
        trackId: newTrack.id,
        taskId: task.id,
        sunoTaskId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Error", undefined, { errorMessage });
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
