import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getServiceClient, getAuthUser, sunoFetch, callbackUrl, toVoiceError } from '../_shared/voice.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const user = await getAuthUser(req);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { voiceRowId, verifyPath } = await req.json();
    if (!voiceRowId) return json({ error: 'voiceRowId required' }, 400);

    const supabase = getServiceClient();
    const { data: row } = await supabase
      .from('custom_voices').select('*')
      .eq('id', voiceRowId).eq('user_id', user.id).maybeSingle();
    if (!row) return json({ error: 'Voice not found' }, 404);
    if (!row.validate_task_id) return json({ error: 'No validate_task_id' }, 400);

    let verifyUrl = row.verify_audio_url;
    let newVerifyPath = row.verify_path;
    if (verifyPath) {
      if (!verifyPath.startsWith(`${user.id}/`)) return json({ error: 'Invalid verifyPath' }, 403);
      const { data: signed } = await supabase.storage
        .from('voice-verifications').createSignedUrl(verifyPath, 3600);
      if (!signed) return json({ error: 'Cannot sign verify URL' }, 500);
      verifyUrl = signed.signedUrl;
      newVerifyPath = verifyPath;
    }
    if (!verifyUrl) return json({ error: 'No verify URL' }, 400);

    const sunoRes = await sunoFetch('/regenerate', {
      method: 'POST',
      body: JSON.stringify({
        taskId: row.validate_task_id,
        verifyUrl,
        callBackUrl: callbackUrl('suno-voice-generate-callback'),
      }),
    });
    const taskId = sunoRes?.data?.taskId || sunoRes?.taskId || row.validate_task_id;

    await supabase.from('custom_voices').update({
      verify_path: newVerifyPath,
      verify_audio_url: verifyUrl,
      generate_task_id: taskId,
      status: 'generating',
      error_code: null,
      error_message: null,
    } as any).eq('id', row.id);

    return json({ success: true, taskId });
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
