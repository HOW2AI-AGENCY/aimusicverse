import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createLogger } from "../_shared/logger.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { fetchSunoTaskDetails } from "../_shared/suno-details.ts";

const logger = createLogger("suno-lyrics-details");

/**
 * Sprint 054-A5: Status polling for Suno `/api/v1/lyrics/details` (lyrics generation).
 *
 * Delegates to the shared suno-details dispatcher (Sprint 054-A7) which centralizes
 * the Suno details-endpoint pattern across all 7 task types.
 *
 * Request:  { taskId: string }
 * Response: { success, taskId, status, text?, title?, error? }
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

    logger.info("Suno lyrics details request", { taskId });

    const result = await fetchSunoTaskDetails("lyrics", taskId);

    // Suno's lyrics/details response wraps the actual lyrics inside
    // `response.data[]` — each item has { text, title, status, errorMessage }.
    const data = result.data as {
      response?: { data?: Array<{ text?: string; title?: string; status?: string }> };
    };
    const firstItem = data.response?.data?.[0];
    return new Response(
      JSON.stringify({
        success: true,
        taskId: result.taskId,
        status: result.status,
        text: firstItem?.text ?? null,
        title: firstItem?.title ?? null,
        itemStatus: firstItem?.status ?? null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error: unknown) {
    logger.error("suno-lyrics-details failed", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
