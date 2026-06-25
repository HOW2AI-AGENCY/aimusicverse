import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/voice.ts';

const WEBHOOK_SECRET = Deno.env.get('SUNO_WEBHOOK_SECRET');

async function verifySignature(payload: string, signature: string | null, timestamp: string | null): Promise<boolean> {
  if (!WEBHOOK_SECRET) {
    console.warn('[suno-voice-validate-callback] SUNO_WEBHOOK_SECRET not set, skipping signature verification');
    return true;
  }
  if (!signature || !timestamp) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${payload}${timestamp}`));
  const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hex === signature;
}

// Public callback receiver — verify_jwt = false
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const rawBody = await req.text();
    const sig = req.headers.get('X-Suno-Signature') || req.headers.get('x-suno-signature');
    const ts = req.headers.get('X-Suno-Timestamp') || req.headers.get('x-suno-timestamp');
    if (!(await verifySignature(rawBody, sig, ts))) {
      return json({ error: 'Invalid signature' }, 401);
    }

    const payload = JSON.parse(rawBody);
    const data = payload?.data || payload;
    const taskId = data?.taskId || data?.task_id;
    if (!taskId) return json({ error: 'taskId missing' }, 400);

    const supabase = getServiceClient();
    const { data: row } = await supabase
      .from('custom_voices').select('id, user_id, status')
      .eq('validate_task_id', taskId).maybeSingle();
    if (!row) return json({ ok: true, ignored: true });

    // Idempotency: ignore late callbacks once we've moved past validation
    if (row.status === 'ready' || row.status === 'generating' || row.status === 'phrase_ready') {
      return json({ ok: true, ignored: 'already_advanced' });
    }

    const validateInfo = data?.validateInfo || data?.phrase;
    const expiresAt = data?.expireAt || data?.phraseExpiresAt;
    const isFail = payload?.code && payload.code >= 400;

    const patch: Record<string, unknown> = { last_polled_at: new Date().toISOString() };
    if (isFail || data?.errorCode) {
      patch.status = 'failed';
      patch.error_code = data?.errorCode ?? payload?.code ?? null;
      patch.error_message = data?.errorMessage ?? payload?.msg ?? 'Validation failed';
    } else if (validateInfo) {
      patch.validate_phrase = validateInfo;
      patch.status = 'phrase_ready';
      if (expiresAt) patch.phrase_expires_at = new Date(expiresAt).toISOString();
    }

    await supabase.from('custom_voices').update(patch as any).eq('id', row.id);
    return json({ ok: true });
  } catch (e) {
    return json({ error: String((e as Error).message) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
