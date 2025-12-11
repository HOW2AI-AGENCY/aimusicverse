import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createLogger } from '../_shared/logger.ts';
import { isSunoSuccessCode } from '../_shared/suno.ts';

const logger = createLogger('suno-replace-section');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUNO_API_URL = 'https://api.sunoapi.org/api/v1/generate/replace-section';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const sunoApiKey = Deno.env.get('SUNO_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      logger.error('Auth error', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      trackId, 
      prompt, 
      tags, 
      infillStartS, 
      infillEndS 
    } = await req.json();

    logger.info('Replace section request', { 
      trackId, 
      infillStartS, 
      infillEndS, 
      promptLength: prompt?.length 
    });

    // Validate required fields
    if (!trackId || infillStartS === undefined || infillEndS === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: trackId, infillStartS, infillEndS' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get track data to retrieve suno_id and suno_task_id
    logger.info('Fetching track', { trackId, userId: user.id });
    
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('*, track_versions!track_versions_track_id_fkey(*)')
      .eq('id', trackId)
      .eq('user_id', user.id)
      .single();

    if (trackError) {
      logger.error('Track query error', null, { 
        code: trackError.code,
        message: trackError.message,
        details: trackError.details,
        hint: trackError.hint
      });
      return new Response(
        JSON.stringify({ error: 'Track not found or access denied', details: trackError.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!track) {
      logger.error('Track not found - null result', null, { trackId, userId: user.id });
      return new Response(
        JSON.stringify({ error: 'Track not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    logger.info('Track found', { 
      trackId: track.id, 
      sunoId: track.suno_id, 
      taskId: track.suno_task_id,
      versionsCount: track.track_versions?.length 
    });

    // We need the suno_id (audioId) from the active version
    const activeVersion = track.track_versions?.find((v: any) => v.id === track.active_version_id);
    const audioId = activeVersion?.metadata?.suno_id || track.suno_id;
    const taskId = track.suno_task_id;

    if (!audioId || !taskId) {
      logger.error('Missing Suno IDs', { audioId, taskId });
      return new Response(
        JSON.stringify({ error: 'Track is missing Suno audio ID or task ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate section duration (must be ≤50% of track duration)
    const sectionDuration = infillEndS - infillStartS;
    const trackDuration = track.duration_seconds || 0;
    if (trackDuration > 0 && sectionDuration > trackDuration * 0.5) {
      return new Response(
        JSON.stringify({ 
          error: `Section too long. Maximum: ${Math.floor(trackDuration * 0.5)}s (50% of track)`,
          maxDuration: Math.floor(trackDuration * 0.5)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's telegram chat ID for notifications
    const { data: profile } = await supabase
      .from('profiles')
      .select('telegram_chat_id')
      .eq('user_id', user.id)
      .single();

    // Create callback URL
    const callbackUrl = `${supabaseUrl}/functions/v1/suno-music-callback`;

    // Prepare Suno API request - fullLyrics and prompt are required by Suno API
    // IMPORTANT: Keep original lyrics WITH structural tags - Suno needs them
    const fullLyrics = (track.lyrics || '').trim();
    
    if (!fullLyrics) {
      logger.warn('Track has no lyrics, using empty string');
    }

    // Suno API requires non-empty prompt - use default if not provided
    const effectivePrompt = prompt || tags || track.tags || track.style || 'Continue in the same style and mood';
    const effectiveTags = tags || track.tags || '';
    
    logger.info('Preparing Suno payload', {
      hasPrompt: !!prompt,
      hasTags: !!tags,
      hasTrackTags: !!track.tags,
      hasTrackStyle: !!track.style,
      effectivePrompt: effectivePrompt.substring(0, 100),
      effectiveTags: effectiveTags.substring(0, 100),
      fullLyricsLength: fullLyrics.length,
      fullLyricsPreview: fullLyrics.substring(0, 200),
    });
    
    const sunoPayload = {
      taskId,
      audioId,
      prompt: effectivePrompt,
      tags: effectiveTags,
      title: track.title || 'Трек',
      fullLyrics,
      infillStartS: Number(infillStartS),
      infillEndS: Number(infillEndS),
      callBackUrl: callbackUrl,
    };

    logger.info('Calling Suno API', { 
      taskId, 
      audioId, 
      infillStartS, 
      infillEndS,
      promptLength: effectivePrompt.length,
      tagsLength: effectiveTags.length,
      lyricsLength: fullLyrics.length,
    });

    // Call Suno API
    const sunoResponse = await fetch(SUNO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sunoApiKey}`,
      },
      body: JSON.stringify(sunoPayload),
    });

    const sunoData = await sunoResponse.json();
    
    if (!sunoResponse.ok || !isSunoSuccessCode(sunoData.code)) {
      logger.error('Suno API error', null, { 
        status: sunoResponse.status, 
        data: sunoData 
      });
      return new Response(
        JSON.stringify({ 
          error: sunoData.msg || 'Failed to start section replacement',
          sunoError: sunoData 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newTaskId = sunoData.data?.taskId;
    if (!newTaskId) {
      logger.error('No taskId in response', null, { data: sunoData });
      return new Response(
        JSON.stringify({ error: 'No task ID returned from Suno' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create generation task record
    const { data: task, error: taskError } = await supabase
      .from('generation_tasks')
      .insert({
        user_id: user.id,
        track_id: trackId,
        prompt: prompt || `Замена секции ${infillStartS}s - ${infillEndS}s`,
        status: 'pending',
        suno_task_id: newTaskId,
        generation_mode: 'replace_section',
        model_used: track.model_name || 'chirp-v4',
        telegram_chat_id: profile?.telegram_chat_id,
        expected_clips: 1,
      })
      .select()
      .single();

    if (taskError) {
      logger.error('Failed to create task', taskError);
      return new Response(
        JSON.stringify({ error: 'Failed to create generation task' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the change
    await supabase.from('track_change_log').insert({
      track_id: trackId,
      user_id: user.id,
      change_type: 'replace_section_started',
      changed_by: 'user',
      prompt_used: prompt,
      metadata: {
        infillStartS,
        infillEndS,
        taskId: newTaskId,
        originalAudioId: audioId,
      },
    });

    logger.success('Replace section task created', { 
      taskId: task.id, 
      sunoTaskId: newTaskId 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        taskId: task.id,
        sunoTaskId: newTaskId,
        message: 'Section replacement started'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    logger.error('Replace section error', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
