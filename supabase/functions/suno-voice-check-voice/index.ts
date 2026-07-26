import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient, getAuthUser, sunoFetch, toVoiceError } from "../_shared/voice.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const user = await getAuthUser(req);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { voiceId } = await req.json();
    if (!voiceId) return json({ error: "voiceId required" }, 400);

    const supabase = getServiceClient();
    const { data: row } = await supabase
      .from("custom_voices")
      .select("id, user_id, generate_task_id, validate_task_id")
      .eq("voice_id", voiceId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!row) return json({ error: "Voice not found" }, 404);

    // Suno's /check-voice requires the originating taskId alongside the voiceId.
    const taskId = (row as any).generate_task_id || (row as any).validate_task_id;
    if (!taskId) {
      // Nothing to ask Suno about — trust local state instead of blocking generation.
      return json({ success: true, available: true, skipped: "no_task_id" });
    }

    const res = await sunoFetch("/check-voice", {
      method: "POST",
      body: JSON.stringify({ voiceId, taskId }),
    });
    const data = res?.data || res;
    const available = data?.available ?? data?.isAvailable ?? res?.code === 200;

    await supabase
      .from("custom_voices")
      .update({
        is_available: !!available,
        last_polled_at: new Date().toISOString(),
      } as any)
      .eq("id", row.id);

    return json({ success: true, available: !!available, data });
  } catch (e) {
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
