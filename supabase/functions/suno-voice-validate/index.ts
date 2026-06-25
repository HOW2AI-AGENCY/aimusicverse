import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getServiceClient, getAuthUser, sunoFetch, callbackUrl, toVoiceError } from '../_shared/voice.ts';

const VOICE_CLONE_COST = 30;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const user = await getAuthUser(req);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json();
    const { voiceName, sourcePath, vocalStartS, vocalEndS, language = 'ru', description, style } = body;

    if (!voiceName || !sourcePath || vocalStartS == null || vocalEndS == null) {
      return json({ error: 'voiceName, sourcePath, vocalStartS, vocalEndS required' }, 400);
    }
    if (vocalEndS - vocalStartS < 5 || vocalEndS - vocalStartS > 30) {
      return json({ error: 'Vocal segment must be 5-30 seconds' }, 400);
    }
    if (!sourcePath.startsWith(`${user.id}/`)) {
      return json({ error: 'Invalid sourcePath' }, 403);
    }

    const supabase = getServiceClient();

    // Check admin (admins skip credit deduction)
    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (!isAdmin) {
      const { data: credits } = await supabase
        .from('user_credits').select('balance').eq('user_id', user.id).maybeSingle();
      if (!credits || credits.balance < VOICE_CLONE_COST) {
        return json({ error: 'Insufficient credits', required: VOICE_CLONE_COST }, 402);
      }
      const { error: dedErr } = await supabase.rpc('secure_credit_update', {
        _user_id: user.id, _amount: -VOICE_CLONE_COST,
        _action_type: 'voice_clone', _description: `Voice clone: ${voiceName}`,
      });
      if (dedErr) return json({ error: 'Credit deduction failed' }, 500);
    }

    // Sign source URL for Suno to fetch
    const { data: signed, error: signErr } = await supabase.storage
      .from('voice-sources').createSignedUrl(sourcePath, 3600);
    if (signErr || !signed) {
      if (!isAdmin) await supabase.rpc('secure_credit_update', {
        _user_id: user.id, _amount: VOICE_CLONE_COST,
        _action_type: 'voice_clone_refund', _description: 'Signing failed',
      });
      return json({ error: 'Cannot sign source URL' }, 500);
    }

    // Call Suno
    let sunoRes: any;
    try {
      sunoRes = await sunoFetch('/validate', {
        method: 'POST',
        body: JSON.stringify({
          voiceUrl: signed.signedUrl,
          vocalStartS: Math.floor(vocalStartS),
          vocalEndS: Math.floor(vocalEndS),
          language,
          callBackUrl: callbackUrl('suno-voice-validate-callback'),
        }),
      });
    } catch (e) {
      if (!isAdmin) await supabase.rpc('secure_credit_update', {
        _user_id: user.id, _amount: VOICE_CLONE_COST,
        _action_type: 'voice_clone_refund', _description: 'Suno validate failed',
      });
      return json({ error: String((e as Error).message) }, 502);
    }

    const taskId = sunoRes?.data?.taskId || sunoRes?.taskId;
    if (!taskId) return json({ error: 'No taskId from Suno', raw: sunoRes }, 502);

    const { data: row, error: insErr } = await supabase
      .from('custom_voices')
      .insert({
        user_id: user.id,
        voice_name: voiceName,
        description: description ?? null,
        style: style ?? null,
        language,
        source_path: sourcePath,
        source_audio_url: signed.signedUrl,
        vocal_start_s: Math.floor(vocalStartS),
        vocal_end_s: Math.floor(vocalEndS),
        validate_task_id: taskId,
        status: 'validating',
      })
      .select()
      .single();
    if (insErr) return json({ error: insErr.message }, 500);

    return json({ success: true, voice: row, taskId });
  } catch (e) {
    const err: any = e;
    const status = err?.status || 500;
    const code = err?.code || 'INTERNAL';
    return json({ success: false, error: err?.message || 'Внутренняя ошибка', code }, status);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
