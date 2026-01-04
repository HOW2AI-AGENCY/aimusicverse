/**
 * Suno Extend Audio - Extend track from uploaded audio URL
 * 
 * Uses /api/v1/generate/upload-extend endpoint to extend audio files.
 * This is different from suno-music-extend which extends existing Suno tracks.
 * 
 * CRITICAL: Uses upload-extend endpoint, NOT generic generate endpoint!
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { isSunoSuccessCode } from '../_shared/suno.ts';
import { corsHeaders } from '../_shared/cors.ts';

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
      continueAt,
      prompt = '',
      style = '',
      title = '',
      model = 'V4_5',
      instrumental = false,
      // Additional parameters for upload-extend
      defaultParamFlag = true, // Use original params by default for seamless extension
      negativeTags,
      vocalGender,
      styleWeight,
      weirdnessConstraint,
      audioWeight,
      personaId,
    } = body;

    if (!audioUrl) {
      throw new Error('audioUrl is required');
    }

    // Validate continueAt - required for upload-extend
    // Must be > 0 and < total duration of audio
    const effectiveContinueAt = typeof continueAt === 'number' && continueAt > 0 
      ? continueAt 
      : 30; // Default to 30 seconds if not specified

    console.log('[suno-extend-audio] Request:', { 
      audioUrl: audioUrl.substring(0, 80), 
      continueAt: effectiveContinueAt, 
      hasPrompt: !!prompt,
      defaultParamFlag,
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
        style: style || 'continuation',
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
    
    // Build payload for upload-extend endpoint
    // Per API docs: https://docs.sunoapi.org/suno-api/upload-extend-music
    const sunoPayload: Record<string, unknown> = {
      uploadUrl: audioUrl,
      continueAt: effectiveContinueAt, // REQUIRED for upload-extend
      defaultParamFlag, // true = use original params, false = use custom
      model: effectiveModel,
      callBackUrl: callbackUrl,
      instrumental,
    };

    // Add custom parameters when not using default params
    if (!defaultParamFlag) {
      sunoPayload.prompt = prompt || 'Continue in the same style';
      sunoPayload.style = style || 'seamless continuation';
      sunoPayload.title = effectiveTitle;
    }

    // Add optional parameters if provided
    if (negativeTags) sunoPayload.negativeTags = negativeTags;
    if (vocalGender) sunoPayload.vocalGender = vocalGender;
    if (styleWeight !== undefined) sunoPayload.styleWeight = styleWeight;
    if (weirdnessConstraint !== undefined) sunoPayload.weirdnessConstraint = weirdnessConstraint;
    if (audioWeight !== undefined) sunoPayload.audioWeight = audioWeight;
    if (personaId) sunoPayload.personaId = personaId;

    console.log('[suno-extend-audio] Sending to upload-extend endpoint:', {
      ...sunoPayload,
      uploadUrl: audioUrl.substring(0, 50) + '...',
    });

    // CRITICAL: Use upload-extend endpoint, NOT generic generate!
    const startTime = Date.now();
    const sunoResponse = await fetch('https://api.sunoapi.org/api/v1/generate/upload-extend', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sunoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sunoPayload),
    });

    const duration = Date.now() - startTime;
    const sunoData = await sunoResponse.json();
    
    console.log(`[suno-extend-audio] Response (${duration}ms):`, JSON.stringify(sunoData).substring(0, 300));

    // Log API call
    await supabase.from('api_usage_logs').insert({
      user_id: user.id,
      service: 'suno',
      endpoint: 'upload-extend',
      method: 'POST',
      request_body: { 
        uploadUrl: audioUrl.substring(0, 100), 
        continueAt: effectiveContinueAt, 
        prompt, 
        style, 
        title,
        defaultParamFlag,
      },
      response_status: sunoResponse.status,
      response_body: sunoData,
      duration_ms: duration,
      estimated_cost: 0.04,
    });

    if (!sunoResponse.ok || !isSunoSuccessCode(sunoData.code)) {
      const errorMsg = sunoData.msg || `SunoAPI upload-extend failed (${sunoResponse.status})`;
      console.error('[suno-extend-audio] API error:', errorMsg, sunoData);
      
      await supabase.from('generation_tasks').update({ 
        status: 'failed', 
        error_message: errorMsg,
      }).eq('id', task.id);

      await supabase.from('tracks').update({ 
        status: 'failed', 
        error_message: errorMsg,
      }).eq('id', newTrack.id);

      throw new Error(errorMsg);
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

    console.log('[suno-extend-audio] Success:', { 
      trackId: newTrack.id, 
      sunoTaskId,
      continueAt: effectiveContinueAt,
    });

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

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[suno-extend-audio] Error:', errorMessage);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
