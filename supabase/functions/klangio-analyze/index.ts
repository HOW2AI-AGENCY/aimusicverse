import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authorize } from "../_shared/auth.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { createLogger } from "../_shared/logger.ts";
import { corsHeaders } from "../_shared/cors.ts";
import type { KlangioRequest } from "./types.ts";
import { getSmartModel, getSmartOutputs } from "./models.ts";
import { buildRequest, attachAudio } from "./request-builder.ts";
import { pollJobStatus, getGeneratedFormats } from "./job-poller.ts";
import { handleTranscription, handleBeatTracking, handleChordRecognition } from "./response-handler.ts";

const logger = createLogger("klangio-analyze");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await authorize(req);
  if (!auth.ok)
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const KLANGIO_API_KEY = Deno.env.get("KLANGIO_API_KEY");
    if (!KLANGIO_API_KEY) throw new Error("KLANGIO_API_KEY not configured");

    const supabase = getSupabaseClient();
    const userId = auth.user?.id;
    const startTime = Date.now();
    let logId: string | null = null;

    const { audio_url, mode, model, outputs, vocabulary, title, stem_type } = (await req.json()) as KlangioRequest;
    if (!audio_url || !mode) throw new Error("audio_url and mode are required");

    const smartModel = getSmartModel(stem_type, model);
    const smartOutputs = getSmartOutputs(stem_type, outputs);

    // Create log entry
    const { data: logData } = await supabase
      .from("klangio_analysis_logs")
      .insert({
        user_id: userId || "00000000-0000-0000-0000-000000000000",
        mode,
        model: smartModel,
        status: "pending",
        audio_url,
        requested_outputs: mode === "transcription" ? smartOutputs : null,
        vocabulary: vocabulary || null,
        raw_request: { mode, model: smartModel, outputs, vocabulary, title, audio_url, stem_type },
      })
      .select("id")
      .single();
    logId = logData.id;

    // Build request
    const built = buildRequest(
      { audio_url, mode, model, outputs, vocabulary, title, stem_type },
      smartModel,
      smartOutputs,
    );
    if ("error" in built) throw new Error(built.error);

    // Attach audio
    const audioResult = await attachAudio(built.formData, audio_url);
    if (!audioResult.ok) throw new Error(audioResult.error);

    // Submit job
    const submitResp = await fetch(built.endpoint, {
      method: "POST",
      headers: { "kl-api-key": KLANGIO_API_KEY },
      body: built.formData,
    });

    if (!submitResp.ok) {
      const errText = await submitResp.text();
      if (logId) {
        await supabase
          .from("klangio_analysis_logs")
          .update({
            status: "failed",
            error_message: `API error ${submitResp.status}: ${errText}`,
            raw_response: { status: submitResp.status, body: errText },
            duration_ms: Date.now() - startTime,
            completed_at: new Date().toISOString(),
          })
          .eq("id", logId);
      }
      throw new Error(`Klangio API error: ${submitResp.status}`);
    }

    const jobResp = await submitResp.json();
    const jobId = jobResp.job_id;
    const generatedFormats = getGeneratedFormats(jobResp);

    if (logId) {
      await supabase
        .from("klangio_analysis_logs")
        .update({
          job_id: jobId,
          status: "processing",
          raw_response: jobResp,
        })
        .eq("id", logId);
    }

    // Poll job status
    const result = await pollJobStatus(KLANGIO_API_KEY, jobId, mode, logId, supabase, startTime);

    // Handle response based on mode
    switch (mode) {
      case "transcription":
        return await handleTranscription(supabase, jobId, KLANGIO_API_KEY, userId, logId, startTime, generatedFormats);
      case "beat-tracking":
        return await handleBeatTracking(supabase, jobId, KLANGIO_API_KEY, userId, logId, startTime, generatedFormats);
      case "chord-recognition":
      case "chord-recognition-extended":
        return await handleChordRecognition(
          supabase,
          jobId,
          KLANGIO_API_KEY,
          userId,
          logId,
          startTime,
          generatedFormats,
        );
      default:
        throw new Error(`Unknown mode: ${mode}`);
    }
  } catch (error) {
    logger.error("Error in klangio-analyze", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
