import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { isSunoSuccessCode } from '../_shared/suno.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sunoApiKey = Deno.env.get('SUNO_API_KEY');

    if (!sunoApiKey) {
      throw new Error('SUNO_API_KEY not configured');
    }

    const supabase = getSupabaseClient();

    // Get auth user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const body = await req.json();
    const { trackId } = body;

    if (!trackId) {
      throw new Error('trackId is required');
    }

    console.log('🎬 Video generation request:', { trackId, userId: user.id });

    // Get track with suno_task_id and suno_id
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('*')
      .eq('id', trackId)
      .eq('user_id', user.id)
      .single();

    if (trackError || !track) {
      console.error('❌ Track not found:', trackError);
      throw new Error('Track not found or access denied');
    }

    if (!track.suno_task_id || !track.suno_id) {
      throw new Error('Track does not have required Suno IDs for video generation');
    }

    console.log('✅ Track verified:', track.id, 'suno_task_id:', track.suno_task_id, 'suno_id:', track.suno_id);

    // Check if video generation is already in progress
    const { data: existingTask } = await supabase
      .from('video_generation_tasks')
      .select('id, status')
      .eq('track_id', trackId)
      .in('status', ['pending', 'processing'])
      .single();

    if (existingTask) {
      throw new Error('Video generation already in progress for this track');
    }

    const callbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/suno-video-callback`;

    // Get artist name from profile or track
    let artistName = 'MusicVerse';
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, first_name')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      artistName = profile.username || profile.first_name || 'MusicVerse';
    }

    const requestBody = {
      taskId: track.suno_task_id,
      audioId: track.suno_id,
      callBackUrl: callbackUrl,
      author: artistName,
      domainName: 'musicverse.app',
    };

    console.log('📤 Calling Suno API for video generation:', requestBody);

    const startTime = Date.now();
    const sunoResponse = await fetch('https://api.sunoapi.org/api/v1/mp4/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sunoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const duration = Date.now() - startTime;
    const sunoData = await sunoResponse.json();

    console.log(`📥 Response (${duration}ms):`, JSON.stringify(sunoData, null, 2));

    // Log API call
    await supabase.from('api_usage_logs').insert({
      user_id: user.id,
      service: 'suno',
      endpoint: 'mp4/generate',
      method: 'POST',
      request_body: requestBody,
      response_status: sunoResponse.status,
      response_body: sunoData,
      duration_ms: duration,
      estimated_cost: 0.05, // Video generation cost estimate
    });

    if (!sunoResponse.ok || !isSunoSuccessCode(sunoData.code)) {
      const errorMsg = sunoData.msg || 'Video generation request failed';
      console.error('❌ Suno API error:', errorMsg);
      throw new Error(errorMsg);
    }

    const videoTaskId = sunoData.data?.taskId;
    if (!videoTaskId) {
      throw new Error('No taskId returned from video generation API');
    }

    console.log('✅ Video generation initiated:', videoTaskId);

    // Save video generation task
    const { error: taskError } = await supabase
      .from('video_generation_tasks')
      .insert({
        track_id: track.id,
        user_id: user.id,
        prompt: track.prompt || track.title || 'Video generation',
        suno_task_id: track.suno_task_id,
        video_task_id: videoTaskId,
        suno_audio_id: track.suno_id,
        status: 'processing',
      });

    if (taskError) {
      console.error('⚠️ Failed to save video task:', taskError);
      // Don't throw - video generation was already initiated
    } else {
      console.log('✅ Video task saved to database');
    }

    // Log in track changelog
    await supabase.from('track_change_log').insert({
      track_id: track.id,
      user_id: user.id,
      change_type: 'video_generation_started',
      changed_by: 'suno_api',
      metadata: { video_task_id: videoTaskId },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        trackId: track.id, 
        videoTaskId,
        message: 'Video generation started' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
