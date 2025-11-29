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

    const { taskId } = await req.json();

    if (!taskId) {
      throw new Error('taskId is required');
    }

    // Find the generation task
    const { data: task, error: taskError } = await supabase
      .from('generation_tasks')
      .select('*, tracks(*)')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single();

    if (taskError || !task) {
      throw new Error('Task not found');
    }

    const sunoTaskId = task.suno_task_id;

    if (!sunoTaskId) {
      throw new Error('No Suno task ID found');
    }

    console.log('Checking status for Suno task:', sunoTaskId);

    // Query Suno API for task status using correct endpoint
    const sunoResponse = await fetch(`https://api.sunoapi.org/api/get?ids=${sunoTaskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sunoApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const sunoData = await sunoResponse.json();

    if (!sunoResponse.ok || sunoData.code !== 'success') {
      console.error('SunoAPI query error:', sunoData);
      throw new Error(sunoData.message || 'Failed to query Suno API');
    }

    const trackId = task.track_id;
    const audioData = sunoData.data || [];
    const firstClip = audioData[0];

    // Check if generation is complete
    if (firstClip && firstClip.status === 'SUCCESS') {
      console.log('Task completed, updating records');

      // Download audio file
      let localAudioUrl = null;
      let localCoverUrl = null;

      try {
        // Download and save audio to storage
        const audioResponse = await fetch(firstClip.audio_url);
        const audioBlob = await audioResponse.blob();
        const audioFileName = `${trackId}_${Date.now()}.mp3`;
        
        const { data: audioUpload, error: audioError } = await supabase.storage
          .from('project-assets')
          .upload(`tracks/${audioFileName}`, audioBlob, {
            contentType: 'audio/mpeg',
            upsert: true,
          });

        if (!audioError && audioUpload) {
          const { data: publicData } = supabase.storage
            .from('project-assets')
            .getPublicUrl(`tracks/${audioFileName}`);
          localAudioUrl = publicData.publicUrl;
        }

        // Download and save cover image
        if (firstClip.image_url) {
          const coverResponse = await fetch(firstClip.image_url);
          const coverBlob = await coverResponse.blob();
          const coverFileName = `${trackId}_cover_${Date.now()}.jpg`;
          
          const { data: coverUpload, error: coverError } = await supabase.storage
            .from('project-assets')
            .upload(`covers/${coverFileName}`, coverBlob, {
              contentType: 'image/jpeg',
              upsert: true,
            });

          if (!coverError && coverUpload) {
            const { data: publicData } = supabase.storage
              .from('project-assets')
              .getPublicUrl(`covers/${coverFileName}`);
            localCoverUrl = publicData.publicUrl;
          }
        }
      } catch (downloadError) {
        console.error('Error downloading files:', downloadError);
      }

      // Update track with complete data
      await supabase
        .from('tracks')
        .update({
          status: 'completed',
          audio_url: firstClip.audio_url,
          streaming_url: firstClip.audio_url,
          local_audio_url: localAudioUrl,
          cover_url: firstClip.image_url || task.tracks.cover_url,
          local_cover_url: localCoverUrl,
          title: firstClip.title || task.tracks.title,
          duration_seconds: firstClip.duration || null,
          tags: firstClip.tags || task.tracks.tags,
          lyrics: firstClip.metadata?.prompt || task.tracks.lyrics,
        })
        .eq('id', trackId);

      // Update generation task
      await supabase
        .from('generation_tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          audio_clips: JSON.stringify(audioData),
        })
        .eq('id', task.id);

      // Create track version
      await supabase
        .from('track_versions')
        .insert({
          track_id: trackId,
          audio_url: firstClip.audio_url,
          cover_url: firstClip.image_url,
          duration_seconds: firstClip.duration,
          version_type: 'original',
          is_primary: true,
        });

      // Log completion
      await supabase
        .from('track_change_log')
        .insert({
          track_id: trackId,
          user_id: task.user_id,
          change_type: 'generation_completed',
          changed_by: 'manual_check',
          metadata: {
            clips: audioData.length,
            duration: firstClip.duration,
          },
        });

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: task.user_id,
          type: 'track_generated',
          title: 'Трек готов! 🎵',
          message: `Ваш трек "${firstClip.title || 'Без названия'}" успешно сгенерирован`,
          action_url: `/library`,
        });

      return new Response(
        JSON.stringify({ 
          success: true, 
          status: 'completed',
          track: firstClip,
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } else if (firstClip && firstClip.status === 'FAILED') {
      // Generation failed
      const errorMessage = firstClip.metadata?.error_message || 'Generation failed';

      await supabase
        .from('generation_tasks')
        .update({
          status: 'failed',
          error_message: errorMessage,
        })
        .eq('id', task.id);

      await supabase
        .from('tracks')
        .update({
          status: 'failed',
          error_message: errorMessage,
        })
        .eq('id', trackId);

      return new Response(
        JSON.stringify({ 
          success: true, 
          status: 'failed',
          error: errorMessage,
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } else {
      // Still processing
      return new Response(
        JSON.stringify({ 
          success: true, 
          status: 'processing',
          progress: firstClip?.status || 'queued',
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

  } catch (error: any) {
    console.error('Error in suno-check-status:', error);
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
