import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { createLogger } from "../_shared/logger.ts";
import { isSunoSuccessCode } from "../_shared/suno.ts";
import { corsHeaders } from "../_shared/cors.ts";

const logger = createLogger("suno-add-vocals");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sunoApiKey = Deno.env.get("SUNO_API_KEY");

    if (!sunoApiKey) {
      logger.error("SUNO_API_KEY not configured");
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = getSupabaseClient();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      audioFile,
      audioUrl,
      prompt,
      customMode = false,
      style,
      title,
      negativeTags,
      personaId,
      model = "V4_5PLUS",
      vocalGender,
      styleWeight,
      weirdnessConstraint,
      audioWeight,
      projectId,
    } = await req.json();

    if (!audioFile && !audioUrl) {
      return new Response(JSON.stringify({ error: "Audio file or URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate required parameters per SunoAPI docs
    if (!prompt) {
      return new Response(JSON.stringify({ error: "prompt is required for add-vocals" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!title) {
      return new Response(JSON.stringify({ error: "title is required for add-vocals" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!style) {
      return new Response(JSON.stringify({ error: "style is required for add-vocals" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logger.info("Adding vocals to instrumental", {
      customMode,
      model,
      userId: user.id,
      hasFile: !!audioFile,
      hasUrl: !!audioUrl,
    });

    let uploadUrl: string;

    if (audioUrl) {
      // Use existing URL directly
      uploadUrl = audioUrl;
      logger.info("Using existing audio URL", { uploadUrl });
    } else {
      // Upload audio to Supabase Storage
      const fileName = `${user.id}/uploads/${Date.now()}-${audioFile.name || "audio.mp3"}`;

      // Decode base64 if needed
      let audioBuffer: Uint8Array;
      try {
        if (audioFile.data.startsWith("data:")) {
          const base64Data = audioFile.data.split(",")[1];
          audioBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        } else {
          audioBuffer = new Uint8Array(audioFile.data);
        }
        logger.info("Audio buffer created", { bytes: audioBuffer.length });
      } catch (error) {
        logger.error("Failed to decode audio file", error);
        throw new Error("Invalid audio file format");
      }

      const { error: uploadError } = await supabase.storage
        .from("project-assets")
        .upload(fileName, audioBuffer, {
          contentType: audioFile.type || "audio/mpeg",
          upsert: false,
        });

      if (uploadError) {
        logger.error("Upload error", uploadError);
        return new Response(JSON.stringify({ error: `Failed to upload audio: ${uploadError.message}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage.from("project-assets").getPublicUrl(fileName);

      uploadUrl = publicUrlData.publicUrl;
      logger.info("Audio uploaded", { uploadUrl });
    }
    const callBackUrl = `${supabaseUrl}/functions/v1/suno-music-callback`;

    logger.info("Calling Suno API add-vocals", { uploadUrl, callBackUrl });

    // Build request body - per SunoAPI docs
    // Required: uploadUrl, prompt, title, style, negativeTags, callBackUrl
    // Optional: vocalGender, styleWeight, audioWeight, weirdnessConstraint, model

    // Set reasonable defaults for weights if not provided
    const effectiveAudioWeight = audioWeight !== undefined ? audioWeight : 0.7;
    const effectiveStyleWeight = styleWeight !== undefined ? styleWeight : 0.6;
    const effectiveWeirdness = weirdnessConstraint !== undefined ? weirdnessConstraint : 0.3;

    const requestBody: Record<string, unknown> = {
      uploadUrl,
      prompt, // Required - lyrics or vocal description
      title, // Required
      style, // Required
      tags: style, // Keep tags in sync with style for compatibility
      negativeTags:
        typeof negativeTags === "string" && negativeTags.trim().length > 0
          ? negativeTags
          : "low quality, distorted, noise, instrumental only",
      callBackUrl,
      model: model === "V4_5ALL" ? "V4_5PLUS" : model,
      // Weights control audio adherence vs style creativity
      audioWeight: effectiveAudioWeight,
      styleWeight: effectiveStyleWeight,
      weirdnessConstraint: effectiveWeirdness,
    };

    // Optional parameters
    if (vocalGender && (vocalGender === "m" || vocalGender === "f")) {
      requestBody.vocalGender = vocalGender;
    }

    logger.info("Suno add-vocals payload", {
      requestBody,
      audioWeight: effectiveAudioWeight,
      styleWeight: effectiveStyleWeight,
      weirdness: effectiveWeirdness,
    });

    // Call Suno API
    const sunoResponse = await fetch("https://api.sunoapi.org/api/v1/generate/add-vocals", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sunoApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const sunoData = await sunoResponse.json();

    if (!sunoResponse.ok || !isSunoSuccessCode(sunoData.code)) {
      logger.error("Suno API error", null, { sunoData });
      return new Response(
        JSON.stringify({
          error: sunoData.msg || "Failed to add vocals",
          code: sunoData.code,
          details: sunoData,
        }),
        { status: sunoResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const sunoTaskId = sunoData.data?.taskId;

    if (!sunoTaskId) {
      logger.error("No taskId in Suno response", null, { sunoData });
      throw new Error("No taskId in Suno response");
    }

    logger.info("✅ Suno add-vocals task created:", sunoTaskId);

    // Create track record
    const { data: track, error: trackError } = await supabase
      .from("tracks")
      .insert({
        user_id: user.id,
        project_id: projectId,
        prompt: prompt || "Add vocals",
        title: title || null,
        style: style || null,
        status: "pending",
        provider: "suno",
        suno_model: model,
        suno_task_id: sunoTaskId,
        generation_mode: "add_vocals",
        has_vocals: true,
      })
      .select()
      .single();

    if (trackError) {
      logger.error("Track creation error:", trackError);
      throw trackError;
    }

    // Create generation task
    const { data: generationTask, error: taskError } = await supabase
      .from("generation_tasks")
      .insert({
        user_id: user.id,
        track_id: track.id,
        prompt: prompt || "Add vocals",
        status: "pending",
        suno_task_id: sunoTaskId,
        model_used: model,
        generation_mode: "add_vocals",
      })
      .select("id")
      .single();

    if (taskError) {
      logger.error("Task creation error:", taskError);
      throw taskError;
    }

    logger.info("✅ Generation task created:", generationTask?.id);

    return new Response(
      JSON.stringify({
        success: true,
        taskId: generationTask?.id, // Return generation_tasks.id for frontend tracking
        sunoTaskId: sunoTaskId, // Also include Suno's task ID
        trackId: track.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    logger.error("Error in suno-add-vocals:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
