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
      prompt,
      style,
      title,
      instrumental = false,
      model = 'V4_5ALL',
    } = body;

    if (!audioId) {
      throw new Error('audioId is required');
    }

    // Get original track
    const { data: originalTrack, error: trackError } = await supabase
      .from('tracks')
      .select('*')
      .eq('suno_id', audioId)
      .single();

    if (trackError || !originalTrack) {
      throw new Error('Original track not found');
    }

    // Create new track record
    const { data: newTrack, error: newTrackError } = await supabase
      .from('tracks')
      .insert({
        user_id: user.id,
        project_id: originalTrack.project_id,
        prompt: prompt || `Remix of: ${originalTrack.prompt}`,
        title: title || `${originalTrack.title} (Remix)`,
        style: style || originalTrack.style,
        has_vocals: !instrumental,
        status: 'pending',
        provider: 'suno',
        suno_model: model,
        generation_mode: 'remix',
      })
      .select()
      .single();

    if (newTrackError || !newTrack) {
      throw new Error('Failed to create track record');
    }

    // Create generation task
    const { data: task, error: taskError } = await supabase
      .from('generation_tasks')
      .insert({
        user_id: user.id,
        prompt: prompt || originalTrack.prompt,
        status: 'pending',
        track_id: newTrack.id,
        source: 'mini_app',
        generation_mode: 'remix',
        model_used: model,
      })
      .select()
      .single();

    if (taskError || !task) {
      throw new Error('Failed to create generation task');
    }

    const callbackUrl = `${supabaseUrl}/functions/v1/suno-music-callback`;
    
    // Call SunoAPI remix endpoint
    const sunoResponse = await fetch('https://api.sunoapi.org/api/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sunoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uploadUrl: originalTrack.audio_url,
        customMode: true,
        prompt: prompt || originalTrack.prompt,
        style: style || originalTrack.style,
        title: title || `${originalTrack.title} (Remix)`,
        instrumental,
        model,
        callBackUrl: callbackUrl,
      }),
    });

    const sunoData = await sunoResponse.json();

    if (!sunoResponse.ok || sunoData.code !== 200) {
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
    console.error('Error in suno-remix:', error);
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
