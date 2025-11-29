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
      taskId,
      audioId,
      mode = 'simple', // 'simple' for vocal/instrumental only, 'detailed' for full stems
    } = body;

    if (!taskId || !audioId) {
      throw new Error('taskId and audioId are required');
    }

    // Get original track
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('*')
      .eq('suno_task_id', taskId)
      .eq('suno_id', audioId)
      .single();

    if (trackError || !track) {
      throw new Error('Track not found');
    }

    const callbackUrl = `${supabaseUrl}/functions/v1/suno-vocal-callback`;
    
    // Call SunoAPI vocal separation endpoint
    const sunoResponse = await fetch('https://api.sunoapi.org/api/v1/vocal-removal/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sunoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        taskId,
        audioId,
        callBackUrl: callbackUrl,
      }),
    });

    const sunoData = await sunoResponse.json();

    if (!sunoResponse.ok || sunoData.code !== 200) {
      throw new Error(sunoData.msg || 'SunoAPI request failed');
    }

    const separationTaskId = sunoData.data?.taskId;

    if (!separationTaskId) {
      throw new Error('No taskId returned from SunoAPI');
    }

    // Log the separation request
    await supabase
      .from('track_change_log')
      .insert({
        track_id: track.id,
        user_id: user.id,
        change_type: 'vocal_separation_started',
        changed_by: 'suno_api',
        metadata: {
          separation_task_id: separationTaskId,
          mode,
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        trackId: track.id,
        separationTaskId,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in suno-separate-vocals:', error);
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
