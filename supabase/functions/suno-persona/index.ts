/**
 * suno-persona — create a Suno Persona from a single track.
 *
 * Body:
 *   {
 *     trackId: string,           // uuid of existing track (resolves to audio_url)
 *     name: string,              // user-facing name (e.g. "My Voice")
 *     description?: string,
 *     model?: string,            // optional model hint forwarded to Suno
 *   }
 *
 * Calls Suno /api/v1/generate/persona with the source track's audio_url.
 * Suno returns a personaId (the reusable handle) — we persist a
 * track_personas row in 'pending' state and rely on the dedicated callback
 * (suno-persona-callback) to flip it to 'ready' once Suno finalizes the
 * persona and returns any preview audio/image.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { createLogger } from "../_shared/logger.ts";
import { isSunoSuccessCode } from "../_shared/suno.ts";
import { corsHeaders } from "../_shared/cors.ts";

const logger = createLogger("suno-persona");

interface PersonaBody {
  trackId: string;
  name: string;
  description?: string;
  model?: string;
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

    const body: PersonaBody = await req.json();
    if (!body.trackId) return bad("trackId is required");
    if (!body.name || body.name.trim().length === 0) {
      return bad("name is required");
    }
    if (body.name.length > 80) {
      return bad("name exceeds 80 chars");
    }
    if (body.description && body.description.length > 500) {
      return bad("description exceeds 500 chars");
    }

    // Resolve the source track + its primary audio URL.
    const { data: track, error: trackError } = await supabase
      .from("tracks")
      .select("id, user_id, active_version_id, track_versions(id, audio_url, is_primary, status)")
      .eq("id", body.trackId)
      .maybeSingle();

    if (trackError) {
      logger.error("Failed to load persona source track", trackError);
      return bad("Failed to load source track", 500);
    }
    if (!track) return bad("Source track not found", 404);
    if (track.user_id !== user.id) {
      // Don't disclose existence.
      return bad("Source track must belong to the caller", 403);
    }

    const versions = (track.track_versions ?? []) as Array<{
      id: string;
      audio_url: string | null;
      is_primary: boolean | null;
      status: string | null;
    }>;
    const active = track.active_version_id ? versions.find((v) => v.id === track.active_version_id) : null;
    const primary = versions.find((v) => v.is_primary);
    const ready = versions.find((v) => v.status === "ready" && v.audio_url);
    const sourceUrl = (active ?? primary ?? ready)?.audio_url ?? null;

    if (!sourceUrl) {
      return bad("Source track must have at least one ready version with audio_url");
    }

    const callBackUrl = `${supabaseUrl}/functions/v1/suno-persona-callback`;

    const sunoPayload: Record<string, unknown> = {
      audioUrl: sourceUrl,
      name: body.name,
      callBackUrl,
    };
    if (body.description) sunoPayload.description = body.description;
    if (body.model) sunoPayload.model = body.model;

    logger.info("Suno persona payload prepared", {
      userId: user.id,
      sourceTrackId: body.trackId,
    });
    logger.apiCall("suno", "/api/v1/generate/persona", {
      trackId: body.trackId,
    });

    const sunoResponse = await fetch("https://api.sunoapi.org/api/v1/generate/persona", {
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
      logger.error("Suno persona error", null, { sunoData });
      return new Response(
        JSON.stringify({
          error: sunoData.msg || "Failed to create persona",
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
    // Some Suno responses return the personaId directly when synchronous;
    // either way we persist the task id so the callback can finalize it.
    const sunoPersonaId: string | undefined = sunoData.data?.personaId ?? sunoData.data?.id;

    if (!sunoTaskId && !sunoPersonaId) {
      logger.error("No taskId/personaId in Suno persona response", null, {
        sunoData,
      });
      throw new Error("No taskId or personaId in Suno persona response");
    }

    // Persist persona in pending state (with a placeholder suno_persona_id
    // if Suno didn't return one synchronously — the callback will update it).
    const { data: persona, error: personaError } = await supabase
      .from("track_personas")
      .insert({
        user_id: user.id,
        // Real suno_persona_id arrives via callback; the unique index is
        // (user_id, suno_persona_id) so this placeholder must NOT collide.
        // We use the task id as a deterministic stand-in until the callback
        // fires — if Suno also returns a real personaId, the callback will
        // UPDATE both the id and the status atomically.
        suno_persona_id: sunoPersonaId ?? `pending:${sunoTaskId ?? crypto.randomUUID()}`,
        name: body.name,
        description: body.description ?? null,
        source_track_id: body.trackId,
        suno_task_id: sunoTaskId ?? null,
        status: sunoPersonaId ? "ready" : "pending",
      })
      .select()
      .single();

    if (personaError || !persona) {
      logger.error("Persona persistence error", personaError);
      throw new Error("Failed to persist persona");
    }

    logger.info("Persona created", {
      personaId: persona.id,
      sunoTaskId,
      sunoPersonaId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        personaId: persona.id,
        sunoTaskId,
        sunoPersonaId,
        status: persona.status,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    logger.error("Unhandled error in suno-persona", error);
    return bad(message, 500);
  }
});
