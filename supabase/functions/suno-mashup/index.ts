/**
 * suno-mashup — create a mashup by blending two audio files via Suno.
 *
 * Body:
 *   {
 *     trackAId: string,         // uuid of existing track (resolves to audio_url)
 *     trackBId: string,         // uuid of existing track
 *     customMode: boolean,
 *     instrumental?: boolean,
 *     prompt?: string,          // required if !instrumental; ≤ 3000/5000 by model
 *     style?: string,           // required if customMode; ≤ 200/1000 by model
 *     title?: string,           // required if customMode; ≤ 80/100 by model
 *     model?: string,           // V4 | V4_5 | V4_5PLUS | V4_5ALL | V5
 *     vocalGender?: "m" | "f",
 *     styleWeight?: number,     // 0..1
 *     weirdnessConstraint?: number,
 *     audioWeight?: number,     // 0..1
 *     projectId?: string,
 *     studioProjectId?: string,
 *     openInStudio?: boolean,
 *   }
 *
 * Resolves both track IDs to their audio URLs from Supabase Storage, calls
 * /api/v1/generate/mashup, persists a `tracks` row + `generation_tasks` row
 * with `generation_mode = 'mashup'`, and returns the new task IDs.
 *
 * The Suno callback URL is the existing suno-music-callback — the mashup
 * response shape is identical to a normal generation result, so the existing
 * callback path writes track_versions / track_clips without any extra wiring.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { createLogger } from "../_shared/logger.ts";
import { isSunoSuccessCode } from "../_shared/suno.ts";
import { getApiModelName } from "../_shared/suno-models.ts";
import { corsHeaders } from "../_shared/cors.ts";

const logger = createLogger("suno-mashup");

// Per-model character caps (mirrors Suno docs).
const LIMITS = {
  V4: { prompt: 3000, style: 200, title: 80 },
  V4_5: { prompt: 5000, style: 1000, title: 100 },
  V4_5PLUS: { prompt: 5000, style: 1000, title: 100 },
  V4_5ALL: { prompt: 5000, style: 1000, title: 80 },
  V5: { prompt: 5000, style: 1000, title: 100 },
} as const;

type SunoModelKey = keyof typeof LIMITS;

function limitFor(model: SunoModelKey) {
  return LIMITS[model] ?? LIMITS.V5;
}

interface MashupBody {
  trackAId: string;
  trackBId: string;
  customMode: boolean;
  instrumental?: boolean;
  prompt?: string;
  style?: string;
  title?: string;
  model?: string;
  vocalGender?: "m" | "f";
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
  projectId?: string;
  studioProjectId?: string;
  openInStudio?: boolean;
}

function bad(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sunoApiKey = Deno.env.get("SUNO_API_KEY");
    if (!sunoApiKey) {
      logger.error("SUNO_API_KEY not configured");
      return bad("API key not configured", 500);
    }

    const supabase = getSupabaseClient();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return bad("No authorization header", 401);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) return bad("Unauthorized", 401);

    const body: MashupBody = await req.json();

    // Required field validation (Suno: exactly 2 URLs, exactly 2 track IDs).
    if (!body.trackAId || !body.trackBId) {
      return bad("trackAId and trackBId are required");
    }
    if (body.trackAId === body.trackBId) {
      return bad("trackAId and trackBId must be different tracks");
    }
    if (typeof body.customMode !== "boolean") {
      return bad("customMode (boolean) is required");
    }

    const model = (body.model ?? "V5") as SunoModelKey;
    const limits = limitFor(model);
    const isInstrumental = body.instrumental ?? false;

    if (body.customMode) {
      if (!body.title) return bad("title is required in customMode");
      if (body.title.length > limits.title) {
        return bad(`title exceeds ${limits.title} chars for ${model}`);
      }
      if (!body.style) return bad("style is required in customMode");
      if (body.style.length > limits.style) {
        return bad(`style exceeds ${limits.style} chars for ${model}`);
      }
      if (!isInstrumental && !body.prompt) {
        return bad("prompt is required when instrumental=false in customMode");
      }
    } else {
      if (!body.prompt) {
        return bad("prompt is required in non-custom mode");
      }
      if (body.prompt.length > 500) {
        return bad("prompt exceeds 500 chars in non-custom mode");
      }
    }
    if (body.prompt && body.prompt.length > limits.prompt) {
      return bad(`prompt exceeds ${limits.prompt} chars for ${model}`);
    }

    // Resolve both tracks to their primary/active version audio URL.
    const { data: tracks, error: tracksError } = await supabase
      .from("tracks")
      .select("id, user_id, title, status, active_version_id, track_versions(id, audio_url, is_primary, status)")
      .in("id", [body.trackAId, body.trackBId]);

    if (tracksError) {
      logger.error("Failed to load mashup source tracks", tracksError);
      return bad("Failed to load source tracks", 500);
    }
    if (!tracks || tracks.length !== 2) {
      return bad("One or both source tracks not found", 404);
    }

    const trackMap = new Map(tracks.map((t) => [t.id as string, t]));
    const trackA = trackMap.get(body.trackAId);
    const trackB = trackMap.get(body.trackBId);

    if (trackA?.user_id !== user.id || trackB?.user_id !== user.id) {
      // Don't disclose existence; user-facing message stays neutral.
      return bad("Both source tracks must belong to the caller", 403);
    }

    const pickAudioUrl = (track: (typeof tracks)[number]): string | null => {
      const versions = (track.track_versions ?? []) as Array<{
        id: string;
        audio_url: string | null;
        is_primary: boolean | null;
        status: string | null;
      }>;
      // Prefer the active version, then primary, then first ready.
      const active = track.active_version_id ? versions.find((v) => v.id === track.active_version_id) : null;
      const primary = versions.find((v) => v.is_primary);
      const ready = versions.find((v) => v.status === "ready" && v.audio_url);
      const chosen = active ?? primary ?? ready;
      return chosen?.audio_url ?? null;
    };

    const audioUrlA = pickAudioUrl(trackA);
    const audioUrlB = pickAudioUrl(trackB);

    if (!audioUrlA || !audioUrlB) {
      return bad("Source tracks must have at least one ready version with audio_url");
    }

    const apiModel = getApiModelName(model);
    const callBackUrl = `${supabaseUrl}/functions/v1/suno-music-callback`;

    const sunoPayload: Record<string, unknown> = {
      uploadUrlList: [audioUrlA, audioUrlB],
      customMode: body.customMode,
      model: apiModel,
      callBackUrl,
    };

    if (body.customMode) {
      sunoPayload.style = body.style;
      sunoPayload.title = body.title;
      if (isInstrumental) {
        sunoPayload.instrumental = true;
      } else if (body.prompt) {
        sunoPayload.prompt = body.prompt;
      }
    } else {
      sunoPayload.prompt = body.prompt;
    }
    if (body.vocalGender === "m" || body.vocalGender === "f") {
      sunoPayload.vocalGender = body.vocalGender;
    }
    if (body.styleWeight !== undefined) {
      sunoPayload.styleWeight = body.styleWeight;
    }
    if (body.weirdnessConstraint !== undefined) {
      sunoPayload.weirdnessConstraint = body.weirdnessConstraint;
    }
    if (body.audioWeight !== undefined) {
      sunoPayload.audioWeight = body.audioWeight;
    }

    logger.info("Suno mashup payload prepared", {
      model: apiModel,
      customMode: body.customMode,
      instrumental: isInstrumental,
      userId: user.id,
    });
    logger.apiCall("suno", "/api/v1/generate/mashup", {
      model: apiModel,
      customMode: body.customMode,
    });

    const sunoResponse = await fetch("https://api.sunoapi.org/api/v1/generate/mashup", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sunoApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sunoPayload),
      signal: AbortSignal.timeout(30000),
    });

    const sunoData = await sunoResponse.json();

    if (!sunoResponse.ok || !isSunoSuccessCode(sunoData.code)) {
      logger.error("Suno mashup error", null, { sunoData });
      return new Response(
        JSON.stringify({
          error: sunoData.msg || "Failed to start mashup",
          code: sunoData.code,
          details: sunoData,
        }),
        {
          status: sunoResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const sunoTaskId: string | undefined = sunoData.data?.taskId;
    if (!sunoTaskId) {
      logger.error("No taskId in Suno mashup response", null, { sunoData });
      throw new Error("No taskId in Suno mashup response");
    }

    // Persist a tracks row + generation_tasks row. The mashup title is
    // user-supplied; prompt is what was sent to Suno. We don't reuse either
    // source track's title to avoid confusion in the library.
    const defaultTitle = `Mashup: ${trackA.title ?? "A"} + ${trackB.title ?? "B"}`;

    const { data: newTrack, error: newTrackError } = await supabase
      .from("tracks")
      .insert({
        user_id: user.id,
        project_id: body.projectId ?? null,
        prompt: body.prompt ?? null,
        title: body.title ?? defaultTitle,
        style: body.style ?? null,
        status: "pending",
        provider: "suno",
        suno_model: apiModel,
        suno_task_id: sunoTaskId,
        generation_mode: "mashup",
        has_vocals: !isInstrumental,
      })
      .select()
      .single();

    if (newTrackError || !newTrack) {
      logger.error("Track creation error (mashup)", newTrackError);
      throw new Error("Failed to create mashup track");
    }

    const audioClips = {
      studio_project_id: body.studioProjectId ?? null,
      open_in_studio: body.openInStudio ?? false,
      source_track_ids: [body.trackAId, body.trackBId],
      settings: {
        vocalGender: body.vocalGender ?? null,
        styleWeight: body.styleWeight ?? null,
        weirdnessConstraint: body.weirdnessConstraint ?? null,
        audioWeight: body.audioWeight ?? null,
      },
    };

    const { data: generationTask, error: taskError } = await supabase
      .from("generation_tasks")
      .insert({
        user_id: user.id,
        track_id: newTrack.id,
        prompt: body.prompt ?? body.title ?? "Mashup",
        status: "pending",
        suno_task_id: sunoTaskId,
        model_used: apiModel,
        generation_mode: "mashup",
        audio_clips: JSON.stringify(audioClips),
      })
      .select("id")
      .single();

    if (taskError || !generationTask) {
      logger.error("Task creation error (mashup)", taskError);
      throw new Error("Failed to create mashup generation task");
    }

    logger.info("Mashup generation task created", {
      taskId: generationTask.id,
      sunoTaskId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        taskId: generationTask.id,
        sunoTaskId,
        trackId: newTrack.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    logger.error("Unhandled error in suno-mashup", error);
    return bad(message, 500);
  }
});
