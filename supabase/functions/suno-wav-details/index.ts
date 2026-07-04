import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createLogger } from "../_shared/logger.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { fetchSunoTaskDetails } from "../_shared/suno-details.ts";

const logger = createLogger("suno-wav-details");

/**
 * Sprint 054-A4: Status polling for Suno `/api/v1/generate/wav/details` (WAV conversion).
 *
 * Delegates to the shared suno-details dispatcher (Sprint 054-A7) which centralizes
 * the Suno details-endpoint pattern across all 7 task types.
 *
 * Request:  { taskId: string }
 * Response: { success, taskId, status, wavUrl?, audioUrl?, error? }
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const taskId: string | undefined = body?.taskId;

    if (!taskId) {
      throw new Error("taskId is required");
    }

    logger.info("Suno WAV details request", { taskId });

    const result = await fetchSunoTaskDetails("wav", taskId);

    const data = result.data as { wavUrl?: string; audioUrl?: string };
    return new Response(
      JSON.stringify({
        success: true,
        taskId: result.taskId,
        status: result.status,
        wavUrl: data.wavUrl ?? null,
        audioUrl: data.audioUrl ?? null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error: unknown) {
    logger.error("suno-wav-details failed", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
