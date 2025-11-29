import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    
    // Get user from auth header
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
      sourceTrackId,
      defaultParamFlag = true,
      continueAt,
      prompt,
      style,
      title,
      model,
      negativeTags,
      vocalGender,
      styleWeight,
      weirdnessConstraint,
      audioWeight,
      personaId,
      projectId,
    } = body;

    if (!sourceTrackId) {
      throw new Error('sourceTrackId is required');
    }

    // Get source track
    const { data: sourceTrack, error: sourceError } = await supabase
      .from('tracks')
      .select('*')
      .eq('id', sourceTrackId)
      .eq('user_id', user.id)
      .single();

    if (sourceError || !sourceTrack) {
      throw new Error('Source track not found or access denied');
    }

    if (!sourceTrack.suno_id) {
      throw new Error('Source track does not have a Suno ID');
    }

    // Validate parameters
    if (defaultParamFlag) {
      if (!continueAt || continueAt <= 0) {
        throw new Error('continueAt must be greater than 0');
      }
      if (!prompt) {
        throw new Error('prompt is required when using custom parameters');
      }
      if (!style) {
        throw new Error('style is required when using custom parameters');
      }
      if (!title) {
        throw new Error('title is required when using custom parameters');
      }
    }

    const effectiveModel = model || sourceTrack.suno_model || 'V4_5ALL';

    // Create new track record for extension
    const { data: newTrack, error: trackError } = await supabase
      .from('tracks')
      .insert({
        user_id: user.id,
        project_id: projectId || sourceTrack.project_id,
        prompt: prompt || sourceTrack.prompt,
        title: title || `${sourceTrack.title} (Extended)`,
        style: style || sourceTrack.style,
        has_vocals: sourceTrack.has_vocals,
        status: 'pending',
        provider: 'suno',
        suno_model: effectiveModel,
        generation_mode: 'extend',
        vocal_gender: vocalGender,
        style_weight: styleWeight,
        negative_tags: negativeTags,
      })
      .select()
      .single();

    if (trackError || !newTrack) {
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
        prompt: prompt || `Extend from ${sourceTrack.title}`,
        status: 'pending',
        telegram_chat_id: telegramChatId,
        track_id: newTrack.id,
        source: 'mini_app',
        generation_mode: 'extend',
        model_used: effectiveModel,
      })
      .select()
      .single();

    if (taskError || !task) {
      console.error('Task creation error:', taskError);
      throw new Error('Failed to create generation task');
    }

    // Create track version relationship
    await supabase
      .from('track_versions')
      .insert({
        track_id: newTrack.id,
        audio_url: sourceTrack.audio_url || '',
        cover_url: sourceTrack.cover_url,
        duration_seconds: sourceTrack.duration_seconds,
        version_type: 'extended_from',
        parent_version_id: null,
        metadata: {
          source_track_id: sourceTrackId,
          continue_at: continueAt,
        },
      });

    // Prepare SunoAPI extend request
    const callbackUrl = `${supabaseUrl}/functions/v1/suno-music-callback`;
    
    const sunoPayload: any = {
      defaultParamFlag,
      audioId: sourceTrack.suno_id,
      model: effectiveModel,
      callBackUrl: callbackUrl,
    };

    if (defaultParamFlag) {
      sunoPayload.prompt = prompt;
      sunoPayload.style = style;
      sunoPayload.title = title;
      sunoPayload.continueAt = continueAt;
    }

    if (negativeTags) sunoPayload.negativeTags = negativeTags;
    if (vocalGender) sunoPayload.vocalGender = vocalGender;
    if (styleWeight !== undefined) sunoPayload.styleWeight = styleWeight;
    if (weirdnessConstraint !== undefined) sunoPayload.weirdnessConstraint = weirdnessConstraint;
    if (audioWeight !== undefined) sunoPayload.audioWeight = audioWeight;
    if (personaId) sunoPayload.personaId = personaId;

    console.log('Sending extend request to SunoAPI:', JSON.stringify(sunoPayload, null, 2));

    // Call SunoAPI extend endpoint
    const sunoResponse = await fetch('https://api.sunoapi.org/api/v1/generate/extend', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sunoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sunoPayload),
    });

    const sunoData = await sunoResponse.json();

    if (!sunoResponse.ok || sunoData.code !== 200) {
      console.error('SunoAPI extend error:', sunoData);
      
      // Update task and track as failed
      await supabase
        .from('generation_tasks')
        .update({ 
          status: 'failed', 
          error_message: sunoData.msg || 'SunoAPI extend request failed' 
        })
        .eq('id', task.id);

      await supabase
        .from('tracks')
        .update({ 
          status: 'failed', 
          error_message: sunoData.msg || 'SunoAPI extend request failed' 
        })
        .eq('id', newTrack.id);

      throw new Error(sunoData.msg || 'SunoAPI extend request failed');
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
      .eq('id', newTrack.id);

    // Log the extension
    await supabase
      .from('track_change_log')
      .insert({
        track_id: newTrack.id,
        user_id: user.id,
        change_type: 'track_extended',
        changed_by: 'suno_api',
        ai_model_used: effectiveModel,
        prompt_used: prompt || 'Using original parameters',
        metadata: {
          source_track_id: sourceTrackId,
          continue_at: continueAt,
          default_param_flag: defaultParamFlag,
          model: effectiveModel,
          suno_task_id: sunoTaskId,
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        trackId: newTrack.id,
        taskId: task.id,
        sunoTaskId,
        sourceTrackId,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in suno-music-extend:', error);
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