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
    console.log('Received callback from SunoAPI:', JSON.stringify(payload, null, 2));

    const { code, msg, data } = payload;
    const { callbackType, taskId: sunoTaskId, data: audioData } = data || {};

    if (!sunoTaskId) {
      throw new Error('No taskId in callback');
    }

    // Find the generation task
    const { data: task, error: taskError } = await supabase
      .from('generation_tasks')
      .select('*, tracks(*)')
      .eq('suno_task_id', sunoTaskId)
      .single();

    if (taskError || !task) {
      console.error('Task not found:', sunoTaskId, taskError);
      throw new Error('Task not found');
    }

    const trackId = task.track_id;

    if (code !== 200) {
      // Generation failed
      console.error('SunoAPI generation failed:', msg);

      await supabase
        .from('generation_tasks')
        .update({
          status: 'failed',
          error_message: msg || 'Generation failed',
          callback_received_at: new Date().toISOString(),
        })
        .eq('id', task.id);

      await supabase
        .from('tracks')
        .update({
          status: 'failed',
          error_message: msg || 'Generation failed',
        })
        .eq('id', trackId);

      // Send telegram notification if available
      if (task.telegram_chat_id) {
        await supabase.functions.invoke('suno-send-audio', {
          body: {
            chatId: task.telegram_chat_id,
            trackId,
            status: 'failed',
            errorMessage: msg,
          },
        });
      }

      return new Response(
        JSON.stringify({ success: true, status: 'failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle different callback stages
    if (callbackType === 'first') {
      // First clip ready - update with streaming URL
      console.log('First clip ready for streaming');
      
      const firstClip = audioData?.[0];
      if (firstClip?.audioUrl) {
        await supabase
          .from('tracks')
          .update({
            status: 'streaming_ready',
            streaming_url: firstClip.audioUrl,
            cover_url: firstClip.imageUrl || null,
            title: firstClip.title || task.tracks.title,
            audio_clips: JSON.stringify([firstClip]),
          })
          .eq('id', trackId);

        await supabase
          .from('generation_tasks')
          .update({
            audio_clips: JSON.stringify([firstClip]),
          })
          .eq('id', task.id);
      }

    } else if (callbackType === 'complete') {
      // Both clips ready - download and save to storage
      console.log('All clips completed');

      const clips = audioData || [];
      const firstClip = clips[0];

      if (!firstClip) {
        throw new Error('No audio clips in completion callback');
      }

      // Download audio file
      let localAudioUrl = null;
      let localCoverUrl = null;

      try {
        // Download and save audio to storage
        const audioResponse = await fetch(firstClip.audioUrl);
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
        if (firstClip.imageUrl) {
          const coverResponse = await fetch(firstClip.imageUrl);
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
          audio_url: firstClip.audioUrl,
          streaming_url: firstClip.audioUrl,
          local_audio_url: localAudioUrl,
          cover_url: firstClip.imageUrl || task.tracks.cover_url,
          local_cover_url: localCoverUrl,
          title: firstClip.title || task.tracks.title,
          duration_seconds: firstClip.duration || null,
          tags: firstClip.tags || task.tracks.tags,
          lyrics: firstClip.lyric || task.tracks.lyrics,
        })
        .eq('id', trackId);

      // Update generation task
      await supabase
        .from('generation_tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          callback_received_at: new Date().toISOString(),
          audio_clips: JSON.stringify(clips),
        })
        .eq('id', task.id);

      // Create track version
      await supabase
        .from('track_versions')
        .insert({
          track_id: trackId,
          audio_url: firstClip.audioUrl,
          cover_url: firstClip.imageUrl,
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
          changed_by: 'suno_api',
          metadata: {
            clips: clips.length,
            duration: firstClip.duration,
          },
        });

      // Send telegram notification with audio (fire and forget)
      if (task.telegram_chat_id) {
        supabase.functions.invoke('suno-send-audio', {
          body: {
            chatId: task.telegram_chat_id,
            trackId,
            audioUrl: localAudioUrl || firstClip.audioUrl,
            coverUrl: localCoverUrl || firstClip.imageUrl,
            title: firstClip.title,
            duration: firstClip.duration,
          },
        }).catch(err => console.error('Error sending audio to Telegram:', err));
      }

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
    }

    return new Response(
      JSON.stringify({ success: true, callbackType }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in suno-music-callback:', error);
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