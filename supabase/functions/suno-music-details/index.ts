import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createLogger } from "../_shared/logger.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { fetchSunoTaskDetails } from "../_shared/suno-details.ts";

const logger = createLogger("suno-music-details");

/**
 * Sprint 054-A1: Status polling for Suno `/api/v1/generate/details` (music generation).
 *
 * Delegates to the shared suno-details dispatcher (Sprint 054-A7) which centralizes
 * the Suno details-endpoint pattern across all 7 task types.
 *
 * Request:  { taskId: string }
 * Response: { success, taskId, status, clips?: [], error? }
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

    logger.info("Suno music details request", { taskId });

    const result = await fetchSunoTaskDetails("music", taskId);

    const data = result.data as { clips?: unknown[] };
    return new Response(
      JSON.stringify({
        success: true,
        taskId: result.taskId,
        status: result.status,
        clips: data.clips ?? null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error: unknown) {
    logger.error("suno-music-details failed", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
