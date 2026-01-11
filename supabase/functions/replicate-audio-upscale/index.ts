import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Replicate from "https://esm.sh/replicate@0.25.2";
import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";

interface UpscaleRequest {
  audioUrl: string;
  trackId?: string;
  ddimSteps?: number;
  guidanceScale?: number;
  truncatedBatches?: boolean;
  seed?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    if (!REPLICATE_API_KEY) {
      throw new Error("REPLICATE_API_KEY is not configured");
    }

    const replicate = new Replicate({ auth: REPLICATE_API_KEY });
    const supabase = getSupabaseClient();

    const {
      audioUrl,
      trackId,
      ddimSteps = 50,
      guidanceScale = 3.5,
      truncatedBatches = true,
      seed,
    }: UpscaleRequest = await req.json();

    if (!audioUrl) {
      return new Response(
        JSON.stringify({ error: "audioUrl is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[audio-upscale] Starting upscale for: ${audioUrl}`);
    console.log(`[audio-upscale] Settings: ddim=${ddimSteps}, guidance=${guidanceScale}, truncated=${truncatedBatches}`);

    // Update track status if trackId provided
    if (trackId) {
      await supabase
        .from("tracks")
        .update({ upscale_status: "processing" })
        .eq("id", trackId);
    }

    // Call AudioSR model
    const startTime = Date.now();
    const output = await replicate.run(
      "sakemin/audiosr-long-audio:4b4f8b87d0df3e61f21e0de2e4ab06c8e0b76b4a40bd6de6c9f49020bca33d2e",
      {
        input: {
          input_file: audioUrl,
          truncated_batches: truncatedBatches,
          ddim_steps: ddimSteps,
          guidance_scale: guidanceScale,
          ...(seed !== undefined && { seed }),
        },
      }
    );

    const processingTime = Date.now() - startTime;
    console.log(`[audio-upscale] Completed in ${processingTime}ms`);
    console.log(`[audio-upscale] Output: ${output}`);

    if (!output || typeof output !== "string") {
      throw new Error("No output received from AudioSR model");
    }

    const upscaledUrl = output as string;

    // Upload to Supabase storage
    let storedUrl: string | null = null;
    try {
      const audioResponse = await fetch(upscaledUrl);
      if (audioResponse.ok) {
        const audioBlob = await audioResponse.blob();
        const timestamp = Date.now();
        const fileName = `audio-upscaled/${trackId || "audio"}-${timestamp}-48khz.wav`;

        const { error: uploadError } = await supabase.storage
          .from("project-assets")
          .upload(fileName, audioBlob, {
            contentType: "audio/wav",
            cacheControl: "31536000",
          });

        if (uploadError) {
          console.error("[audio-upscale] Upload error:", uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from("project-assets")
            .getPublicUrl(fileName);
          storedUrl = publicUrl;
          console.log(`[audio-upscale] Uploaded to: ${storedUrl}`);
        }
      }
    } catch (e) {
      console.error("[audio-upscale] Failed to upload:", e);
    }

    // Update track with HD audio URL
    if (trackId) {
      const { error: updateError } = await supabase
        .from("tracks")
        .update({
          audio_url_hd: storedUrl || upscaledUrl,
          audio_quality: "hd",
          upscale_status: "completed",
        })
        .eq("id", trackId);

      if (updateError) {
        console.error("[audio-upscale] Track update error:", updateError);
      }
    }

    // Log the operation
    const authHeader = req.headers.get("Authorization");
    let userId = null;
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = user?.id;
    }

    if (userId) {
      await supabase.from("api_usage_logs").insert({
        user_id: userId,
        service: "replicate",
        endpoint: "audio-upscale",
        method: "POST",
        response_status: 200,
        duration_ms: processingTime,
        request_body: { audioUrl, trackId, ddimSteps, guidanceScale },
        response_body: { upscaledUrl: storedUrl || upscaledUrl },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        upscaledUrl: storedUrl || upscaledUrl,
        originalUrl: audioUrl,
        storedUrl,
        trackId,
        processingTimeMs: processingTime,
        quality: "48kHz",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[audio-upscale] Error:", error);

    // Update track status on error
    const body = await req.clone().json().catch(() => ({}));
    if (body.trackId) {
      const supabase = getSupabaseClient();
      await supabase
        .from("tracks")
        .update({ upscale_status: "failed" })
        .eq("id", body.trackId);
    }

    const errorMessage = error instanceof Error ? error.message : "Upscale failed";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
