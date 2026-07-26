import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getApiModelName } from "../_shared/suno-models.ts";
import { getGenerationCost } from "../_shared/economy.ts";
import { normalizeSunoLyrics, didNormalizeLyrics } from "../_shared/lyrics-normalize.ts";
import {
  getUserFriendlyError,
  classifyErrorCode,
  NON_RETRIABLE_ERROR_CODES,
} from "./errors.ts";
import { callSunoWithRetry } from "./suno-client.ts";
import {
  createTrackRecord,
  createGenerationTask,
  markFailure,
  updateFallbackModel,
  bindSunoTaskId,
} from "./db.ts";
import { createScopedLogger, generateCorrelationId } from "./log.ts";
import { recordSunoEvent, type SunoOutcome } from "./metrics.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const correlationId =
    req.headers.get("X-Correlation-Id") || req.headers.get("x-correlation-id") || generateCorrelationId();
  const logger = createScopedLogger(correlationId);
  const requestStart = Date.now();

  let createdTrackId: string | null = null;
  let createdTaskId: string | null = null;
  let planTrackIdForCatch: string | null = null;
  let capturedUserId: string | null = null;
  let requestedModel: string | null = null;

  const supabase = getSupabaseClient();

  const jsonResponse = (status: number, body: Record<string, unknown>) =>
    new Response(JSON.stringify({ ...body, correlationId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "X-Correlation-Id": correlationId },
      status,
    });

  const emit = (params: {
    outcome: SunoOutcome;
    httpStatus?: number | null;
    errorCode?: string | null;
    errorMessage?: string | null;
    modelRequested?: string | null;
    modelUsed?: string | null;
    retryCount?: number;
    fallbackUsed?: boolean;
    trackId?: string | null;
    taskId?: string | null;
    sunoTaskId?: string | null;
    metadata?: Record<string, unknown>;
  }) =>
    recordSunoEvent(supabase, {
      correlationId,
      userId: capturedUserId,
      durationMs: Date.now() - requestStart,
      modelRequested: params.modelRequested ?? requestedModel,
      ...params,
    });

  try {
    const sunoApiKey = Deno.env.get("SUNO_API_KEY");
    if (!sunoApiKey) throw new Error("SUNO_API_KEY not configured");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logger.warn("No authorization header");
      await emit({ outcome: "unauthorized", httpStatus: 401, errorCode: "NO_AUTH_HEADER" });
      return jsonResponse(401, { success: false, error: "Unauthorized" });
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (userError || !user) {
      logger.error("User authentication failed", userError);
      await emit({
        outcome: "unauthorized",
        httpStatus: 401,
        errorCode: "AUTH_FAILED",
        errorMessage: userError?.message,
      });
      return jsonResponse(401, { success: false, error: "Unauthorized" });
    }
    capturedUserId = user.id;

    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    logger.info("User role check", { userId: user.id, isAdmin: !!isAdmin });

    const body = await req.json();
    const {
      mode = "simple",
      instrumental = false,
      model = "V4_5ALL",
      prompt: rawPrompt,
      title,
      style,
      negativeTags,
      vocalGender,
      styleWeight,
      weirdnessConstraint,
      audioWeight,
      personaId,
      voiceId,
      projectId,
      artistId,
      planTrackId,
      parentTrackId,
      language = "ru",
      isPublic = true,
    } = body;
    void language;

    // In custom (lyrics) mode the prompt IS the lyrics — Suno ignores Markdown
    // decoration such as **[Verse]**, so normalize before anything else.
    const customMode = mode === "custom";
    const prompt =
      customMode && !instrumental && typeof rawPrompt === "string" ? normalizeSunoLyrics(rawPrompt) : rawPrompt;
    if (customMode && !instrumental && didNormalizeLyrics(rawPrompt)) {
      logger.info("Lyrics normalized for Suno format", { userId: user.id });
    }

    requestedModel = model;
    planTrackIdForCatch = planTrackId || null;
    const generationCost = getGenerationCost(model);
    logger.info("Request received", { mode, model, instrumental, hasPlanTrack: !!planTrackId });

    // Balance check
    if (!isAdmin) {
      const { data: userCredits, error: creditsError } = await supabase
        .from("user_credits")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (creditsError) {
        logger.error("Failed to fetch user credits", creditsError);
        await emit({
          outcome: "exception",
          httpStatus: 500,
          errorCode: "CREDITS_FETCH_FAILED",
          errorMessage: creditsError.message,
        });
        return jsonResponse(500, { success: false, error: "Ошибка проверки баланса" });
      }

      const userBalance = userCredits?.balance ?? 0;
      if (userBalance < generationCost) {
        logger.warn("Insufficient user credits", { balance: userBalance, required: generationCost });
        await emit({
          outcome: "insufficient_credits",
          httpStatus: 402,
          errorCode: "INSUFFICIENT_CREDITS",
          metadata: { balance: userBalance, required: generationCost, scope: "user_wallet" },
        });
        return jsonResponse(402, {
          success: false,
          error: `Недостаточно кредитов. Баланс: ${userBalance}, требуется: ${generationCost}`,
          errorCode: "INSUFFICIENT_CREDITS",
          balance: userBalance,
          required: generationCost,
        });
      }
    } else {
      logger.info("Admin user - skipping personal balance check");
    }

    if (planTrackId) {
      await supabase.from("project_tracks").update({ status: "in_progress" }).eq("id", planTrackId);
    }

    // Validation
    const customMode = mode === "custom";
    const validationFail = (msg: string, code: string, extra?: Record<string, unknown>) => {
      logger.warn("Validation failed", { code, msg, ...extra });
      emit({
        outcome: "validation_error",
        httpStatus: 400,
        errorCode: code,
        errorMessage: msg,
        metadata: extra,
      });
      return jsonResponse(400, { success: false, error: msg, errorCode: code });
    };
    if (!prompt && (mode === "simple" || (customMode && !instrumental))) {
      return validationFail("Требуется описание музыки", "PROMPT_REQUIRED", { mode, instrumental });
    }
    if (customMode && !style) {
      return validationFail("Укажите стиль музыки в custom режиме", "STYLE_REQUIRED");
    }
    if (!customMode && prompt && prompt.length > 500) {
      return validationFail(
        `Описание слишком длинное (${prompt.length}/500 символов). Сократите текст или используйте Custom режим.`,
        "PROMPT_TOO_LONG_SIMPLE",
        { promptLength: prompt.length },
      );
    }
    if (customMode && !instrumental && prompt && prompt.length > 5000) {
      return validationFail("Текст слишком длинный (макс. 5000 символов)", "PROMPT_TOO_LONG_CUSTOM", {
        promptLength: prompt.length,
      });
    }

    // Artist lookup
    let artistData: { id: string; name: string; avatar_url: string | null; suno_persona_id: string | null } | null = null;
    if (artistId) {
      const { data: artist, error: artistError } = await supabase
        .from("artists")
        .select("id, name, avatar_url, suno_persona_id")
        .eq("id", artistId)
        .single();
      if (!artistError && artist) {
        artistData = artist;
        logger.info("Found artist", { name: artist.name, hasPersona: !!artist.suno_persona_id });
      }
    }
    const effectivePersonaId = artistData?.suno_persona_id || personaId;

    const { data: profile } = await supabase
      .from("profiles")
      .select("telegram_id, display_name, username, first_name")
      .eq("user_id", user.id)
      .single();
    const telegramChatId = profile?.telegram_id || null;
    const creatorDisplayName = profile?.display_name || profile?.username || profile?.first_name || null;

    // Create records
    const track = await createTrackRecord(
      supabase,
      {
        userId: user.id,
        projectId,
        planTrackId,
        parentTrackId,
        prompt,
        title,
        style,
        instrumental,
        isPublic,
        mode,
        model,
        vocalGender,
        customVoiceId: voiceId || null,


        styleWeight,
        negativeTags,
        customMode,
        artistData: artistData
          ? { id: artistData.id, name: artistData.name, avatar_url: artistData.avatar_url }
          : null,
        creatorDisplayName,
      },
      logger,
    );
    createdTrackId = track.id;

    const task = await createGenerationTask(
      supabase,
      {
        userId: user.id,
        prompt,
        telegramChatId,
        trackId: track.id,
        mode,
        model,
        planTrackId,
        correlationId,
      },
      logger,
    );
    createdTaskId = task.id;

    // Suno payload
    const callbackUrl = `${supabaseUrl}/functions/v1/suno-music-callback`;
    const apiModel = getApiModelName(model);
    logger.info("Model mapping", { from: model, to: apiModel });

    const sunoPayload: Record<string, unknown> = {
      customMode,
      instrumental,
      model: apiModel,
      callBackUrl: callbackUrl,
      callBackType: "all",
    };
    if (customMode) {
      sunoPayload.prompt = prompt;
      sunoPayload.style = style;
      if (title) sunoPayload.title = title;
    } else {
      sunoPayload.prompt = prompt;
    }
    if (negativeTags) sunoPayload.negativeTags = negativeTags;
    if (vocalGender) sunoPayload.vocalGender = vocalGender;
    if (styleWeight !== undefined) sunoPayload.styleWeight = styleWeight;
    if (weirdnessConstraint !== undefined) sunoPayload.weirdnessConstraint = weirdnessConstraint;
    if (audioWeight !== undefined) sunoPayload.audioWeight = audioWeight;
    if (effectivePersonaId) {
      sunoPayload.personaId = effectivePersonaId;
    } else if (voiceId) {
      sunoPayload.personaId = voiceId;
      sunoPayload.personaModel = "voice_persona";
    }

    logger.info("Suno generate payload prepared", {
      event: "payload_prepared",
      mode,
      model: apiModel,
      instrumental,
      hasVoiceId: !!voiceId,
      hasPersonaId: !!effectivePersonaId,
    });
    logger.apiCall("suno", "/api/v1/generate", { mode, model: apiModel, instrumental });

    // Call Suno with retry
    const result = await callSunoWithRetry({
      sunoApiKey,
      supabase,
      userId: user.id,
      payload: sunoPayload,
      initialModel: apiModel,
      logger: logger.child({ phase: "suno_call" }),
    });
    const { data: sunoData, lastErrorMsg, lastStatus, currentModel, retryCount } = result;

    if (!result.success) {
      logger.error("SunoAPI error (final)", null, {
        status: lastStatus,
        attempts: retryCount + 1,
        finalModel: currentModel,
        error: lastErrorMsg,
      });

      const userFriendlyError = getUserFriendlyError(lastErrorMsg);

      if (lastStatus === 429) {
        const msg = "Превышен лимит запросов. Попробуйте через минуту.";
        await markFailure(supabase, task.id, track.id, msg, logger);
        await emit({
          outcome: "rate_limit",
          httpStatus: 429,
          errorCode: "RATE_LIMIT",
          errorMessage: lastErrorMsg,
          modelUsed: currentModel,
          retryCount,
          fallbackUsed: currentModel !== apiModel,
          trackId: track.id,
          taskId: task.id,
        });
        return jsonResponse(429, {
          success: false,
          error: msg,
          errorCode: "RATE_LIMIT",
          retryAfter: 60,
        });
      }

      if (lastStatus === 402) {
        const msg = "Недостаточно кредитов на аккаунте";
        await markFailure(supabase, task.id, track.id, msg, logger);
        await emit({
          outcome: "insufficient_credits",
          httpStatus: 402,
          errorCode: "INSUFFICIENT_CREDITS",
          errorMessage: lastErrorMsg,
          modelUsed: currentModel,
          retryCount,
          fallbackUsed: currentModel !== apiModel,
          trackId: track.id,
          taskId: task.id,
          metadata: { scope: "provider_account" },
        });
        return jsonResponse(402, { success: false, error: msg, errorCode: "INSUFFICIENT_CREDITS" });
      }

      await markFailure(supabase, task.id, track.id, userFriendlyError, logger);

      const errorCode = classifyErrorCode(lastErrorMsg);
      await emit({
        outcome: "failure",
        httpStatus: lastStatus ?? 500,
        errorCode,
        errorMessage: lastErrorMsg,
        modelUsed: currentModel,
        retryCount,
        fallbackUsed: currentModel !== apiModel,
        trackId: track.id,
        taskId: task.id,
      });
      return jsonResponse(500, {
        success: false,
        error: userFriendlyError,
        errorCode,
        originalError: lastErrorMsg,
        canRetry: !NON_RETRIABLE_ERROR_CODES.includes(errorCode),
      });
    }

    if (currentModel !== apiModel) {
      await updateFallbackModel(supabase, task.id, track.id, currentModel);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sunoTaskId =
      (sunoData as any)?.data?.taskId ?? (sunoData as any)?.data?.task_id ?? (sunoData as any)?.data?.id;
    if (!sunoTaskId) throw new Error("No taskId returned from SunoAPI");

    await bindSunoTaskId(supabase, task.id, track.id, sunoTaskId);

    await supabase.from("track_change_log").insert({
      track_id: track.id,
      user_id: user.id,
      change_type: "generation_started",
      changed_by: "suno_api",
      ai_model_used: model,
      prompt_used: prompt,
      metadata: {
        mode,
        instrumental,
        style,
        model,
        suno_task_id: sunoTaskId,
        artist_id: artistData?.id,
        artist_name: artistData?.name,
        fallback_used: currentModel !== apiModel,
        retry_count: retryCount,
        correlation_id: correlationId,
      },
    });

    await emit({
      outcome: "success",
      httpStatus: 200,
      modelUsed: currentModel,
      retryCount,
      fallbackUsed: currentModel !== apiModel,
      trackId: track.id,
      taskId: task.id,
      sunoTaskId,
    });

    logger.success("Generation started", {
      trackId: track.id,
      taskId: task.id,
      sunoTaskId,
      model: currentModel,
      retries: retryCount,
    });

    return jsonResponse(200, { success: true, trackId: track.id, taskId: task.id, sunoTaskId });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    logger.error("Error in suno-music-generate", error);
    const message = (error?.message || "Unknown error").toString();

    try {
      if (createdTaskId) {
        await supabase
          .from("generation_tasks")
          .update({
            status: "failed",
            error_message: message.substring(0, 500),
            completed_at: new Date().toISOString(),
          })
          .eq("id", createdTaskId);
      }
      if (createdTrackId) {
        await supabase
          .from("tracks")
          .update({ status: "failed", error_message: message.substring(0, 500) })
          .eq("id", createdTrackId);
      }
      if (planTrackIdForCatch) {
        await supabase.from("project_tracks").update({ status: "failed" }).eq("id", planTrackIdForCatch);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (markErr: any) {
      logger.error("Failed to mark generation as failed after exception", markErr);
    }

    try {
      if (capturedUserId) {
        await supabase.from("notifications").insert({
          user_id: capturedUserId,
          type: "error",
          title: "Ошибка генерации",
          message: message.substring(0, 250),
          metadata: {
            error_type: "generation_error",
            original_message: message,
            correlation_id: correlationId,
          },
        });
      }
    } catch (logError) {
      logger.error("Failed to log error notification", logError);
    }

    await emit({
      outcome: "exception",
      httpStatus: 500,
      errorCode: "UNCAUGHT_EXCEPTION",
      errorMessage: message,
      trackId: createdTrackId,
      taskId: createdTaskId,
    });

    return jsonResponse(500, { success: false, error: message });
  }
});
