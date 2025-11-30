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
    console.log('Received WAV conversion callback from SunoAPI:', JSON.stringify(payload, null, 2));

    const { code, msg, data } = payload;
    const { task_id, taskId, data: wavData } = data || {};
    const sunoTaskId = taskId || task_id;

    if (!sunoTaskId) {
      throw new Error('No taskId in callback');
    }

    if (code !== 200) {
      console.error('WAV conversion failed:', msg);
      return new Response(
        JSON.stringify({ success: true, status: 'failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const wavInfo = wavData?.[0];
    if (!wavInfo?.wavUrl) {
      throw new Error('No WAV URL in callback data');
    }

    console.log('WAV conversion completed, URL:', wavInfo.wavUrl);

    // Download WAV file
    const wavResponse = await fetch(wavInfo.wavUrl);
    const wavBlob = await wavResponse.blob();
    const fileName = `wav/${sunoTaskId}_${Date.now()}.wav`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('project-assets')
      .upload(fileName, wavBlob, {
        contentType: 'audio/wav',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    const { data: publicData } = supabase.storage
      .from('project-assets')
      .getPublicUrl(fileName);

    const localWavUrl = publicData.publicUrl;

    console.log('WAV file saved:', localWavUrl);

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: wavInfo.userId || 'system',
        type: 'track_generated',
        title: 'WAV конвертация завершена 🎵',
        message: 'Ваш трек сконвертирован в высокое качество WAV',
        action_url: localWavUrl,
      });

    return new Response(
      JSON.stringify({ success: true, wavUrl: localWavUrl }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in suno-wav-callback:', error);
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
