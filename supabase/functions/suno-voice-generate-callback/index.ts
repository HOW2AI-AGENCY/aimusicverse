import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/voice.ts";

const WEBHOOK_SECRET = Deno.env.get("SUNO_WEBHOOK_SECRET");
const VOICE_CLONE_COST = 30;

async function verifySignature(payload: string, signature: string | null, timestamp: string | null): Promise<boolean> {
  if (!WEBHOOK_SECRET) {
    console.error("[suno-voice-generate-callback] SUNO_WEBHOOK_SECRET not set, rejecting callback");
    return false;
  }
  if (!signature || !timestamp) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${payload}${timestamp}`));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex === signature;
}

// Public callback receiver — verify_jwt = false
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const rawBody = await req.text();
    const sig = req.headers.get("X-Suno-Signature") || req.headers.get("x-suno-signature");
    const ts = req.headers.get("X-Suno-Timestamp") || req.headers.get("x-suno-timestamp");
    if (!(await verifySignature(rawBody, sig, ts))) {
      return json({ error: "Invalid signature" }, 401);
    }

    const payload = JSON.parse(rawBody);
    const data = payload?.data || payload;
    const taskId = data?.taskId || data?.task_id;
    if (!taskId) return json({ error: "taskId missing" }, 400);

    const supabase = getServiceClient();
    const { data: row } = await supabase
      .from("custom_voices")
      .select("id, user_id, status, voice_id")
      .or(`generate_task_id.eq.${taskId},validate_task_id.eq.${taskId}`)
      .maybeSingle();
    if (!row) return json({ ok: true, ignored: true });

    // Idempotency: do not overwrite an already-ready voice
    if (row.status === "ready" && row.voice_id) {
      console.log(
        JSON.stringify({
          tag: "[suno-voice-generate-callback]",
          event: "idempotency_hit",
          reason: "already_ready",
          voiceRowId: row.id,
          taskId,
        }),
      );
      return json({ ok: true, ignored: "already_ready" });
    }

    const voiceId = data?.voiceId || data?.voice_id;
    const isFail = (payload?.code && payload.code >= 400) || data?.status === "FAILED" || data?.errorCode;

    const patch: Record<string, unknown> = { last_polled_at: new Date().toISOString() };
    if (isFail) {
      patch.status = "failed";
      patch.error_code = data?.errorCode ?? payload?.code ?? null;
      patch.error_message = data?.errorMessage ?? payload?.msg ?? "Generation failed";
    } else if (voiceId) {
      patch.voice_id = voiceId;
      patch.status = "ready";
      patch.is_available = true;
    }
    const { error: updErr } = await supabase
      .from("custom_voices")
      .update(patch as any)
      .eq("id", row.id);
    if (updErr) {
      console.error("[suno-voice-generate-callback] update failed", updErr.message);
      return json({ error: updErr.message }, 500);
    }

    // Refund the clone fee when the final generation fails (charged up-front in suno-voice-validate).
    if (patch.status === "failed" && row.status !== "failed") {
      const { error: refundErr } = await supabase.rpc("secure_credit_update", {
        _user_id: row.user_id,
        _amount: VOICE_CLONE_COST,
        _action_type: "voice_clone_refund",
        _description: `Voice generation failed: ${String(patch.error_message ?? "unknown")}`,
      });
      if (refundErr) console.error("[suno-voice-generate-callback] refund failed", refundErr.message);
    }
    return json({ ok: true });

  } catch (e) {
    return json({ error: String((e as Error).message) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
