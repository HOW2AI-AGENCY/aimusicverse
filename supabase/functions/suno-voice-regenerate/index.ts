import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient, getAuthUser, sunoFetch, callbackUrl } from "../_shared/voice.ts";

/**
 * Suno Voice — Regenerate Verification Phrase.
 *
 * Per https://docs.sunoapi.org/suno-api/suno-voice-regenerate this endpoint asks
 * Suno for a NEW validation phrase for an existing validate task. It accepts only
 * `taskId` + `calBackUrl` (note the provider's typo'd field name) and returns the
 * phrase through the *validate* callback — it does NOT accept verification audio.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const user = await getAuthUser(req);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { voiceRowId } = await req.json();
    if (!voiceRowId) return json({ error: "voiceRowId required" }, 400);

    const supabase = getServiceClient();
    const { data: row } = await supabase
      .from("custom_voices")
      .select("*")
      .eq("id", voiceRowId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!row) return json({ error: "Voice not found" }, 404);
    if (!row.validate_task_id) return json({ error: "No validate_task_id" }, 400);

    const sunoRes = await sunoFetch("/regenerate", {
      method: "POST",
      body: JSON.stringify({
        taskId: row.validate_task_id,
        // Provider schema field is `calBackUrl` (sic) for this endpoint only.
        calBackUrl: callbackUrl("suno-voice-validate-callback"),
      }),
    });
    const taskId = sunoRes?.data?.taskId || sunoRes?.taskId || row.validate_task_id;

    await supabase
      .from("custom_voices")
      .update({
        validate_task_id: taskId,
        validate_phrase: null,
        phrase_expires_at: null,
        status: "validating",
        error_code: null,
        error_message: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      .eq("id", row.id);

    return json({ success: true, taskId });
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err: any = e;
    const status = err?.status || 500;
    const code = err?.code || "INTERNAL";
    return json({ success: false, error: err?.message || "Внутренняя ошибка", code }, status);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
