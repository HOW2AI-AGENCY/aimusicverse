/**
 * Suno music callback — lightweight router.
 * Delegates to handlers/ by callback type.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { createLogger } from "../_shared/logger.ts";
import { isSunoSuccessCode, verifySunoSignature, getSunoSignatureHeaders } from "../_shared/suno.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitHeaders, RateLimitConfigs } from "../_shared/rate-limiter.ts";
import { handleReplaceSection } from "./handlers/replace.ts";
import { handleFirstCallback } from "./handlers/first.ts";
import { handleCompleteCallback } from "./handlers/complete.ts";

const logger = createLogger("suno-music-callback");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ── Signature verification ──
    const rawBody = await req.text();
    const { signature, timestamp } = getSunoSignatureHeaders(req);
    if (!(await verifySunoSignature(rawBody, signature, timestamp))) {
      return new Response(JSON.stringify({ success: false, error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = getSupabaseClient();
    const payload = JSON.parse(rawBody);
    const { code, msg, data } = payload;
    const { callbackType, taskId, task_id } = data || {};
    const sunoTaskId = taskId || task_id;

    logger.info("Callback received", { code: payload.code, callbackType });

    if (!sunoTaskId) {
      return new Response(JSON.stringify({ success: false, error: "Missing taskId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Rate limit ──
    const rl = checkRateLimit(`callback:${sunoTaskId}`, RateLimitConfigs.sunoCallback);
    if (rl.isLimited) {
      return new Response(JSON.stringify({ success: false, error: "Rate limit exceeded" }), {
        status: 429,
        headers: {
          ...corsHeaders,
          ...getRateLimitHeaders(rl.limit, rl.remaining, rl.resetAt),
          "Content-Type": "application/json",
        },
      });
    }

    // ── Validate task ──
    const { data: task, error: taskError } = await supabase
      .from("generation_tasks")
      .select("*, tracks(*), telegram_message_id")
      .eq("suno_task_id", sunoTaskId)
      .single();

    if (taskError || !task) {
      return new Response(JSON.stringify({ success: false, error: "Invalid or unknown taskId" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (task.status === "completed" && callbackType === "complete") {
      return new Response(JSON.stringify({ success: true, status: "already_processed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const trackId = task.track_id;
    logger.info("Processing", { taskId: task.id, trackId, callbackType });

    // ── Failure handling ──
    if (!isSunoSuccessCode(code)) {
      return await handleFailure(supabase, task, msg, trackId, supabaseUrl, supabaseServiceKey);
    }

    // ── Route by generation_mode / callbackType ──
    if (task.generation_mode === "replace_section") {
      return await wrapResult(await handleReplaceSection(payload, task, supabaseUrl, supabaseServiceKey));
    }

    if (callbackType === "first") {
      return await wrapResult(await handleFirstCallback(payload, task));
    }

    if (callbackType === "complete") {
      return await wrapResult(await handleCompleteCallback(payload, task, supabaseUrl, supabaseServiceKey));
    }

    return new Response(JSON.stringify({ success: true, callbackType }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    logger.error("Callback processing error", error);

    // Revert project track to failed on any unhandled error
    if (trackId) {
      try {
        const supabase = getSupabaseClient();
        await supabase
          .from("project_tracks")
          .update({ status: "failed", error_message: error?.message?.substring(0, 200) || "Callback error" })
          .eq("track_id", trackId)
          .eq("status", "in_progress");
      } catch (_) {
        /* best-effort */
      }
    }

    return new Response(JSON.stringify({ success: false, error: error.message || "Unknown error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function wrapResult(result: any): Response {
  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: result.success ? 200 : 400,
  });
}

async function handleFailure(
  supabase: any,
  task: any,
  msg: string,
  trackId: string,
  supabaseUrl: string,
  supabaseServiceKey: string,
) {
  logger.error("SunoAPI generation failed", null, { msg });

  await supabase
    .from("generation_tasks")
    .update({
      status: "failed",
      error_message: msg || "Generation failed",
      callback_received_at: new Date().toISOString(),
    })
    .eq("id", task.id);

  await supabase
    .from("tracks")
    .update({ status: "failed", error_message: msg || "Generation failed" })
    .eq("id", trackId);

  if (task.telegram_chat_id) {
    try {
      await supabase.functions.invoke("send-telegram-notification", {
        body: task.telegram_message_id
          ? {
              type: "error_update",
              chatId: task.telegram_chat_id,
              messageId: task.telegram_message_id,
              error_message: msg || "Generation failed",
            }
          : {
              type: "failed",
              status: "failed",
              chatId: task.telegram_chat_id,
              trackId,
              error_message: msg || "Generation failed",
            },
      });
    } catch (e) {
      logger.error("Failure notification error", e);
    }
  }

  return new Response(JSON.stringify({ success: true, status: "failed" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
