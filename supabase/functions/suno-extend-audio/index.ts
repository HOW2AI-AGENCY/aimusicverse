/**
 * Suno Extend Audio - Extend track from audio URL
 * 
 * Similar to suno-remix but specifically for extending tracks.
 * Used when user wants to extend a recording or reference audio file.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { isSunoSuccessCode } from '../_shared/suno.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_MODELS = ['V5', 'V4_5PLUS', 'V4_5', 'V4', 'V3_5'];
const DEFAULT_MODEL = 'V4_5';

function getApiModelName(uiKey: string): string {
  if (uiKey === 'V4_5ALL') return 'V4_5';
  return VALID_MODELS.includes(uiKey) ? uiKey : DEFAULT_MODEL;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const sunoApiKey = Deno.env.get('SUNO_API_KEY');

    if (!sunoApiKey) {
      throw new Error('SUNO_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const body = await req.json();
    const {
      audioUrl,
      continueAt = 30,
      prompt = '',
      style = '',
      title = '',
      model = 'V4_5',
      instrumental = false,
    } = body;

    if (!audioUrl) {
      throw new Error('audioUrl is required');
    }

    console.log('[suno-extend-audio] Request:', { 
      audioUrl: audioUrl.substring(0, 50), 
      continueAt, 
      hasPrompt: !!prompt 
    });

    const effectiveModel = getApiModelName(model);
    const effectiveTitle = title || `Extended Track ${new Date().toLocaleDateString('ru-RU')}`;

    // Create new track record
    const { data: newTrack, error: trackError } = await supabase
      .from('tracks')
      .insert({
        user_id: user.id,
        prompt: prompt || 'Extended audio',
        title: effectiveTitle,
        style: style || 'pop',
        has_vocals: !instrumental,
        status: 'pending',
        provider: 'suno',
        suno_model: effectiveModel,
        generation_mode: 'extend',
      })
      .select()
      .single();

    if (trackError || !newTrack) {
      console.error('[suno-extend-audio] Track creation error:', trackError);
      throw new Error('Failed to create track record');
    }

    // Get telegram_chat_id if available
    const { data: profile } = await supabase
      .from('profiles')
      .select('telegram_id')
      .eq('user_id', user.id)
      .single();

    // Create generation task
    const { data: task, error: taskError } = await supabase
      .from('generation_tasks')
      .insert({
        user_id: user.id,
        prompt: prompt || 'Extended audio',
        status: 'pending',
        telegram_chat_id: profile?.telegram_id || null,
        track_id: newTrack.id,
        source: 'mini_app',
        generation_mode: 'extend',
        model_used: effectiveModel,
      })
      .select()
      .single();

    if (taskError || !task) {
      console.error('[suno-extend-audio] Task creation error:', taskError);
      throw new Error('Failed to create generation task');
    }

    const callbackUrl = `${supabaseUrl}/functions/v1/suno-music-callback`;
    
    // Use SunoAPI generate with uploadUrl for extend from audio URL
    // This creates a new track based on the uploaded audio
    const startTime = Date.now();
    const sunoResponse = await fetch('https://api.sunoapi.org/api/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sunoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uploadUrl: audioUrl,
        customMode: true,
        prompt: prompt || 'Continue in the same style',
        style: style || 'continuation, seamless transition',
        title: effectiveTitle,
        instrumental,
        model: effectiveModel,
        callBackUrl: callbackUrl,
        // Note: continueAt is for extend from existing Suno track
        // For uploadUrl, the API creates a new track inspired by the audio
      }),
    });

    const duration = Date.now() - startTime;
    const sunoData = await sunoResponse.json();
    
    console.log(`[suno-extend-audio] Response (${duration}ms):`, JSON.stringify(sunoData).substring(0, 200));

    // Log API call
    await supabase.from('api_usage_logs').insert({
      user_id: user.id,
      service: 'suno',
      endpoint: 'extend-audio',
      method: 'POST',
      request_body: { audioUrl: audioUrl.substring(0, 100), continueAt, prompt, style, title },
      response_status: sunoResponse.status,
      response_body: sunoData,
      duration_ms: duration,
      estimated_cost: 0.04,
    });

    if (!sunoResponse.ok || !isSunoSuccessCode(sunoData.code)) {
      await supabase.from('generation_tasks').update({ 
        status: 'failed', 
        error_message: sunoData.msg || 'SunoAPI request failed' 
      }).eq('id', task.id);

      await supabase.from('tracks').update({ 
        status: 'failed', 
        error_message: sunoData.msg || 'SunoAPI request failed' 
      }).eq('id', newTrack.id);

      throw new Error(sunoData.msg || 'SunoAPI request failed');
    }

    const sunoTaskId = sunoData.data?.taskId;

    if (!sunoTaskId) {
      throw new Error('No taskId returned from SunoAPI');
    }

    await supabase.from('generation_tasks').update({ 
      suno_task_id: sunoTaskId,
      status: 'processing',
    }).eq('id', task.id);

    await supabase.from('tracks').update({ 
      suno_task_id: sunoTaskId,
      status: 'processing',
    }).eq('id', newTrack.id);

    console.log('[suno-extend-audio] Success:', { trackId: newTrack.id, sunoTaskId });

    return new Response(
      JSON.stringify({
        success: true,
        trackId: newTrack.id,
        taskId: task.id,
        sunoTaskId,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('[suno-extend-audio] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
