import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getServiceClient, getAuthUser, sunoFetch, toVoiceError } from '../_shared/voice.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const user = await getAuthUser(req);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const url = new URL(req.url);
    const taskId = url.searchParams.get('taskId');
    if (!taskId) return json({ error: 'taskId required' }, 400);

    const supabase = getServiceClient();
    const { data: row } = await supabase
      .from('custom_voices').select('*')
      .eq('generate_task_id', taskId).eq('user_id', user.id).maybeSingle();
    if (!row) return json({ error: 'Not found' }, 404);

    if (row.voice_id) return json({ success: true, status: row.status, voiceId: row.voice_id, voice: row });

    const res = await sunoFetch(`/record-info?taskId=${encodeURIComponent(taskId)}`, { method: 'GET' });
    const data = res?.data || res;
    const voiceId = data?.voiceId || data?.voice_id;

    const patch: Record<string, unknown> = { last_polled_at: new Date().toISOString() };
    if (voiceId) {
      patch.voice_id = voiceId;
      patch.status = 'ready';
      patch.is_available = true;
    } else if (data?.status === 'FAILED' || data?.errorCode) {
      patch.status = 'failed';
      patch.error_code = data.errorCode ?? null;
      patch.error_message = data.errorMessage ?? 'Generation failed';
    }
    await supabase.from('custom_voices').update(patch as any).eq('id', row.id);

    return json({ success: true, status: patch.status ?? row.status, voiceId, data });
  } catch (e) {
    const err: any = e;
    const status = err?.status || 500;
    const code = err?.code || 'INTERNAL';
    return json({ success: false, error: err?.message || 'Внутренняя ошибка', code }, status);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
