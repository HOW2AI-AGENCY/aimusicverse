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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    console.log('Received vocal separation callback:', JSON.stringify(payload, null, 2));

    const { code, msg, data } = payload;
    
    // Support multiple data formats from SunoAPI
    const taskId = data?.taskId || data?.task_id;
    const audioId = data?.audioId || data?.audio_id;
    const vocalUrl = data?.vocalUrl || data?.vocal_url;
    const instrumentalUrl = data?.instrumentalUrl || data?.instrumental_url;

    console.log('Parsed callback data:', { taskId, audioId, vocalUrl, instrumentalUrl });

    if (!taskId || !audioId) {
      console.error('Missing required data:', { taskId, audioId, fullData: data });
      throw new Error('Missing taskId or audioId');
    }

    // Find the track
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('*')
      .eq('suno_task_id', taskId)
      .eq('suno_id', audioId)
      .single();

    if (trackError || !track) {
      throw new Error('Track not found');
    }

    if (code !== 200) {
      console.error('Vocal separation failed:', msg);
      
      await supabase
        .from('track_change_log')
        .insert({
          track_id: track.id,
          user_id: track.user_id,
          change_type: 'vocal_separation_failed',
          changed_by: 'suno_api',
          metadata: {
            error: msg,
          },
        });

      return new Response(
        JSON.stringify({ success: true, status: 'failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Download and save stems to storage
    let localVocalUrl = null;
    let localInstrumentalUrl = null;

    try {
      // Download vocal
      if (vocalUrl) {
        const vocalResponse = await fetch(vocalUrl);
        const vocalBlob = await vocalResponse.blob();
        const vocalFileName = `${track.id}_vocal_${Date.now()}.mp3`;
        
        const { data: vocalUpload, error: vocalError } = await supabase.storage
          .from('project-assets')
          .upload(`stems/${vocalFileName}`, vocalBlob, {
            contentType: 'audio/mpeg',
            upsert: true,
          });

        if (!vocalError && vocalUpload) {
          const { data: publicData } = supabase.storage
            .from('project-assets')
            .getPublicUrl(`stems/${vocalFileName}`);
          localVocalUrl = publicData.publicUrl;
        }
      }

      // Download instrumental
      if (instrumentalUrl) {
        const instrumentalResponse = await fetch(instrumentalUrl);
        const instrumentalBlob = await instrumentalResponse.blob();
        const instrumentalFileName = `${track.id}_instrumental_${Date.now()}.mp3`;
        
        const { data: instrumentalUpload, error: instrumentalError } = await supabase.storage
          .from('project-assets')
          .upload(`stems/${instrumentalFileName}`, instrumentalBlob, {
            contentType: 'audio/mpeg',
            upsert: true,
          });

        if (!instrumentalError && instrumentalUpload) {
          const { data: publicData } = supabase.storage
            .from('project-assets')
            .getPublicUrl(`stems/${instrumentalFileName}`);
          localInstrumentalUrl = publicData.publicUrl;
        }
      }
    } catch (downloadError) {
      console.error('Error downloading stems:', downloadError);
    }

    // Save stems to track_stems table
    const stemsToInsert = [];

    if (localVocalUrl || vocalUrl) {
      stemsToInsert.push({
        track_id: track.id,
        stem_type: 'vocal',
        audio_url: localVocalUrl || vocalUrl,
        separation_mode: 'simple',
      });
    }

    if (localInstrumentalUrl || instrumentalUrl) {
      stemsToInsert.push({
        track_id: track.id,
        stem_type: 'instrumental',
        audio_url: localInstrumentalUrl || instrumentalUrl,
        separation_mode: 'simple',
      });
    }

    if (stemsToInsert.length > 0) {
      await supabase
        .from('track_stems')
        .insert(stemsToInsert);
    }

    // Log completion
    await supabase
      .from('track_change_log')
      .insert({
        track_id: track.id,
        user_id: track.user_id,
        change_type: 'vocal_separation_completed',
        changed_by: 'suno_api',
        metadata: {
          stems_created: stemsToInsert.length,
        },
      });

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: track.user_id,
        type: 'stems_ready',
        title: 'Стемы готовы! 🎛️',
        message: `Разделение трека "${track.title || 'Без названия'}" завершено`,
        action_url: `/library`,
      });

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in suno-vocal-callback:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
