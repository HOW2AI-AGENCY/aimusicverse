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
    // Support both taskId and task_id formats from API
    const { callbackType, taskId, task_id, data: audioData } = data || {};
    const sunoTaskId = taskId || task_id;

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
      // Use source URLs which are permanent, not the temporary audioUrl
      if (firstClip?.sourceStreamAudioUrl || firstClip?.streamAudioUrl) {
        await supabase
          .from('tracks')
          .update({
            status: 'streaming_ready',
            streaming_url: firstClip.sourceStreamAudioUrl || firstClip.streamAudioUrl,
            cover_url: firstClip.sourceImageUrl || firstClip.imageUrl || null,
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
      console.log('All clips completed, processing all tracks:', audioData?.length);

      const clips = audioData || [];
      
      if (clips.length === 0) {
        throw new Error('No audio clips in completion callback');
      }

      // Process BOTH tracks from Suno API
      const savedTracks = [];
      
      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        const isFirstTrack = i === 0;
        const currentTrackId = isFirstTrack ? trackId : null;
        
        let localAudioUrl = null;
        let localCoverUrl = null;

        try {
          // Download and save audio to storage - use source_audio_url which is permanent
          const audioUrl = clip.sourceAudioUrl || clip.audioUrl;
          if (!audioUrl) {
            throw new Error('No audio URL available');
          }

          const audioResponse = await fetch(audioUrl);
          const audioBlob = await audioResponse.blob();
          const audioFileName = `${currentTrackId || clip.id}_${Date.now()}.mp3`;
          
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

          // Download and save cover image - use source_image_url
          const coverUrl = clip.sourceImageUrl || clip.imageUrl;
          if (coverUrl) {
            const coverResponse = await fetch(coverUrl);
            const coverBlob = await coverResponse.blob();
            const coverFileName = `${currentTrackId || clip.id}_cover_${Date.now()}.jpg`;
            
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
          console.error(`Error downloading files for track ${i}:`, downloadError);
        }

        // For first track, update existing record
        if (isFirstTrack) {
          await supabase
            .from('tracks')
            .update({
              status: 'completed',
              audio_url: clip.sourceAudioUrl || clip.audioUrl,
              streaming_url: clip.sourceStreamAudioUrl || clip.streamAudioUrl || clip.sourceAudioUrl || clip.audioUrl,
              local_audio_url: localAudioUrl,
              cover_url: clip.sourceImageUrl || clip.imageUrl || task.tracks.cover_url,
              local_cover_url: localCoverUrl,
              title: clip.title || task.tracks.title,
              duration_seconds: clip.duration || null,
              tags: clip.tags || task.tracks.tags,
              lyrics: clip.lyric || task.tracks.lyrics,
              suno_id: clip.id,
            })
            .eq('id', trackId);

          savedTracks.push({ id: trackId, clip });

          // Create track version
          await supabase
            .from('track_versions')
            .insert({
              track_id: trackId,
              audio_url: clip.sourceAudioUrl || clip.audioUrl,
              cover_url: clip.sourceImageUrl || clip.imageUrl,
              duration_seconds: clip.duration,
              version_type: 'original',
              is_primary: true,
            });
        } else {
          // For second track, create new record
          const { data: newTrack, error: newTrackError } = await supabase
            .from('tracks')
            .insert({
              user_id: task.user_id,
              project_id: task.tracks.project_id,
              status: 'completed',
              audio_url: clip.sourceAudioUrl || clip.audioUrl,
              streaming_url: clip.sourceStreamAudioUrl || clip.streamAudioUrl || clip.sourceAudioUrl || clip.audioUrl,
              local_audio_url: localAudioUrl,
              cover_url: clip.sourceImageUrl || clip.imageUrl,
              local_cover_url: localCoverUrl,
              title: clip.title,
              duration_seconds: clip.duration || null,
              tags: clip.tags,
              lyrics: clip.lyric,
              suno_id: clip.id,
              suno_task_id: sunoTaskId,
              prompt: task.prompt,
              style: task.tracks.style,
              has_vocals: task.tracks.has_vocals,
              provider: 'suno',
              suno_model: task.model_used,
              generation_mode: task.generation_mode,
            })
            .select()
            .single();

          if (!newTrackError && newTrack) {
            savedTracks.push({ id: newTrack.id, clip });

            // Create track version for second track
            await supabase
              .from('track_versions')
              .insert({
                track_id: newTrack.id,
                audio_url: clip.sourceAudioUrl || clip.audioUrl,
                cover_url: clip.sourceImageUrl || clip.imageUrl,
                duration_seconds: clip.duration,
                version_type: 'original',
                is_primary: true,
              });

            // Log creation of second track
            await supabase
              .from('track_change_log')
              .insert({
                track_id: newTrack.id,
                user_id: task.user_id,
                change_type: 'generation_completed',
                changed_by: 'suno_api',
                metadata: {
                  clip_index: i,
                  suno_task_id: sunoTaskId,
                },
              });
          }
        }
      }

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

      // Log completion for first track
      await supabase
        .from('track_change_log')
        .insert({
          track_id: trackId,
          user_id: task.user_id,
          change_type: 'generation_completed',
          changed_by: 'suno_api',
          metadata: {
            total_clips: clips.length,
            saved_tracks: savedTracks.length,
          },
        });

      // Send telegram notification with audio (fire and forget)
      if (task.telegram_chat_id && savedTracks.length > 0) {
        const firstSaved = savedTracks[0];
        supabase.functions.invoke('suno-send-audio', {
          body: {
            chatId: task.telegram_chat_id,
            trackId: firstSaved.id,
            audioUrl: firstSaved.clip.sourceAudioUrl || firstSaved.clip.audioUrl,
            coverUrl: firstSaved.clip.sourceImageUrl || firstSaved.clip.imageUrl,
            title: firstSaved.clip.title,
            duration: firstSaved.clip.duration,
          },
        }).catch(err => console.error('Error sending audio to Telegram:', err));
      }

      // Create notification
      const firstClip = clips[0];
      const generationModeText = task.generation_mode === 'upload_cover' 
        ? 'Кавер создан' 
        : task.generation_mode === 'upload_extend' 
          ? 'Расширение завершено'
          : task.generation_mode === 'add_vocals'
            ? 'Вокал добавлен'
            : task.generation_mode === 'add_instrumental'
              ? 'Инструментал добавлен'
              : 'Генерация завершена';
      
      const notificationMessage = clips.length === 1
        ? `Ваш трек "${firstClip.title || 'Без названия'}" готов`
        : `Ваши треки "${firstClip.title || 'Без названия'}" и еще ${clips.length - 1} готовы`;
      
      await supabase
        .from('notifications')
        .insert({
          user_id: task.user_id,
          type: 'track_generated',
          title: `${generationModeText} 🎵`,
          message: notificationMessage,
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