import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const sunoApiKey = Deno.env.get('SUNO_API_KEY');

    if (!sunoApiKey) {
      throw new Error('SUNO_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const body = await req.json();
    const { taskId, audioId, mode = 'simple', userId } = body;

    console.log('🎵 Vocal separation request:', { taskId, audioId, mode, userId });

    if (!taskId || !audioId || !userId) {
      throw new Error('taskId, audioId, and userId are required');
    }

    // Verify track ownership
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('*')
      .eq('suno_task_id', taskId)
      .eq('user_id', userId)
      .single();

    if (trackError || !track) {
      console.error('❌ Track not found:', trackError);
      throw new Error('Track not found or access denied');
    }

    console.log('✅ Track verified:', track.id);

    const callbackUrl = `${supabaseUrl}/functions/v1/suno-vocal-callback`;
    
    // FIXED: Use correct API parameters
    // mode: 'simple' -> type: 'separate_vocal' (vocal + instrumental)
    // mode: 'detailed' -> type: 'split_stem' (vocals, drums, bass, etc.)
    const apiType = mode === 'detailed' ? 'split_stem' : 'separate_vocal';
    
    const requestBody = {
      taskId,
      audioId,
      type: apiType,
      callBackUrl: callbackUrl,
    };

    console.log('📤 Calling Suno API:', requestBody);

    const startTime = Date.now();
    const sunoResponse = await fetch('https://api.sunoapi.org/api/v1/vocal-removal/generate', {
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
    console.log(`💰 Cost: $0.02`);

    // Log API call
    const { error: logError } = await supabase.from('api_usage_logs').insert({
      user_id: userId,
      service: 'suno',
      endpoint: 'vocal-removal',
      method: 'POST',
      request_body: requestBody,
      response_status: sunoResponse.status,
      response_body: sunoData,
      duration_ms: duration,
      estimated_cost: 0.02,
    });

    if (logError) console.error('⚠️ Log error:', logError);

    if (!sunoResponse.ok || !isSunoSuccessCode(sunoData.code)) {
      throw new Error(sunoData.msg || 'SunoAPI request failed');
    }

    const separationTaskId = sunoData.data?.taskId;
    if (!separationTaskId) {
      throw new Error('No taskId returned from separation API');
    }

    console.log('✅ Separation initiated:', separationTaskId);

    // Save separation task mapping for callback lookup
    const { error: taskError } = await supabase
      .from('stem_separation_tasks')
      .insert({
        separation_task_id: separationTaskId,
        track_id: track.id,
        original_task_id: taskId,
        original_audio_id: audioId,
        mode: mode,
        status: 'processing',
      });

    if (taskError) {
      console.error('⚠️ Failed to save separation task:', taskError);
    }

    // Log in track changelog
    await supabase.from('track_change_log').insert({
      track_id: track.id,
      user_id: userId,
      change_type: 'vocal_separation_started',
      changed_by: 'suno_api',
      metadata: { separation_task_id: separationTaskId, mode, api_type: apiType },
    });

    return new Response(
      JSON.stringify({ success: true, trackId: track.id, separationTaskId }),
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
