import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/voice.ts';

// Public callback receiver — verify_jwt = false
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const payload = await req.json();
    const data = payload?.data || payload;
    const taskId = data?.taskId || data?.task_id;
    if (!taskId) return json({ error: 'taskId missing' }, 400);

    const supabase = getServiceClient();
    const { data: row } = await supabase
      .from('custom_voices').select('id, user_id')
      .eq('validate_task_id', taskId).maybeSingle();
    if (!row) return json({ ok: true, ignored: true });

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
