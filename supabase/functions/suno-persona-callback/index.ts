/**
 * suno-persona-callback — finalizes a track_personas row when Suno reports
 * the persona is ready (or failed).
 *
 * Suno payload (per docs):
 *   {
 *     code: 200,
 *     msg: "...",
 *     data: {
 *       task_id: "5c79****be8e",
 *       callbackType: "complete" | "first" | "text",
 *       data: {
 *         personaId: "persona_xxx",     // reusable handle for /generate calls
 *         audioUrl?: string,             // preview clip
 *         imageUrl?: string,             // avatar
 *       }
 *     }
 *   }
 *
 * On success: copy Suno's personaId onto track_personas.suno_persona_id,
 * store preview audio/image, and flip status to 'ready'.
 * On failure: flip status to 'failed'.
 *
 * Authorization: this endpoint is internal — only called by Suno via
 * SUPABASE_SERVICE_ROLE_KEY.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/logger.ts";
import { corsHeaders } from "../_shared/cors.ts";

const logger = createLogger("suno-persona-callback");

interface CallbackDataItem {
  personaId?: string;
  persona_id?: string;
  audioUrl?: string;
  audio_url?: string;
  imageUrl?: string;
  image_url?: string;
}

interface CallbackBody {
  code?: number;
  msg?: string;
  data?: {
    task_id?: string;
    taskId?: string;
    callbackType?: string;
    data?: CallbackDataItem | CallbackDataItem[];
  };
}

function ok(message = "ok") {
  return new Response(JSON.stringify({ message }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      logger.error("Supabase env vars missing");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const body: CallbackBody = await req.json();

    if (!body || typeof body !== "object") {
      logger.warn("Callback without body");
      return ok("ignored");
    }

    if (body.code !== undefined && body.code !== 200 && body.code !== 201) {
      // Suno reported a terminal failure — find any persona row by task id
      // and mark it failed (only meaningful for non-callback-type events).
      const taskId = body.data?.task_id ?? body.data?.taskId ?? undefined;
      if (taskId) {
        await supabase.from("track_personas").update({ status: "failed" }).eq("suno_task_id", taskId);
        logger.warn("Persona callback error code", {
          code: body.code,
          msg: body.msg,
          taskId,
        });
      }
      return ok("acknowledged");
    }

    const taskId = body.data?.task_id ?? body.data?.taskId;
    const callbackType = body.data?.callbackType;
    const raw = body.data?.data;
    if (!taskId) {
      logger.warn("Persona callback missing task_id", { body });
      return ok("ignored");
    }

    // 'first' / 'text' events don't carry the final personaId — wait for
    // 'complete'. Anything else (or absent) → treat as final.
    if (callbackType && callbackType !== "complete") {
      logger.info("Persona intermediate callback, waiting for complete", {
        taskId,
        callbackType,
      });
      return ok("awaiting complete");
    }

    // Suno's `data` may be a single object or an array — normalize.
    const items: CallbackDataItem[] = Array.isArray(raw)
      ? (raw as CallbackDataItem[])
      : raw
        ? [raw as CallbackDataItem]
        : [];
    const first = items[0] ?? {};
    const personaId = first.personaId ?? first.persona_id;
    const audioUrl = first.audioUrl ?? first.audio_url ?? null;
    const imageUrl = first.imageUrl ?? first.image_url ?? null;

    if (!personaId) {
      logger.warn("Persona callback complete without personaId", {
        taskId,
        raw,
      });
      // Still mark failed so the user sees the row in 'failed' state.
      await supabase.from("track_personas").update({ status: "failed" }).eq("suno_task_id", taskId);
      return ok("missing personaId");
    }

    const update: Record<string, unknown> = {
      suno_persona_id: personaId,
      status: "ready",
    };
    if (audioUrl) update.audio_url = audioUrl;
    if (imageUrl) update.image_url = imageUrl;

    const { error } = await supabase.from("track_personas").update(update).eq("suno_task_id", taskId);

    if (error) {
      logger.error("Persona callback persistence error", error, { taskId });
      return new Response(JSON.stringify({ error: "DB update failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logger.info("Persona finalized", { taskId, personaId, audioUrl, imageUrl });
    return ok("persona ready");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    logger.error("Unhandled error in suno-persona-callback", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
