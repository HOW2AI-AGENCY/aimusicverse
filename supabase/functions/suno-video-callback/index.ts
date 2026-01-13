import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from '../_shared/supabase-client.ts';
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
    const supabase = getSupabaseClient();

    const payload = await req.json();
    console.log('🎬 Received video generation callback:', JSON.stringify(payload, null, 2));

    const { code, msg, data } = payload;
    const videoTaskId = data?.task_id || data?.taskId;
    const videoUrl = data?.video_url;

    if (!videoTaskId) {
      console.error('❌ Missing task_id in callback');
      throw new Error('Missing task_id in callback');
    }

    console.log('🔍 Looking up video task:', videoTaskId);

    // Find video task
    const { data: videoTask, error: taskError } = await supabase
      .from('video_generation_tasks')
      .select('*, tracks(*)')
      .eq('video_task_id', videoTaskId)
      .single();

    if (taskError || !videoTask) {
      console.error('❌ Video task not found:', taskError);
      throw new Error(`Video task not found: ${videoTaskId}`);
    }

    const track = videoTask.tracks;
    if (!track) {
      throw new Error('Associated track not found');
    }

    console.log('✅ Found track:', track.id, 'for video task:', videoTaskId);

    // Handle failure
    if (!isSunoSuccessCode(code)) {
      console.error('❌ Video generation failed:', msg);

      await supabase
        .from('video_generation_tasks')
        .update({
          status: 'failed',
          error_message: msg || 'Video generation failed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', videoTask.id);

      await supabase.from('track_change_log').insert({
        track_id: track.id,
        user_id: videoTask.user_id,
        change_type: 'video_generation_failed',
        changed_by: 'suno_api',
        metadata: { error: msg, video_task_id: videoTaskId },
      });

      // Create failure notification with auto-replace via group_key
      await supabase.from('notifications').insert({
        user_id: videoTask.user_id,
        type: 'video_failed',
        title: 'Ошибка генерации видео 🎬',
        message: `Не удалось создать видео для "${track.title || 'Трек'}": ${msg || 'Неизвестная ошибка'}`,
        action_url: '/library',
        group_key: `video_${videoTaskId}`,
        metadata: { videoTaskId, trackId: track.id, error: msg },
        priority: 7,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      });

      return new Response(
        JSON.stringify({ success: true, status: 'failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!videoUrl) {
      throw new Error('No video_url in successful callback');
    }

    console.log('🎥 Video URL received:', videoUrl);

    // Download and save video to storage
    let localVideoUrl = videoUrl;
    try {
      console.log('📥 Downloading video file...');
      const response = await fetch(videoUrl);
      if (response.ok) {
        const blob = await response.blob();
        const fileName = `videos/${videoTask.user_id}/${track.id}_${Date.now()}.mp4`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('project-assets')
          .upload(fileName, blob, {
            contentType: 'video/mp4',
            upsert: true,
          });

        if (!uploadError && uploadData) {
          const { data: publicData } = supabase.storage
            .from('project-assets')
            .getPublicUrl(fileName);
          localVideoUrl = publicData.publicUrl;
          console.log('✅ Video uploaded to storage:', localVideoUrl);
        } else {
          console.error('⚠️ Upload error:', uploadError);
        }
      }
    } catch (downloadError) {
      console.error('⚠️ Error downloading video:', downloadError);
      // Use original URL as fallback
    }

    // Update video task
    await supabase
      .from('video_generation_tasks')
      .update({
        status: 'completed',
        video_url: videoUrl,
        local_video_url: localVideoUrl,
        completed_at: new Date().toISOString(),
      })
      .eq('id', videoTask.id);

    // Update track with video URL
    await supabase
      .from('tracks')
      .update({
        video_url: localVideoUrl || videoUrl,
        local_video_url: localVideoUrl,
      })
      .eq('id', track.id);

    // Log completion
    await supabase.from('track_change_log').insert({
      track_id: track.id,
      user_id: videoTask.user_id,
      change_type: 'video_generation_completed',
      changed_by: 'suno_api',
      metadata: {
        video_url: videoUrl,
        local_video_url: localVideoUrl,
        video_task_id: videoTaskId,
      },
    });

    // Create success notification with auto-replace via group_key
    await supabase.from('notifications').insert({
      user_id: videoTask.user_id,
      type: 'video_ready',
      title: 'Видео готово! 🎬',
      message: `Клип для "${track.title || 'Трек'}" успешно создан.`,
      action_url: `/library?track=${track.id}`,
      group_key: `video_${videoTaskId}`,
      metadata: { videoTaskId, trackId: track.id, trackTitle: track.title },
      priority: 8,
    });

    // Send Telegram notification if user has telegram_chat_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('telegram_chat_id, telegram_id')
      .eq('user_id', videoTask.user_id)
      .single();

    const chatId = profile?.telegram_chat_id || profile?.telegram_id;
    
    if (chatId) {
      try {
        console.log('📤 Sending Telegram video notification to chat:', chatId);
        const { error: notifyError } = await supabase.functions.invoke('send-telegram-notification', {
          body: {
            type: 'video_ready',
            chatId: chatId,
            trackId: track.id,
            videoUrl: localVideoUrl || videoUrl,
            title: track.title || 'Видео клип',
            coverUrl: track.cover_url,
          },
        });
        
        if (notifyError) {
          console.error('⚠️ Telegram notification error:', notifyError);
        } else {
          console.log('✅ Telegram notification sent');
        }
      } catch (err) {
        console.error('⚠️ Telegram notification invoke error:', err);
      }
    } else {
      console.log('ℹ️ No Telegram chat ID for user, skipping notification');
    }

    return new Response(
      JSON.stringify({ success: true, video_url: localVideoUrl || videoUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('❌ Error in suno-video-callback:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
