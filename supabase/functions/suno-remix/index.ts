/**
 * Suno Remix/Cover - Create cover version from uploaded audio
 * 
 * Uses /api/v1/generate/upload-cover endpoint for covers from audio files.
 * This transforms audio into a new style while retaining core melody.
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
      audioId,
      audioUrl,  // Direct audio URL for reference audio
      prompt,
      style,
      title,
      instrumental = false,
      model = 'V4_5',
      // Cover-specific parameters
      audioWeight = 0.5, // 0.0-1.0, how much of original melody to preserve
      negativeTags,
      vocalGender,
      styleWeight,
      weirdnessConstraint,
      personaId,
    } = body;

    // Need either audioId (for existing tracks) or audioUrl (for reference audio)
    if (!audioId && !audioUrl) {
      throw new Error('audioId or audioUrl is required');
    }

    // Get original track info if audioId provided, otherwise use reference audio URL
    let originalTrack: any = null;
    let uploadUrl = audioUrl;
    let basePrompt = prompt || '';
    let baseStyle = style || '';
    let baseTitle = title || 'AI Cover';

    if (audioId) {
      const { data: trackData, error: trackError } = await supabase
        .from('tracks')
        .select('*')
        .eq('suno_id', audioId)
        .single();

      if (trackError || !trackData) {
        throw new Error('Original track not found');
      }
      
      originalTrack = trackData;
      uploadUrl = trackData.audio_url;
      basePrompt = prompt || trackData.prompt || '';
      baseStyle = style || trackData.style || '';
      baseTitle = title || `${trackData.title} (Cover)`;
    }

    if (!uploadUrl) {
      throw new Error('No audio URL available for cover');
    }

    const effectiveModel = getApiModelName(model);

    console.log('[suno-remix] Creating cover:', { 
      audioId, 
      hasAudioUrl: !!audioUrl, 
      uploadUrl: uploadUrl?.substring(0, 50),
      audioWeight,
    });

    // Create new track record - use 'cover' as generation_mode for consistency
    const { data: newTrack, error: newTrackError } = await supabase
      .from('tracks')
      .insert({
        user_id: user.id,
        project_id: originalTrack?.project_id || null,
        prompt: basePrompt || 'Cover',
        title: baseTitle,
        style: baseStyle,
        has_vocals: !instrumental,
        status: 'pending',
        provider: 'suno',
        suno_model: effectiveModel,
        generation_mode: 'cover', // Changed from 'remix' for consistency
      })
      .select()
      .single();

    if (newTrackError || !newTrack) {
      console.error('[suno-remix] Failed to create track record:', newTrackError);
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
        prompt: basePrompt || 'Cover',
        status: 'pending',
        track_id: newTrack.id,
        telegram_chat_id: profile?.telegram_id || null,
        source: 'mini_app',
        generation_mode: 'cover',
        model_used: effectiveModel,
      })
      .select()
      .single();

    if (taskError || !task) {
      console.error('[suno-remix] Failed to create generation task:', taskError);
      throw new Error('Failed to create generation task');
    }

    const callbackUrl = `${supabaseUrl}/functions/v1/suno-music-callback`;
    
    // Build payload for upload-cover endpoint
    // Per API docs: https://docs.sunoapi.org/suno-api/upload-and-cover-audio
    const sunoPayload: Record<string, unknown> = {
      uploadUrl,
      customMode: true,
      prompt: basePrompt || 'Create a cover version',
      style: baseStyle || 'modern pop',
      title: baseTitle,
      instrumental,
      model: effectiveModel,
      callBackUrl: callbackUrl,
      // audioWeight controls how much of original melody to preserve
      // 0.0 = completely new, 1.0 = very close to original
      audioWeight: Math.max(0, Math.min(1, audioWeight)),
    };

    // Add optional parameters if provided
    if (negativeTags) sunoPayload.negativeTags = negativeTags;
    if (vocalGender) sunoPayload.vocalGender = vocalGender;
    if (styleWeight !== undefined) sunoPayload.styleWeight = styleWeight;
    if (weirdnessConstraint !== undefined) sunoPayload.weirdnessConstraint = weirdnessConstraint;
    if (personaId) sunoPayload.personaId = personaId;

    console.log('[suno-remix] Sending to upload-cover endpoint:', {
      ...sunoPayload,
      uploadUrl: uploadUrl.substring(0, 50) + '...',
    });

    // CRITICAL: Use upload-cover endpoint, NOT generic generate!
    const startTime = Date.now();
    const sunoResponse = await fetch('https://api.sunoapi.org/api/v1/generate/upload-cover', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sunoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sunoPayload),
    });

    const duration = Date.now() - startTime;
    const sunoData = await sunoResponse.json();
    
    console.log(`[suno-remix] Response (${duration}ms):`, JSON.stringify(sunoData).substring(0, 300));

    // Log API call
    await supabase.from('api_usage_logs').insert({
      user_id: user.id,
      service: 'suno',
      endpoint: 'upload-cover',
      method: 'POST',
      request_body: { 
        audioId, 
        audioUrl: uploadUrl?.substring(0, 100), 
        prompt: basePrompt, 
        style: baseStyle, 
        title: baseTitle, 
        instrumental, 
        model: effectiveModel,
        audioWeight,
      },
      response_status: sunoResponse.status,
      response_body: sunoData,
      duration_ms: duration,
      estimated_cost: 0.04,
    });

    if (!sunoResponse.ok || !isSunoSuccessCode(sunoData.code)) {
      const errorMsg = sunoData.msg || `SunoAPI upload-cover failed (${sunoResponse.status})`;
      console.error('[suno-remix] API error:', errorMsg, sunoData);

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

    console.log('[suno-remix] Success:', { 
      trackId: newTrack.id, 
      sunoTaskId,
      audioWeight,
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
    console.error('[suno-remix] Error:', errorMessage);
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
