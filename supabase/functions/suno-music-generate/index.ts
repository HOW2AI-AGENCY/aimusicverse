import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { createLogger } from "../_shared/logger.ts";
import { isSunoSuccessCode } from "../_shared/suno.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getApiModelName, MODEL_FALLBACK_CHAIN } from "../_shared/suno-models.ts";
import { getGenerationCost } from "../_shared/economy.ts";

const logger = createLogger("suno-music-generate");

// User-friendly error messages
const ERROR_MESSAGES: Record<string, string> = {
  "model error": "Ошибка модели AI. Пробуем другую модель...",
  "Audio generation failed": "Генерация не удалась. Попробуйте изменить описание.",
  malformed: "Проверьте текст песни. Он должен содержать структуру (куплеты, припевы).",
  "artist name": "Нельзя использовать имена известных артистов. Измените описание.",
  copyrighted: "Текст содержит защищённый материал. Измените слова.",
  "rate limit": "Слишком много запросов. Подождите минуту.",
  credits: "Недостаточно кредитов на балансе.",
  voice: "Кастомный голос недоступен или был отозван. Выберите другой голос или отключите его.",
};

/**
 * Get user-friendly error message
 */
function getUserFriendlyError(errorMsg: string): string {
  const lowerError = errorMsg.toLowerCase();
  for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
    if (lowerError.includes(key.toLowerCase())) {
      return message;
    }
  }
  return errorMsg;
}

/**
 * Check if error is retriable with fallback model
 */
function isRetriableModelError(errorMsg: string): boolean {
  const lowerError = errorMsg.toLowerCase();
  return (
    lowerError.includes("model error") ||
    lowerError.includes("audio generation failed") ||
    lowerError.includes("malformed")
  );
}

/**
 * Check if error is a transient network/server error that should be retried
 */
function isTransientError(status: number | null, errorMsg: string): boolean {
  if (!status) return false;
  // 5xx errors are typically transient
  if (status >= 500 && status < 600) return true;
  // 429 is rate limit - retriable after delay
  if (status === 429) return true;
  // Timeout-like errors
  const lowerError = errorMsg.toLowerCase();
  return lowerError.includes("timeout") || lowerError.includes("network") || lowerError.includes("econnreset");
}

/**
 * Sleep utility for exponential backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let createdTrackId: string | null = null;
  let createdTaskId: string | null = null;
  let planTrackIdForCatch: string | null = null;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const sunoApiKey = Deno.env.get("SUNO_API_KEY");

    if (!sunoApiKey) {
      throw new Error("SUNO_API_KEY not configured");
    }

    const supabase = getSupabaseClient();

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logger.warn("No authorization header");
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (userError || !user) {
      logger.error("User authentication failed", userError);
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Check if user is admin - admins use shared API balance, not personal credits
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    logger.info("User role check", { userId: user.id, isAdmin: !!isAdmin });

    // Parse body first to get model for cost calculation
    const body = await req.json();
    const {
      mode = "simple",
      instrumental = false,
      model = "V4_5ALL",
      prompt,
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
      planTrackId, // Link to project_tracks for status update
      parentTrackId, // Link to parent track for remixes
      language = "ru",
      isPublic = true, // Track visibility - default public
    } = body;

    // Keep for catch block (so we can revert project_tracks on errors)
    planTrackIdForCatch = planTrackId || null;

    // Calculate generation cost based on model
    const generationCost = getGenerationCost(model);

    // Only check personal balance for non-admin users
    if (!isAdmin) {
      logger.info("Checking user credits balance", { userId: user.id });

      const { data: userCredits, error: creditsError } = await supabase
        .from("user_credits")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (creditsError) {
        logger.error("Failed to fetch user credits", creditsError);
        return new Response(JSON.stringify({ success: false, error: "Ошибка проверки баланса" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }

      const userBalance = userCredits?.balance ?? 0;
      logger.info("User credit balance", { userId: user.id, balance: userBalance, required: generationCost, model });

      // Check if user has enough credits for generation
      if (userBalance < generationCost) {
        logger.warn("Insufficient user credits", { balance: userBalance, required: generationCost });
        return new Response(
          JSON.stringify({
            success: false,
            error: `Недостаточно кредитов. Баланс: ${userBalance}, требуется: ${generationCost}`,
            errorCode: "INSUFFICIENT_CREDITS",
            balance: userBalance,
            required: generationCost,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 402 },
        );
      }
    } else {
      logger.info("Admin user - skipping personal balance check, using shared API balance");
    }

    // Update plan track status to in_progress if provided
    if (planTrackId) {
      await supabase.from("project_tracks").update({ status: "in_progress" }).eq("id", planTrackId);
    }

    // Validate required fields
    const customMode = mode === "custom";

    // Prompt validation: required for simple mode and for custom mode with vocals
    // Instrumental tracks in custom mode don't require a prompt (lyrics)
    if (!prompt && (mode === "simple" || (customMode && !instrumental))) {
      logger.warn("Prompt is required", { mode, instrumental });
      return new Response(JSON.stringify({ success: false, error: "Требуется описание музыки" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (customMode && !style) {
      logger.warn("Style is required in custom mode");
      return new Response(JSON.stringify({ success: false, error: "Укажите стиль музыки в custom режиме" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Validate prompt length for non-custom mode (Suno limit: 500 chars)
    if (!customMode && prompt && prompt.length > 500) {
      logger.warn("Prompt too long for simple mode", { promptLength: prompt.length });
      return new Response(
        JSON.stringify({
          success: false,
          error: `Описание слишком длинное (${prompt.length}/500 символов). Сократите текст или используйте Custom режим.`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    if (customMode && !instrumental && prompt && prompt.length > 5000) {
      logger.warn("Prompt too long", { promptLength: prompt.length });
      return new Response(JSON.stringify({ success: false, error: "Текст слишком длинный (макс. 5000 символов)" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Fetch artist data if artistId provided
    let artistData: { id: string; name: string; avatar_url: string | null; suno_persona_id: string | null } | null =
      null;
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

    // Use persona ID from artist if available, otherwise use direct personaId
    const effectivePersonaId = artistData?.suno_persona_id || personaId;

    // Get creator display name for metadata
    const { data: profile } = await supabase
      .from("profiles")
      .select("telegram_id, display_name, username, first_name")
      .eq("user_id", user.id)
      .single();

    const telegramChatId = profile?.telegram_id || null;
    const creatorDisplayName = profile?.display_name || profile?.username || profile?.first_name || null;

    // Create track record with artist info and creator metadata - ALL TRACKS ARE PUBLIC BY DEFAULT
    const { data: track, error: trackError } = await supabase
      .from("tracks")
      .insert({
        user_id: user.id,
        project_id: projectId,
        project_track_id: planTrackId || null, // Link to project_track slot immediately
        prompt: prompt,
        title: customMode ? title : null,
        style: style,
        has_vocals: !instrumental,
        status: "pending",
        provider: "suno",
        suno_model: model,
        generation_mode: mode,
        vocal_gender: vocalGender,
        style_weight: styleWeight,
        negative_tags: negativeTags,
        is_public: isPublic, // Use value from request, default true
        parent_track_id: parentTrackId || null, // Link to parent track for remixes
        // Store artist reference
        artist_id: artistData?.id || null,
        artist_name: artistData?.name || null,
        artist_avatar_url: artistData?.avatar_url || null,
        // Store creator display name
        creator_display_name: creatorDisplayName,
      })
      .select()
      .single();

    if (trackError || !track) {
      logger.error("Track creation error", trackError);
      throw new Error("Failed to create track record");
    }

    createdTrackId = track.id;

    // Create generation task with planTrackId in audio_clips metadata for callback
    const { data: task, error: taskError } = await supabase
      .from("generation_tasks")
      .insert({
        user_id: user.id,
        prompt: prompt,
        status: "pending",
        telegram_chat_id: telegramChatId,
        track_id: track.id,
        source: "mini_app",
        generation_mode: mode,
        model_used: model,
        audio_clips: planTrackId ? JSON.stringify({ project_track_id: planTrackId }) : null,
      })
      .select()
      .single();

    if (taskError || !task) {
      logger.error("Task creation error", taskError);
      throw new Error("Failed to create generation task");
    }

    createdTaskId = task.id;

    // Prepare SunoAPI request
    const callbackUrl = `${supabaseUrl}/functions/v1/suno-music-callback`;

    // Map UI model key to API model name
    const apiModel = getApiModelName(model);
    logger.info("Model mapping", { from: model, to: apiModel });

    const sunoPayload: Record<string, unknown> = {
      customMode,
      instrumental,
      model: apiModel,
      callBackUrl: callbackUrl,
      // Subscribe to all three callback stages (text → first → complete).
      // Without this, providers may only deliver "complete", so the user
      // sees no title/lyrics/streaming URL until the final render finishes.
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
      // If persona is from an artist, use default style_persona
    } else if (voiceId) {
      // Custom voice: map voiceId → personaId with voice_persona model
      sunoPayload.personaId = voiceId;
      sunoPayload.personaModel = "voice_persona";
    }

    logger.info("Suno generate payload prepared", {
      tag: "[suno-music-generate]",
      event: "payload_prepared",
      mode,
      model: apiModel,
      instrumental,
      hasVoiceId: !!voiceId,
      voiceIdHash: voiceId ? String(voiceId).slice(0, 8) : null,
      hasPersonaId: !!effectivePersonaId,
      personaModel: voiceId && !effectivePersonaId ? "voice_persona" : effectivePersonaId ? "style_persona" : undefined,
      userId: user.id,
    });
    logger.apiCall("suno", "/api/v1/generate", { mode, model: apiModel, instrumental });

    // Call SunoAPI with enhanced retry logic:
    // - Model fallback for model errors
    // - Exponential backoff for transient errors
    // - Maximum attempts to prevent infinite loops
    let currentModel = apiModel;
    let retryCount = 0;
    const maxRetries = 3;
    let sunoResponse: Response | null = null;
    let sunoData: Record<string, unknown> | null = null;
    let lastErrorMsg = "";
    let lastStatus: number | null = null;

    while (retryCount <= maxRetries) {
      sunoPayload.model = currentModel;

      const startTime = Date.now();
      try {
        sunoResponse = await fetch("https://api.sunoapi.org/api/v1/generate", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sunoApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sunoPayload),
          // Add timeout to prevent hanging requests
          signal: AbortSignal.timeout(30000), // 30s timeout
        });
      } catch (networkError: any) {
        // Network-level failure (timeout, connection reset, DNS failure)
        logger.error("Suno API network error", networkError, { attempt: retryCount + 1 });
        lastErrorMsg = networkError.message || "Network error";
        lastStatus = null;

        // Retry with exponential backoff for network errors
        if (retryCount < maxRetries) {
          const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 8000); // 1s, 2s, 4s, max 8s
          logger.info(`Retrying after network error in ${backoffMs}ms`, { attempt: retryCount + 1 });
          await sleep(backoffMs);
          retryCount++;
          continue;
        }
        // Max retries exceeded - fall through to error handling
        break;
      }

      const duration = Date.now() - startTime;
      sunoData = await sunoResponse.json();

      logger.info("Suno API response", {
        durationMs: duration,
        status: sunoResponse.status,
        model: currentModel,
        attempt: retryCount + 1,
      });

      // Log API call
      await supabase.from("api_usage_logs").insert({
        user_id: user.id,
        service: "suno",
        endpoint: "generate",
        method: "POST",
        request_body: { ...sunoPayload, attempt: retryCount + 1 },
        response_status: sunoResponse.status,
        response_body: sunoData,
        duration_ms: duration,
        estimated_cost: 0.05,
      });

      lastStatus = sunoResponse.status;
      lastErrorMsg = sunoData?.msg || sunoData?.message || "SunoAPI request failed";

      // Check if successful
      if (sunoResponse.ok && isSunoSuccessCode(sunoData?.code)) {
        break; // Success - exit loop
      }

      // Determine retry strategy
      const isModelError = isRetriableModelError(lastErrorMsg);
      const isTransient = isTransientError(sunoResponse.status, lastErrorMsg);
      const canFallback = isModelError && MODEL_FALLBACK_CHAIN[currentModel];

      if (canFallback) {
        // Model fallback strategy
        const fallbackModel = MODEL_FALLBACK_CHAIN[currentModel];
        logger.warn("Model error, attempting fallback", {
          from: currentModel,
          to: fallbackModel,
          error: lastErrorMsg,
        });
        currentModel = fallbackModel;
        retryCount++;
        continue;
      }

      if (isTransient && retryCount < maxRetries) {
        // Exponential backoff for transient errors
        const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 8000);
        logger.warn(`Transient error, retrying in ${backoffMs}ms`, {
          status: sunoResponse.status,
          error: lastErrorMsg,
          attempt: retryCount + 1,
        });
        await sleep(backoffMs);
        retryCount++;
        continue;
      }

      // Non-retriable error or max retries exceeded
      break;
    }

    // Handle final error state
    const finalSuccess = sunoResponse && sunoResponse.ok && isSunoSuccessCode(sunoData?.code);
    if (!finalSuccess) {
      logger.error("SunoAPI error (final)", null, {
        status: lastStatus,
        data: sunoData,
        attempts: retryCount + 1,
        finalModel: currentModel,
      });

      const userFriendlyError = getUserFriendlyError(lastErrorMsg);

      // Handle rate limiting
      if (lastStatus === 429) {
        const rateLimitMsg = "Превышен лимит запросов. Попробуйте через минуту.";
        await supabase
          .from("generation_tasks")
          .update({
            status: "failed",
            error_message: rateLimitMsg,
          })
          .eq("id", task.id);

        await supabase
          .from("tracks")
          .update({
            status: "failed",
            error_message: rateLimitMsg,
          })
          .eq("id", track.id);

        return new Response(
          JSON.stringify({
            success: false,
            error: rateLimitMsg,
            errorCode: "RATE_LIMIT",
            retryAfter: 60,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 },
        );
      }

      // Handle insufficient credits
      if (lastStatus === 402) {
        const creditsMsg = "Недостаточно кредитов на аккаунте";
        await supabase
          .from("generation_tasks")
          .update({
            status: "failed",
            error_message: creditsMsg,
          })
          .eq("id", task.id);

        await supabase
          .from("tracks")
          .update({
            status: "failed",
            error_message: creditsMsg,
          })
          .eq("id", track.id);

        return new Response(
          JSON.stringify({
            success: false,
            error: creditsMsg,
            errorCode: "INSUFFICIENT_CREDITS",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 402 },
        );
      }

      // Update task and track as failed with user-friendly error
      await supabase
        .from("generation_tasks")
        .update({
          status: "failed",
          error_message: userFriendlyError,
        })
        .eq("id", task.id);

      await supabase
        .from("tracks")
        .update({
          status: "failed",
          error_message: userFriendlyError,
        })
        .eq("id", track.id);

      // Determine error code for client
      let errorCode = "GENERATION_FAILED";
      const lowerError = lastErrorMsg.toLowerCase();
      if (lowerError.includes("artist name")) errorCode = "ARTIST_NAME_NOT_ALLOWED";
      if (lowerError.includes("copyrighted")) errorCode = "COPYRIGHTED_CONTENT";
      if (lowerError.includes("malformed")) errorCode = "MALFORMED_LYRICS";
      if (lowerError.includes("voice")) errorCode = "VOICE_UNAVAILABLE";

      return new Response(
        JSON.stringify({
          success: false,
          error: userFriendlyError,
          errorCode,
          originalError: lastErrorMsg,
          canRetry: ![
            "ARTIST_NAME_NOT_ALLOWED",
            "COPYRIGHTED_CONTENT",
            "MALFORMED_LYRICS",
            "VOICE_UNAVAILABLE",
          ].includes(errorCode),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
      );
    }

    // Update model_used if fallback was used
    if (currentModel !== apiModel) {
      await supabase
        .from("generation_tasks")
        .update({
          model_used: currentModel,
        })
        .eq("id", task.id);

      await supabase
        .from("tracks")
        .update({
          suno_model: currentModel,
        })
        .eq("id", track.id);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sunoTaskId =
      (sunoData as any)?.data?.taskId ?? (sunoData as any)?.data?.task_id ?? (sunoData as any)?.data?.id;

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
      .eq("id", track.id);

    // Log the generation
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
      },
    });

    logger.success("Generation started", {
      trackId: track.id,
      taskId: task.id,
      sunoTaskId,
      model: currentModel,
      retries: retryCount,
    });

    return new Response(
      JSON.stringify({
        success: true,
        trackId: track.id,
        taskId: task.id,
        sunoTaskId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: any) {
    logger.error("Error in suno-music-generate", error);

    const message = (error?.message || "Unknown error").toString();

    // If we already created DB records, ensure they don't stay stuck in `pending`.
    try {
      const supabase = getSupabaseClient();

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
          .update({
            status: "failed",
            error_message: message.substring(0, 500),
          })
          .eq("id", createdTrackId);
      }

      // If a project track slot was marked in progress, revert it to failed so UI doesn't hang.
      if (planTrackIdForCatch) {
        await supabase.from("project_tracks").update({ status: "failed" }).eq("id", planTrackIdForCatch);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (markErr: any) {
      logger.error("Failed to mark generation as failed after exception", markErr);
    }

    // Try to log error to database notification if we have auth context
    try {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const supabase = getSupabaseClient();

        const {
          data: { user },
        } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

        if (user) {
          await supabase.from("notifications").insert({
            user_id: user.id,
            type: "error",
            title: "Ошибка генерации",
            message: message.substring(0, 250),
            metadata: { error_type: "generation_error", original_message: message },
          });
        }
      }
    } catch (logError) {
      logger.error("Failed to log error notification", logError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
