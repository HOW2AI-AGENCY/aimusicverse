import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Per SunoAPI docs (https://docs.sunoapi.org/suno-api/generate-music):
 * Model parameter accepts: V5, V4_5PLUS, V4_5, V4, V3_5 - NOT chirp-* names
 */
const VALID_MODELS = ['V5', 'V4_5PLUS', 'V4_5', 'V4', 'V3_5'];
const DEFAULT_MODEL = 'V4_5';

/**
 * Convert UI model key to API model name with fallback
 */
function getApiModelName(uiKey: string): string {
  // Map legacy V4_5ALL to V4_5
  if (uiKey === 'V4_5ALL') return 'V4_5';
  // Return as-is if valid, otherwise default
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
    const miniAppUrl = Deno.env.get('MINI_APP_URL');

    if (!sunoApiKey) {
      throw new Error('SUNO_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      console.error('User authentication failed:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const body = await req.json();
    const {
      mode = 'simple',
      instrumental = false,
      model = 'V4_5ALL',
      prompt,
      title,
      style,
      negativeTags,
      vocalGender,
      styleWeight,
      weirdnessConstraint,
      audioWeight,
      personaId,
      projectId,
      artistId,
      planTrackId, // Link to project_tracks for status update
      language = 'ru',
    } = body;
    
    // Update plan track status to in_progress if provided
    if (planTrackId) {
      await supabase
        .from('project_tracks')
        .update({ status: 'in_progress' })
        .eq('id', planTrackId);
    }

    // Validate required fields
    if (!prompt) {
      console.error('Prompt is required');
      return new Response(
        JSON.stringify({ success: false, error: 'Требуется описание музыки' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const customMode = mode === 'custom';

    if (customMode && !style) {
      console.error('Style is required in custom mode');
      return new Response(
        JSON.stringify({ success: false, error: 'Укажите стиль музыки в custom режиме' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate prompt length for non-custom mode (Suno limit: 500 chars)
    if (!customMode && prompt.length > 500) {
      console.error(`Prompt too long for simple mode: ${prompt.length} chars`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Описание слишком длинное (${prompt.length}/500 символов). Сократите текст или используйте Custom режим.` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (customMode && !instrumental && prompt.length > 5000) {
      console.error('Prompt too long');
      return new Response(
        JSON.stringify({ success: false, error: 'Текст слишком длинный (макс. 5000 символов)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Fetch artist data if artistId provided
    let artistData: { id: string; name: string; avatar_url: string | null; suno_persona_id: string | null } | null = null;
    if (artistId) {
      const { data: artist, error: artistError } = await supabase
        .from('artists')
        .select('id, name, avatar_url, suno_persona_id')
        .eq('id', artistId)
        .single();
      
      if (!artistError && artist) {
        artistData = artist;
        console.log('Found artist:', artist.name, 'with persona:', artist.suno_persona_id);
      }
    }

    // Use persona ID from artist if available, otherwise use direct personaId
    const effectivePersonaId = artistData?.suno_persona_id || personaId;

    // Create track record with artist info
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .insert({
        user_id: user.id,
        project_id: projectId,
        prompt: prompt,
        title: customMode ? title : null,
        style: style,
        has_vocals: !instrumental,
        status: 'pending',
        provider: 'suno',
        suno_model: model,
        generation_mode: mode,
        vocal_gender: vocalGender,
        style_weight: styleWeight,
        negative_tags: negativeTags,
        // Store artist reference
        artist_id: artistData?.id || null,
        artist_name: artistData?.name || null,
        artist_avatar_url: artistData?.avatar_url || null,
      })
      .select()
      .single();

    if (trackError || !track) {
      console.error('Track creation error:', trackError);
      throw new Error('Failed to create track record');
    }

    // Get telegram_chat_id if available
    const { data: profile } = await supabase
      .from('profiles')
      .select('telegram_id')
      .eq('user_id', user.id)
      .single();

    const telegramChatId = profile?.telegram_id || null;

    // Create generation task
    const { data: task, error: taskError } = await supabase
      .from('generation_tasks')
      .insert({
        user_id: user.id,
        prompt: prompt,
        status: 'pending',
        telegram_chat_id: telegramChatId,
        track_id: track.id,
        source: 'mini_app',
        generation_mode: mode,
        model_used: model,
      })
      .select()
      .single();

    if (taskError || !task) {
      console.error('Task creation error:', taskError);
      throw new Error('Failed to create generation task');
    }

    // Prepare SunoAPI request
    const callbackUrl = `${supabaseUrl}/functions/v1/suno-music-callback`;
    
    // Map UI model key to API model name
    const apiModel = getApiModelName(model);
    console.log(`Model mapping: ${model} -> ${apiModel}`);
    
    const sunoPayload: any = {
      customMode,
      instrumental,
      model: apiModel,
      callBackUrl: callbackUrl,
    };

    if (customMode) {
      sunoPayload.prompt = prompt;
      sunoPayload.style = style;
      if (title) sunoPayload.title = title;
    } else {
      sunoPayload.prompt = prompt;
    }

    if (negativeTags) sunoPayload.negativeTags = negativeTags;
    if (vocalGender) sunoPayload.vocalGender = vocalGender;
    if (styleWeight !== undefined) sunoPayload.styleWeight = styleWeight;
    if (weirdnessConstraint !== undefined) sunoPayload.weirdnessConstraint = weirdnessConstraint;
    if (audioWeight !== undefined) sunoPayload.audioWeight = audioWeight;
    if (effectivePersonaId) sunoPayload.personaId = effectivePersonaId;

    console.log('Sending to SunoAPI:', JSON.stringify(sunoPayload, null, 2));

    // Call SunoAPI
    const startTime = Date.now();
    const sunoResponse = await fetch('https://api.sunoapi.org/api/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sunoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sunoPayload),
    });

    const duration = Date.now() - startTime;
    const sunoData = await sunoResponse.json();
    
    console.log(`📥 Suno response (${duration}ms, $0.05)`);

    // Log API call
    await supabase.from('api_usage_logs').insert({
      user_id: user.id,
      service: 'suno',
      endpoint: 'generate',
      method: 'POST',
      request_body: sunoPayload,
      response_status: sunoResponse.status,
      response_body: sunoData,
      duration_ms: duration,
      estimated_cost: 0.05,
    });

    if (!sunoResponse.ok || sunoData.code !== 200) {
      console.error('SunoAPI error:', sunoResponse.status, sunoData);
      
      const errorMsg = sunoData.msg || 'SunoAPI request failed';
      
      // Handle rate limiting
      if (sunoResponse.status === 429) {
        await supabase.from('generation_tasks').update({ 
          status: 'failed', 
          error_message: 'Превышен лимит запросов. Попробуйте позже.' 
        }).eq('id', task.id);

        await supabase.from('tracks').update({ 
          status: 'failed', 
          error_message: 'Превышен лимит запросов. Попробуйте позже.' 
        }).eq('id', track.id);

        return new Response(
          JSON.stringify({ success: false, error: 'Превышен лимит запросов. Попробуйте позже.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }

      // Handle insufficient credits
      if (sunoResponse.status === 402) {
        await supabase.from('generation_tasks').update({ 
          status: 'failed', 
          error_message: 'Недостаточно кредитов на аккаунте' 
        }).eq('id', task.id);

        await supabase.from('tracks').update({ 
          status: 'failed', 
          error_message: 'Недостаточно кредитов на аккаунте' 
        }).eq('id', track.id);

        return new Response(
          JSON.stringify({ success: false, error: 'Недостаточно кредитов на аккаунте' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
        );
      }
      
      // Update task and track as failed
      await supabase.from('generation_tasks').update({ 
        status: 'failed', 
        error_message: errorMsg 
      }).eq('id', task.id);

      await supabase.from('tracks').update({ 
        status: 'failed', 
        error_message: errorMsg 
      }).eq('id', track.id);

      return new Response(
        JSON.stringify({ success: false, error: errorMsg }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const sunoTaskId = sunoData.data?.taskId;

    if (!sunoTaskId) {
      throw new Error('No taskId returned from SunoAPI');
    }

    // Update task with Suno taskId
    await supabase
      .from('generation_tasks')
      .update({ 
        suno_task_id: sunoTaskId,
        status: 'processing',
      })
      .eq('id', task.id);

    await supabase
      .from('tracks')
      .update({ 
        suno_task_id: sunoTaskId,
        status: 'processing',
      })
      .eq('id', track.id);

    // Log the generation
    await supabase
      .from('track_change_log')
      .insert({
        track_id: track.id,
        user_id: user.id,
        change_type: 'generation_started',
        changed_by: 'suno_api',
        ai_model_used: model,
        prompt_used: prompt,
        metadata: {
          mode,
          instrumental,
          style,
          model,
          suno_task_id: sunoTaskId,
          artist_id: artistData?.id,
          artist_name: artistData?.name,
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        trackId: track.id,
        taskId: task.id,
        sunoTaskId,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in suno-music-generate:', error);
    
    // Try to log error to database if we have context
    try {
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        const { data: { user } } = await supabase.auth.getUser(
          authHeader.replace('Bearer ', '')
        );
        
        if (user) {
          await supabase
            .from('notifications')
            .insert({
              user_id: user.id,
              type: 'generation_error',
              title: 'Ошибка генерации',
              message: error.message || 'Произошла ошибка при генерации трека',
            });
        }
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
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