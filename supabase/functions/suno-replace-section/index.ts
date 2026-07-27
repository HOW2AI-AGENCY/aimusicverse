import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { createLogger } from "../_shared/logger.ts";
import { isSunoSuccessCode } from "../_shared/suno.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { ECONOMY } from "../_shared/economy.ts";
import { normalizeSunoLyrics, didNormalizeLyrics } from "../_shared/lyrics-normalize.ts";

const logger = createLogger("suno-replace-section");
const REPLACE_SECTION_COST = ECONOMY.REPLACE_SECTION_COST;

const SUNO_API_URL = "https://api.sunoapi.org/api/v1/generate/replace-section";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sunoApiKey = Deno.env.get("SUNO_API_KEY")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    const supabase = getSupabaseClient();

    // Get user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      logger.error("Auth error", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const trackId = body.trackId;
    const prompt = body.prompt;
    const tags = body.tags;
    const infillStartS = body.infillStartS ?? body.startTime;
    const infillEndS = body.infillEndS ?? body.endTime;
    const rawFullLyrics =
      typeof body.fullLyrics === "string" ? body.fullLyrics : typeof body.lyrics === "string" ? body.lyrics : "";
    const rawSectionLyrics = typeof body.sectionLyrics === "string" ? body.sectionLyrics : "";
    // Suno ignores Markdown decoration (**[Verse]**) — normalize before sending
    const requestFullLyrics = normalizeSunoLyrics(rawFullLyrics);
    const sectionLyrics = normalizeSunoLyrics(rawSectionLyrics);
    if (didNormalizeLyrics(rawFullLyrics) || didNormalizeLyrics(rawSectionLyrics)) {
      logger.info("Lyrics normalized for Suno", { trackId });
    }

    logger.info("Replace section request", {
      trackId,
      infillStartS,
      infillEndS,
      promptLength: prompt?.length,
    });

    // Validate required fields
    if (!trackId || infillStartS === undefined || infillEndS === undefined) {
      return new Response(JSON.stringify({ error: "Missing required fields: trackId, infillStartS, infillEndS" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check user credits balance
    const { data: userCredits, error: creditsError } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    if (creditsError || !userCredits) {
      logger.error("Failed to check user credits", creditsError);
      return new Response(JSON.stringify({ error: "Failed to check user credits" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (userCredits.balance < REPLACE_SECTION_COST) {
      logger.warn("Insufficient credits", { balance: userCredits.balance, required: REPLACE_SECTION_COST });
      return new Response(
        JSON.stringify({
          error: "Недостаточно кредитов",
          required: REPLACE_SECTION_COST,
          balance: userCredits.balance,
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    logger.info("Credits check passed", { balance: userCredits.balance, cost: REPLACE_SECTION_COST });

    // Get track data to retrieve suno_id and suno_task_id
    logger.info("Fetching track", { trackId, userId: user.id });

    const { data: track, error: trackError } = await supabase
      .from("tracks")
      .select("*, track_versions!track_versions_track_id_fkey(*)")
      .eq("id", trackId)
      .eq("user_id", user.id)
      .single();

    if (trackError) {
      logger.error("Track query error", null, {
        code: trackError.code,
        message: trackError.message,
        details: trackError.details,
        hint: trackError.hint,
      });
      return new Response(JSON.stringify({ error: "Track not found or access denied", details: trackError.message }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!track) {
      logger.error("Track not found - null result", null, { trackId, userId: user.id });
      return new Response(JSON.stringify({ error: "Track not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logger.info("Track found", {
      trackId: track.id,
      sunoId: track.suno_id,
      taskId: track.suno_task_id,
      versionsCount: track.track_versions?.length,
    });

    // We need the suno_id (audioId) from the active version
    const activeVersion = track.track_versions?.find((v: Record<string, unknown>) => v.id === track.active_version_id);
    const audioId = activeVersion?.metadata?.suno_id || track.suno_id;
    const taskId = track.suno_task_id;

    if (!audioId || !taskId) {
      logger.error("Missing Suno IDs", { audioId, taskId });
      return new Response(JSON.stringify({ error: "Track is missing Suno audio ID or task ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate section duration: Suno accepts 6-60s, and we cap at 50% of the track.
    const sectionDuration = infillEndS - infillStartS;
    const trackDuration = track.duration_seconds || 0;
    const maxAllowed = Math.min(60, trackDuration > 0 ? trackDuration * 0.5 : 60);

    if (sectionDuration < 6 || sectionDuration > maxAllowed) {
      return new Response(
        JSON.stringify({
          error: `Selected section must be between 6 and ${Math.floor(maxAllowed)} seconds (Suno limit: 6-60s, max 50% of track)`,
          maxDuration: Math.floor(maxAllowed),
          minDuration: 6,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Get user's telegram chat ID for notifications
    const { data: profile } = await supabase.from("profiles").select("telegram_id").eq("user_id", user.id).single();

    // Create callback URL
    const callbackUrl = `${supabaseUrl}/functions/v1/suno-music-callback`;

    // Suno replace-section uses `prompt` for the replacement lyrics. Style belongs in `tags`.
    const replacementPrompt = sectionLyrics || normalizeSunoLyrics(prompt || "") || "Replace the selected section";
    const effectiveTags = tags || track.tags || "";

    // Get track lyrics - REQUIRED for replace-section API
    const trackLyrics = requestFullLyrics || track.lyrics || "";

    // Validate lyrics exist for non-instrumental tracks
    if (!track.is_instrumental && (!trackLyrics || trackLyrics.trim().length < 10)) {
      logger.warn("Track has no lyrics for replace-section", { trackId, lyricsLength: trackLyrics.length });
      return new Response(
        JSON.stringify({
          error: "Трек не содержит текста. Для замены секции нужны оригинальные lyrics.",
          code: "MISSING_LYRICS",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    logger.info("Preparing Suno payload", {
      hasPrompt: !!prompt,
      hasTags: !!tags,
      hasTrackLyrics: !!trackLyrics,
      lyricsLength: trackLyrics.length,
      sectionLyricsLength: sectionLyrics.length,
      isInstrumental: track.is_instrumental,
      replacementPromptLength: replacementPrompt.length,
      effectiveTags: effectiveTags.substring(0, 100),
    });

    // Suno replace-section payload - fullLyrics REQUIRED per API
    const sunoPayload: Record<string, unknown> = {
      taskId,
      audioId,
      prompt: replacementPrompt,
      tags: effectiveTags,
      title: track.title || "Трек",
      infillStartS: Number(infillStartS),
      infillEndS: Number(infillEndS),
      callBackUrl: callbackUrl,
    };

    // Add fullLyrics for non-instrumental tracks
    if (!track.is_instrumental && trackLyrics) {
      sunoPayload.fullLyrics = trackLyrics;
    }

    logger.info("Calling Suno API", {
      taskId,
      audioId,
      infillStartS,
      infillEndS,
      promptLength: replacementPrompt.length,
      tagsLength: effectiveTags.length,
    });

    // Call Suno API with 15-second timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let sunoResponse: Response;
    try {
      sunoResponse = await fetch(SUNO_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sunoApiKey}`,
        },
        body: JSON.stringify(sunoPayload),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeout);
      const isTimeout = fetchErr instanceof DOMException && fetchErr.name === "AbortError";
      logger.error(isTimeout ? "Suno API request timed out" : "Suno API request failed", fetchErr);
      return new Response(
        JSON.stringify({
          error: isTimeout ? "Suno API timeout (15s)" : "Failed to reach Suno API",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    clearTimeout(timeout);

    const sunoData = await sunoResponse.json();

    if (!sunoResponse.ok || !isSunoSuccessCode(sunoData.code)) {
      logger.error("Suno API error", null, {
        status: sunoResponse.status,
        data: sunoData,
      });
      return new Response(
        JSON.stringify({
          error: sunoData.msg || "Failed to start section replacement",
          sunoError: sunoData,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const newTaskId = sunoData.data?.taskId;
    if (!newTaskId) {
      logger.error("No taskId in response", null, { data: sunoData });
      return new Response(JSON.stringify({ error: "No task ID returned from Suno" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create generation task record
    const { data: task, error: taskError } = await supabase
      .from("generation_tasks")
      .insert({
        user_id: user.id,
        track_id: trackId,
        prompt: sectionLyrics || prompt || `Замена секции ${infillStartS}s - ${infillEndS}s`,
        status: "pending",
        suno_task_id: newTaskId,
        generation_mode: "replace_section",
        model_used: track.model_name || "chirp-v4",
        telegram_chat_id: profile?.telegram_id,
        expected_clips: 2,
      })
      .select()
      .single();

    if (taskError) {
      logger.error("Failed to create task", taskError);
      return new Response(JSON.stringify({ error: "Failed to create generation task" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log the change
    await supabase.from("track_change_log").insert({
      track_id: trackId,
      user_id: user.id,
      change_type: "replace_section_started",
      changed_by: "user",
      prompt_used: prompt,
      metadata: {
        infillStartS,
        infillEndS,
        taskId: newTaskId,
        originalAudioId: audioId,
        sectionLyrics,
        stylePrompt: prompt,
      },
    });

    // Deduct credits after successful task creation
    const { error: deductError } = await supabase.rpc("deduct_credits", {
      p_user_id: user.id,
      p_amount: REPLACE_SECTION_COST,
      p_action_type: "replace_section",
      p_description: `Замена секции ${infillStartS}s - ${infillEndS}s`,
      p_metadata: { track_id: trackId, task_id: task.id, suno_task_id: newTaskId },
    });

    if (deductError) {
      logger.warn("Failed to deduct credits via RPC, using direct insert", { error: deductError });
    }

    // Log credit transaction
    await supabase.from("credit_transactions").insert({
      user_id: user.id,
      amount: -REPLACE_SECTION_COST,
      transaction_type: "debit",
      action_type: "replace_section",
      description: `Замена секции ${infillStartS}s - ${infillEndS}s`,
      metadata: { track_id: trackId, task_id: task.id, suno_task_id: newTaskId },
    });

    logger.success("Replace section task created", {
      taskId: task.id,
      sunoTaskId: newTaskId,
      creditsSpent: REPLACE_SECTION_COST,
    });

    return new Response(
      JSON.stringify({
        success: true,
        taskId: task.id,
        sunoTaskId: newTaskId,
        message: "Section replacement started",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    logger.error("Replace section error", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
