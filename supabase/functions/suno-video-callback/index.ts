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
    console.log('Received video callback from SunoAPI:', JSON.stringify(payload, null, 2));

    const { code, msg, data } = payload;
    const { task_id, taskId, data: videoData } = data || {};
    const sunoTaskId = taskId || task_id;

    if (!sunoTaskId) {
      throw new Error('No taskId in callback');
    }

    if (code !== 200) {
      console.error('Video creation failed:', msg);
      return new Response(
        JSON.stringify({ success: true, status: 'failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const videoInfo = videoData?.[0];
    if (!videoInfo?.videoUrl) {
      throw new Error('No video URL in callback data');
    }

    console.log('Video creation completed, URL:', videoInfo.videoUrl);

    // Download video file
    const videoResponse = await fetch(videoInfo.videoUrl);
    const videoBlob = await videoResponse.blob();
    const fileName = `videos/${sunoTaskId}_${Date.now()}.mp4`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('project-assets')
      .upload(fileName, videoBlob, {
        contentType: 'video/mp4',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    const { data: publicData } = supabase.storage
      .from('project-assets')
      .getPublicUrl(fileName);

    const localVideoUrl = publicData.publicUrl;

    console.log('Video file saved:', localVideoUrl);

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: videoInfo.userId || 'system',
        type: 'track_generated',
        title: 'Музыкальное видео готово 🎬',
        message: 'Ваше музыкальное видео успешно создано',
        action_url: localVideoUrl,
      });

    return new Response(
      JSON.stringify({ success: true, videoUrl: localVideoUrl }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in suno-video-callback:', error);
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
