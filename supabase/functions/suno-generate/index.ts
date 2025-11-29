import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const sunoApiKey = Deno.env.get('SUNO_API_KEY');

    if (!sunoApiKey) {
      throw new Error('SUNO_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user authentication
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

    const { 
      action, // 'generate', 'extend', 'cover', 'stems', 'add_vocals', 'add_instrumental'
      trackId,
      prompt,
      lyrics,
      style,
      title,
      makeInstrumental = false,
      waitAudio = false,
      extendAudioUrl,
      continueAt,
      coverAudioUrl,
      stemMode // '2_stems', '4_stems', '5_stems'
    } = await req.json();

    console.log(`Suno API action: ${action} for user: ${user.id}`);

    let sunoResponse;

    switch (action) {
      case 'generate':
        // Generate new music
        sunoResponse = await fetch('https://api.sunoapi.org/api/v1/gateway/generate/music', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sunoApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: title || 'Untitled',
            tags: style || '',
            prompt: prompt || '',
            lyrics: lyrics || '',
            make_instrumental: makeInstrumental,
            wait_audio: waitAudio,
          }),
        });
        break;

      case 'extend':
        // Extend existing audio
        if (!extendAudioUrl || !continueAt) {
          throw new Error('extendAudioUrl and continueAt required for extend action');
        }
        sunoResponse = await fetch('https://api.sunoapi.org/api/v1/gateway/generate/extend', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sunoApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audio_url: extendAudioUrl,
            continue_at: continueAt,
            prompt: prompt || '',
            tags: style || '',
          }),
        });
        break;

      case 'cover':
        // Create cover version
        if (!coverAudioUrl) {
          throw new Error('coverAudioUrl required for cover action');
        }
        sunoResponse = await fetch('https://api.sunoapi.org/api/v1/gateway/generate/cover', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sunoApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audio_url: coverAudioUrl,
            prompt: prompt || '',
          }),
        });
        break;

      case 'stems':
        // Separate audio into stems
        if (!coverAudioUrl) {
          throw new Error('audio_url required for stems action');
        }
        sunoResponse = await fetch('https://api.sunoapi.org/api/v1/gateway/generate/stem', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sunoApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audio_url: coverAudioUrl,
            stem_mode: stemMode || '4_stems',
          }),
        });
        break;

      case 'add_vocals':
        // Add vocals to instrumental
        if (!coverAudioUrl || !lyrics) {
          throw new Error('audio_url and lyrics required for add_vocals action');
        }
        sunoResponse = await fetch('https://api.sunoapi.org/api/v1/gateway/generate/concat', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sunoApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audio_url: coverAudioUrl,
            lyrics: lyrics,
          }),
        });
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    if (!sunoResponse.ok) {
      const errorText = await sunoResponse.text();
      console.error('Suno API error:', errorText);
      throw new Error(`Suno API error: ${sunoResponse.status} ${errorText}`);
    }

    const sunoData = await sunoResponse.json();

    // Log the change if trackId is provided
    if (trackId && action !== 'stems') {
      await supabase.from('track_change_log').insert({
        track_id: trackId,
        user_id: user.id,
        change_type: action,
        changed_by: 'user',
        ai_model_used: 'suno_v3',
        prompt_used: prompt,
        metadata: {
          action,
          suno_task_id: sunoData.task_id || sunoData.id,
          style,
          title,
        },
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: sunoData,
        taskId: sunoData.task_id || sunoData.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in suno-generate:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
