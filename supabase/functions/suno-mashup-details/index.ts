/**
 * Suno mashup details — poll task status for mashup generation.
 *
 * Uses the same /api/v1/generate/details endpoint as music generation
 * since mashup tasks are tracked under the same generate task system.
 *
 * Request:  { taskId: string }
 * Response: { success, taskId, status, clips?: [], error? }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createLogger } from "../_shared/logger.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { isSunoSuccessCode } from "../_shared/suno.ts";

const logger = createLogger("suno-mashup-details");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sunoApiKey = Deno.env.get("SUNO_API_KEY");
    if (!sunoApiKey) {
      throw new Error("SUNO_API_KEY not configured");
    }

    const body = await req.json();
    const taskId: string | undefined = body?.taskId;

    if (!taskId) {
      throw new Error("taskId is required");
    }

    logger.info("Mashup details request", { taskId });

    const response = await fetch("https://api.sunoapi.org/api/v1/generate/details", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sunoApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ taskId }),
    });

    const json = await response.json();

    if (!response.ok || !isSunoSuccessCode(json.code)) {
      logger.warn("Mashup details request failed", {
        taskId,
        status: response.status,
        body: json,
      });
      throw new Error(json.msg || `Mashup details request failed (${response.status})`);
    }

    const data = json.data || {};
    const clips = (data as { clips?: unknown[] }).clips ?? null;

    return new Response(
      JSON.stringify({
        success: true,
        taskId,
        status: data.status ?? "PROCESSING",
        clips,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("suno-mashup-details failed", error);
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
