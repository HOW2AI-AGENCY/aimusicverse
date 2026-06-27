import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { createLogger } from "../_shared/logger.ts";
import { isSunoSuccessCode } from "../_shared/suno.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getApiModelName } from "../_shared/suno-models.ts";
import { getGenerationCost, ECONOMY } from "../_shared/economy.ts";

const logger = createLogger("suno-music-extend");

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

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (userError || !user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const body = await req.json();
    const {
      sourceTrackId,
      defaultParamFlag = false, // false means use custom parameters
      continueAt,
      prompt,
      style,
      title,
      model,
      negativeTags,
      vocalGender,
      styleWeight,
      weirdnessConstraint,
      audioWeight,
      personaId,
      projectId,
    } = body;

    if (!sourceTrackId) {
      throw new Error("sourceTrackId is required");
    }

    // Get source track
    const { data: sourceTrack, error: sourceError } = await supabase
      .from("tracks")
      .select("*")
      .eq("id", sourceTrackId)
      .eq("user_id", user.id)
      .single();

    if (sourceError || !sourceTrack) {
      throw new Error("Source track not found or access denied");
    }

    if (!sourceTrack.suno_id) {
      throw new Error("Source track does not have a Suno ID");
    }

    // Check and deduct credits
    const extendCost = ECONOMY.EXTEND_GENERATION_COST;
    const { data: userCredits } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    const userBalance = userCredits?.balance ?? 0;
    if (userBalance < extendCost) {
      logger.warn("Insufficient credits for extend", { balance: userBalance, required: extendCost });
      return new Response(
        JSON.stringify({
          success: false,
          error: `Недостаточно кредитов. Баланс: ${userBalance}, требуется: ${extendCost}`,
          errorCode: "INSUFFICIENT_CREDITS",
          balance: userBalance,
          required: extendCost,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 402 },
      );
    }

    // When defaultParamFlag is false (custom mode), we need prompt, style, title
    // When defaultParamFlag is true (use original), we can skip them
    const useCustomParams = !defaultParamFlag;

    // Build effective values - always have fallbacks
    const effectivePrompt = prompt || sourceTrack.prompt || "Продолжить в том же стиле";
    const effectiveStyle = style || sourceTrack.style || "pop";
    const effectiveTitle = title || `${sourceTrack.title || "Трек"} (Extended)`;
    const effectiveContinueAt = continueAt || sourceTrack.duration_seconds || 30;

    const effectiveModel = getApiModelName(model || sourceTrack.suno_model || "V4_5ALL");

    logger.info("Extend track request", {
      sourceTrackId,
      useCustomParams,
      continueAt: effectiveContinueAt,
      model: effectiveModel,
    });

    // Create new track record for extension
    const { data: newTrack, error: trackError } = await supabase
      .from("tracks")
      .insert({
        user_id: user.id,
        project_id: projectId || sourceTrack.project_id,
        prompt: effectivePrompt,
        title: effectiveTitle,
        style: effectiveStyle,
        has_vocals: sourceTrack.has_vocals,
        status: "pending",
        provider: "suno",
        suno_model: effectiveModel,
        generation_mode: "extend",
        vocal_gender: vocalGender,
        style_weight: styleWeight,
        negative_tags: negativeTags,
      })
      .select()
      .single();

    if (trackError || !newTrack) {
      logger.error("Track creation error", trackError);
      throw new Error("Failed to create track record");
    }

    // Get telegram_chat_id if available
    const { data: profile } = await supabase.from("profiles").select("telegram_id").eq("user_id", user.id).single();

    const telegramChatId = profile?.telegram_id || null;

    // Create generation task
    const { data: task, error: taskError } = await supabase
      .from("generation_tasks")
      .insert({
        user_id: user.id,
        prompt: prompt || `Extend from ${sourceTrack.title}`,
        status: "pending",
        telegram_chat_id: telegramChatId,
        track_id: newTrack.id,
        source: "mini_app",
        generation_mode: "extend",
        model_used: effectiveModel,
      })
      .select()
      .single();

    if (taskError || !task) {
      logger.error("Task creation error", taskError);
      throw new Error("Failed to create generation task");
    }

    // Create track version relationship
    await supabase.from("track_versions").insert({
      track_id: newTrack.id,
      audio_url: sourceTrack.audio_url || "",
      cover_url: sourceTrack.cover_url,
      duration_seconds: sourceTrack.duration_seconds,
      version_type: "extended_from",
      parent_version_id: null,
      metadata: {
        source_track_id: sourceTrackId,
        continue_at: continueAt,
      },
    });

    // Prepare SunoAPI extend request
    const callbackUrl = `${supabaseUrl}/functions/v1/suno-music-callback`;

    // Per SunoAPI docs:
    // defaultParamFlag=true: use original track params (no prompt/style/title needed)
    // defaultParamFlag=false: use custom params (prompt/style/title required)
    const sunoPayload: Record<string, unknown> = {
      defaultParamFlag,
      audioId: sourceTrack.suno_id,
      model: effectiveModel,
      callBackUrl: callbackUrl,
      continueAt: effectiveContinueAt,
    };

    // Always include these for custom mode, and as fallback for default mode
    if (!defaultParamFlag || prompt) {
      sunoPayload.prompt = effectivePrompt;
    }
    if (!defaultParamFlag || style) {
      sunoPayload.style = effectiveStyle;
    }
    if (!defaultParamFlag || title) {
      sunoPayload.title = effectiveTitle;
    }

    if (negativeTags) sunoPayload.negativeTags = negativeTags;
    if (vocalGender) sunoPayload.vocalGender = vocalGender;
    if (styleWeight !== undefined) sunoPayload.styleWeight = styleWeight;
    if (weirdnessConstraint !== undefined) sunoPayload.weirdnessConstraint = weirdnessConstraint;
    if (audioWeight !== undefined) sunoPayload.audioWeight = audioWeight;
    if (personaId) sunoPayload.personaId = personaId;

    logger.info("Sending extend request to SunoAPI", { payload: sunoPayload });

    // Call SunoAPI extend endpoint
    const startTime = Date.now();
    const sunoResponse = await fetch("https://api.sunoapi.org/api/v1/generate/extend", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sunoApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sunoPayload),
    });

    const duration = Date.now() - startTime;
    const sunoData = await sunoResponse.json();

    logger.info("Extend response received", { durationMs: duration });

    // Log API call
    await supabase.from("api_usage_logs").insert({
      user_id: user.id,
      service: "suno",
      endpoint: "extend",
      method: "POST",
      request_body: sunoPayload,
      response_status: sunoResponse.status,
      response_body: sunoData,
      duration_ms: duration,
      estimated_cost: 0.03,
    });

    if (!sunoResponse.ok || !isSunoSuccessCode(sunoData.code)) {
      logger.error("SunoAPI extend error", null, { response: sunoData });

      // Update task and track as failed
      await supabase
        .from("generation_tasks")
        .update({
          status: "failed",
          error_message: sunoData.msg || "SunoAPI extend request failed",
        })
        .eq("id", task.id);

      await supabase
        .from("tracks")
        .update({
          status: "failed",
          error_message: sunoData.msg || "SunoAPI extend request failed",
        })
        .eq("id", newTrack.id);

      throw new Error(sunoData.msg || "SunoAPI extend request failed");
    }

    const sunoTaskId = sunoData.data?.taskId;

    if (!sunoTaskId) {
      throw new Error("No taskId returned from SunoAPI");
    }

    // Update task with Suno taskId
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

    // Deduct credits
    await supabase.rpc("deduct_credits", { p_user_id: user.id, p_amount: extendCost });
    await supabase.from("credit_transactions").insert({
      user_id: user.id,
      amount: -extendCost,
      type: "generation",
      description: `Extend track: ${effectiveTitle}`,
      metadata: { track_id: newTrack.id, source_track_id: sourceTrackId, model: effectiveModel },
    });

    // Log the extension
    await supabase.from("track_change_log").insert({
      track_id: newTrack.id,
      user_id: user.id,
      change_type: "track_extended",
      changed_by: "suno_api",
      ai_model_used: effectiveModel,
      prompt_used: prompt || "Using original parameters",
      metadata: {
        source_track_id: sourceTrackId,
        continue_at: continueAt,
        default_param_flag: defaultParamFlag,
        model: effectiveModel,
        suno_task_id: sunoTaskId,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        trackId: newTrack.id,
        taskId: task.id,
        sunoTaskId,
        sourceTrackId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: any) {
    logger.error("Error in suno-music-extend", error);
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
