import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createLogger } from "../_shared/logger.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { fetchSunoTaskDetails } from "../_shared/suno-details.ts";

const logger = createLogger("suno-midi-details");

/**
 * Sprint 053-A4: Status polling for Suno `/api/v1/generate/midi/details`.
 *
 * Delegates to the shared suno-details dispatcher (Sprint 054-A7) which centralizes
 * the Suno details-endpoint pattern across music/cover/video/wav/midi/lyrics/separation.
 *
 * Request:  { taskId: string }
 * Response: { success, taskId, status, midiUrl?, error? }
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

    logger.info("Suno MIDI details request", { taskId });

    // fetchSunoTaskDetails reads SUNO_API_KEY from env internally.
    const result = await fetchSunoTaskDetails("midi", taskId);

    // Map `/api/v1/midi/record-info` payload to MIDI-specific UI fields.
    const data = result.data as {
      successFlag?: number;
      errorMessage?: string | null;
      midiData?: {
        state?: string;
        midiUrl?: string;
        duration?: number;
        instruments?: Array<{ notes?: unknown[] }>;
      };
    };

    const state = data.midiData?.state;
    const status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" =
      data.errorMessage || data.successFlag === 0
        ? "FAILED"
        : state === "complete"
          ? "SUCCESS"
          : state
            ? "PROCESSING"
            : (result.status ?? "PROCESSING");

    const notesCount =
      data.midiData?.instruments?.reduce((sum, inst) => sum + (inst.notes?.length ?? 0), 0) ?? null;

    return new Response(
      JSON.stringify({
        success: true,
        taskId: result.taskId,
        status,
        midiUrl: data.midiData?.midiUrl ?? null,
        notesCount,
        duration: data.midiData?.duration ?? null,
        error: data.errorMessage ?? undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error: unknown) {
    logger.error("suno-midi-details failed", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
