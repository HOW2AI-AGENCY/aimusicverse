import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { isSunoSuccessCode, verifySunoSignature, getSunoSignatureHeaders } from "../_shared/suno.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";

const logger = createLogger("suno-wav-callback");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient();

    // HIGH-2 FIX: verify Suno webhook signature before processing
    const rawBody = await req.text();
    const { signature, timestamp } = getSunoSignatureHeaders(req);
    if (!(await verifySunoSignature(rawBody, signature, timestamp))) {
      return new Response(JSON.stringify({ success: false, error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const payload = JSON.parse(rawBody);
    logger.info("Received WAV conversion callback from SunoAPI", { payload });

    const { code, msg, data } = payload;
    const { task_id, taskId, data: wavData } = data || {};
    const sunoTaskId = taskId || task_id;

    if (!sunoTaskId) {
      throw new Error("No taskId in callback");
    }

    if (!isSunoSuccessCode(code)) {
      logger.error("WAV conversion failed", undefined, { msg });
      return new Response(JSON.stringify({ success: true, status: "failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const wavInfo = wavData?.[0];
    if (!wavInfo?.wavUrl) {
      throw new Error("No WAV URL in callback data");
    }

    logger.info("WAV conversion completed", { wavUrl: wavInfo.wavUrl });

    // Download WAV file
    const wavResponse = await fetch(wavInfo.wavUrl);
    const wavBlob = await wavResponse.blob();
    const fileName = `wav/${sunoTaskId}_${Date.now()}.wav`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("project-assets")
      .upload(fileName, wavBlob, {
        contentType: "audio/wav",
        upsert: true,
      });

    if (uploadError) {
      logger.error("Upload error", uploadError);
      throw uploadError;
    }

    const { data: publicData } = supabase.storage.from("project-assets").getPublicUrl(fileName);

    const localWavUrl = publicData.publicUrl;

    logger.info("WAV file saved", { localWavUrl });

    // Look up actual user_id from the generation task associated with this Suno task
    let notificationUserId = wavInfo.userId;
    if (!notificationUserId) {
      const { data: taskRecord } = await supabase
        .from("generation_tasks")
        .select("user_id")
        .eq("suno_task_id", sunoTaskId)
        .single();
      notificationUserId = taskRecord?.user_id;
    }

    // Create notification (skip if no user found)
    if (!notificationUserId) {
      logger.warn("No user_id found for WAV callback, skipping notification", { sunoTaskId });
    } else {
      await supabase.from("notifications").insert({
        user_id: notificationUserId,
        type: "track_generated",
        title: "WAV конвертация завершена 🎵",
        message: "Ваш трек сконвертирован в высокое качество WAV",
        action_url: localWavUrl,
      });
    }

    return new Response(JSON.stringify({ success: true, wavUrl: localWavUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    logger.error("Error in suno-wav-callback", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
