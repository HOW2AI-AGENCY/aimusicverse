import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient, getAuthUser, sunoFetch, toVoiceError } from "../_shared/voice.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const user = await getAuthUser(req);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const url = new URL(req.url);
    const taskId = url.searchParams.get("taskId");
    if (!taskId) return json({ error: "taskId required" }, 400);

    const supabase = getServiceClient();
    const { data: row } = await supabase
      .from("custom_voices")
      .select("*")
      .eq("validate_task_id", taskId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!row) return json({ error: "Not found" }, 404);

    // If already have phrase, return it
    if (row.validate_phrase) {
      return json({ success: true, status: row.status, validateInfo: row.validate_phrase, voice: row });
    }

    const res = await sunoFetch(`/validate-info?taskId=${encodeURIComponent(taskId)}`, { method: "GET" });
    const data = res?.data || res;
    const validateInfo = data?.validateInfo || data?.phrase;
    const expiresAt = data?.expireAt || data?.phraseExpiresAt;

    const patch: Record<string, unknown> = { last_polled_at: new Date().toISOString() };
    if (validateInfo) {
      patch.validate_phrase = validateInfo;
      patch.status = "phrase_ready";
      if (expiresAt) patch.phrase_expires_at = new Date(expiresAt).toISOString();
    }
    if (data?.status === "FAILED" || data?.errorCode) {
      patch.status = "failed";
      patch.error_code = data.errorCode ?? null;
      patch.error_message = data.errorMessage ?? "Validation failed";
    }
    await supabase
      .from("custom_voices")
      .update(patch as any)
      .eq("id", row.id);

    return json({ success: true, status: patch.status ?? row.status, validateInfo, data });
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
