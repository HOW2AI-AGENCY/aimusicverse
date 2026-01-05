import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Replicate from "https://esm.sh/replicate@0.25.2";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

interface WatermarkRequest {
  audioUrl: string;
  trackId?: string;
  mode: 'apply' | 'detect';
  callbackUrl?: string;
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      audioUrl,
      trackId,
      mode,
      callbackUrl,
    }: WatermarkRequest = await req.json();

    if (!audioUrl) {
      return new Response(
        JSON.stringify({ error: "audioUrl is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!mode || !['apply', 'detect'].includes(mode)) {
      return new Response(
        JSON.stringify({ error: "mode must be 'apply' or 'detect'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[audio-watermark] Starting ${mode} for: ${audioUrl}`);

    // Update track status if trackId provided
    if (trackId && mode === 'apply') {
      await supabase
        .from("tracks")
        .update({ watermark_status: "processing" })
        .eq("id", trackId);
    }

    // Call Resemble AI Watermark model
    const startTime = Date.now();
    const output = await replicate.run(
      "resemble-ai/watermark:93bf4f8d5e9e1c0fe2a8b6cf7aeefc74b36ab455c0dd6ff4e8b967f1b20ff2a8",
      {
        input: {
          content: audioUrl,
          mode: mode === 'apply' ? 'Apply a Watermark to file' : 'Detect if the file has a watermark',
          ...(callbackUrl && { callback_url: callbackUrl }),
        },
      }
    );

    const processingTime = Date.now() - startTime;
    console.log(`[audio-watermark] Completed in ${processingTime}ms`);
    console.log(`[audio-watermark] Output:`, output);

    // Handle different output formats
    let watermarkedUrl: string | null = null;
    let hasWatermark: boolean | null = null;
    let storedUrl: string | null = null;

    if (typeof output === 'object' && output !== null) {
      const result = output as { watermarked_content?: string; has_watermark?: Record<string, boolean> };
      
      if (mode === 'apply' && result.watermarked_content) {
        watermarkedUrl = result.watermarked_content;
      }
      
      if (mode === 'detect' && result.has_watermark) {
        // has_watermark is an object with boolean values
        hasWatermark = Object.values(result.has_watermark).some(v => v === true);
      }
    } else if (typeof output === 'string') {
      if (mode === 'apply') {
        watermarkedUrl = output;
      }
    }

    // Upload watermarked audio to Supabase storage
    if (mode === 'apply' && watermarkedUrl) {
      try {
        const audioResponse = await fetch(watermarkedUrl);
        if (audioResponse.ok) {
          const audioBlob = await audioResponse.blob();
          const timestamp = Date.now();
          const fileName = `audio-watermarked/${trackId || "audio"}-${timestamp}-watermarked.wav`;

          const { error: uploadError } = await supabase.storage
            .from("project-assets")
            .upload(fileName, audioBlob, {
              contentType: "audio/wav",
              cacheControl: "31536000",
            });

          if (uploadError) {
            console.error("[audio-watermark] Upload error:", uploadError);
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from("project-assets")
              .getPublicUrl(fileName);
            storedUrl = publicUrl;
            console.log(`[audio-watermark] Uploaded to: ${storedUrl}`);
          }
        }
      } catch (e) {
        console.error("[audio-watermark] Failed to upload:", e);
      }

      // Update track with watermark info
      if (trackId) {
        const { error: updateError } = await supabase
          .from("tracks")
          .update({
            watermarked_url: storedUrl || watermarkedUrl,
            is_watermarked: true,
            watermarked_at: new Date().toISOString(),
            watermark_status: "completed",
          })
          .eq("id", trackId);

        if (updateError) {
          console.error("[audio-watermark] Track update error:", updateError);
        }
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
        endpoint: "audio-watermark",
        method: "POST",
        response_status: 200,
        duration_ms: processingTime,
        request_body: { audioUrl, trackId, mode },
        response_body: { watermarkedUrl: storedUrl || watermarkedUrl, hasWatermark },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        mode,
        watermarkedUrl: storedUrl || watermarkedUrl,
        storedUrl,
        hasWatermark,
        trackId,
        processingTimeMs: processingTime,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[audio-watermark] Error:", error);

    // Update track status on error
    const body = await req.clone().json().catch(() => ({}));
    if (body.trackId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase
        .from("tracks")
        .update({ watermark_status: "failed" })
        .eq("id", body.trackId);
    }

    const errorMessage = error instanceof Error ? error.message : "Watermark operation failed";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
