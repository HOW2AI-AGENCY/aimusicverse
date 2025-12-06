import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to get audio/image URLs - Suno API uses snake_case
const getAudioUrl = (clip: any) => clip.source_audio_url || clip.audio_url;
const getStreamUrl = (clip: any) => clip.source_stream_audio_url || clip.stream_audio_url;
const getImageUrl = (clip: any) => clip.source_image_url || clip.image_url;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    console.log('📥 Callback from SunoAPI:', JSON.stringify(payload, null, 2));

    const { code, msg, data } = payload;
    const { callbackType, taskId, task_id, data: audioData } = data || {};
    const sunoTaskId = taskId || task_id;

    if (!sunoTaskId) {
      throw new Error('No taskId in callback');
    }

    const { data: task, error: taskError } = await supabase
      .from('generation_tasks')
      .select('*, tracks(*)')
      .eq('suno_task_id', sunoTaskId)
      .single();

    if (taskError || !task) {
      console.error('❌ Task not found:', sunoTaskId, taskError);
      throw new Error('Task not found');
    }

    const trackId = task.track_id;
    console.log(`📋 Task: ${task.id}, track: ${trackId}, type: ${callbackType}`);

    if (code !== 200) {
      console.error('❌ SunoAPI failed:', msg);
      await supabase.from('generation_tasks').update({
        status: 'failed',
        error_message: msg || 'Generation failed',
        callback_received_at: new Date().toISOString(),
      }).eq('id', task.id);

      await supabase.from('tracks').update({
        status: 'failed',
        error_message: msg || 'Generation failed',
      }).eq('id', trackId);

      return new Response(JSON.stringify({ success: true, status: 'failed' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (callbackType === 'first') {
      console.log('🎵 First clip ready for streaming');
      const firstClip = audioData?.[0];
      if (firstClip) {
        const streamUrl = getStreamUrl(firstClip);
        const imageUrl = getImageUrl(firstClip);
        
        console.log('📊 First clip:', { id: firstClip.id, title: firstClip.title, streamUrl: !!streamUrl, imageUrl: !!imageUrl });

        if (streamUrl) {
          await supabase.from('tracks').update({
            status: 'streaming_ready',
            streaming_url: streamUrl,
            cover_url: imageUrl || null,
            title: firstClip.title || task.tracks?.title,
          }).eq('id', trackId);

          const { data: existingVersion } = await supabase
            .from('track_versions')
            .select('id')
            .eq('track_id', trackId)
            .eq('version_label', 'A')
            .single();

          if (!existingVersion) {
            const { data: newVersion } = await supabase.from('track_versions').insert({
              track_id: trackId,
              audio_url: streamUrl,
              cover_url: imageUrl,
              version_type: 'initial',
              version_label: 'A',
              clip_index: 0,
              is_primary: true,
              metadata: { suno_id: firstClip.id, suno_task_id: sunoTaskId, title: firstClip.title, status: 'streaming' },
            }).select().single();

            if (newVersion) {
              await supabase.from('tracks').update({ active_version_id: newVersion.id }).eq('id', trackId);
              console.log('✅ Version A created:', newVersion.id);
            }
          }

          await supabase.from('generation_tasks').update({
            audio_clips: JSON.stringify([firstClip]),
            received_clips: 1,
          }).eq('id', task.id);
        }
      }

    } else if (callbackType === 'complete') {
      console.log('🎉 Complete! Clips:', audioData?.length);
      const clips = audioData || [];
      
      if (clips.length === 0) throw new Error('No audio clips in completion callback');

      const versionLabels = ['A', 'B', 'C', 'D', 'E'];
      let trackTitle = '';

      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        const versionLabel = versionLabels[i] || `V${i + 1}`;
        const audioUrl = getAudioUrl(clip);
        const streamUrl = getStreamUrl(clip);
        
        console.log(`💾 Clip ${i + 1}/${clips.length} (${versionLabel}):`, { 
          id: clip.id, duration: clip.duration, audioUrl: !!audioUrl 
        });

        if (!audioUrl) {
          console.error(`❌ No audio URL for clip ${i}`);
          continue;
        }

        let localAudioUrl = null;

        try {
          const audioResponse = await fetch(audioUrl);
          if (audioResponse.ok) {
            const audioBlob = await audioResponse.blob();
            const audioFileName = `tracks/${task.user_id}/${trackId}_v${versionLabel}_${Date.now()}.mp3`;
            const { data: audioUpload } = await supabase.storage
              .from('project-assets')
              .upload(audioFileName, audioBlob, { contentType: 'audio/mpeg', upsert: true });
            if (audioUpload) {
              localAudioUrl = supabase.storage.from('project-assets').getPublicUrl(audioFileName).data.publicUrl;
              console.log(`✅ Audio uploaded: ${versionLabel}`);
            }
          }
        } catch (e) {
          console.error(`❌ Download error for clip ${i}:`, e);
        }

        trackTitle = clip.title || task.prompt?.split('\n')[0]?.substring(0, 100) || 'Трек';
        const finalAudioUrl = localAudioUrl || audioUrl;

        const { data: existingVersion } = await supabase
          .from('track_versions')
          .select('id')
          .eq('track_id', trackId)
          .eq('version_label', versionLabel)
          .single();

        const versionData = {
          audio_url: finalAudioUrl,
          cover_url: null, // Will be set by generate-track-cover
          duration_seconds: Math.round(clip.duration) || null,
          metadata: {
            suno_id: clip.id, suno_task_id: sunoTaskId, clip_index: i,
            title: trackTitle, tags: clip.tags, lyrics: clip.prompt,
            model_name: clip.model_name, prompt: task.prompt,
            local_storage: { audio: localAudioUrl },
            status: 'completed',
          },
        };

        if (existingVersion) {
          await supabase.from('track_versions').update(versionData).eq('id', existingVersion.id);
          console.log(`✅ Version ${versionLabel} updated`);
        } else {
          const { data: newVersion } = await supabase.from('track_versions').insert({
            track_id: trackId,
            ...versionData,
            version_type: 'initial',
            version_label: versionLabel,
            clip_index: i,
            is_primary: i === 0,
          }).select().single();

          if (newVersion && i === 0) {
            await supabase.from('tracks')
              .update({ active_version_id: newVersion.id })
              .eq('id', trackId)
              .is('active_version_id', null);
          }
          console.log(`✅ Version ${versionLabel} created`);
        }

        if (i === 0) {
          console.log(`📝 Updating main track (without cover - will be generated)...`);
          await supabase.from('tracks').update({
            status: 'completed',
            audio_url: finalAudioUrl,
            streaming_url: streamUrl || finalAudioUrl,
            local_audio_url: localAudioUrl,
            title: trackTitle,
            duration_seconds: Math.round(clip.duration) || null,
            tags: clip.tags || task.tracks?.tags,
            lyrics: clip.prompt || task.tracks?.lyrics,
            suno_id: clip.id,
            model_name: clip.model_name || 'chirp-v4',
            suno_task_id: sunoTaskId,
          }).eq('id', trackId);
          console.log('✅ Main track updated');
        }

        await supabase.from('track_change_log').insert({
          track_id: trackId, user_id: task.user_id, change_type: 'version_created',
          changed_by: 'suno_api', ai_model_used: clip.model_name || 'chirp-v4',
          prompt_used: task.prompt, new_value: versionLabel,
          metadata: { version_label: versionLabel, clip_index: i, suno_clip_id: clip.id, title: trackTitle },
        });
      }

      // Generate custom MusicVerse cover (one cover for all versions)
      console.log('🎨 Generating MusicVerse cover...');
      try {
        const { error: coverError } = await supabase.functions.invoke('generate-track-cover', {
          body: {
            trackId,
            title: trackTitle,
            style: task.tracks?.style || clips[0]?.tags || '',
            lyrics: clips[0]?.prompt || task.prompt || '',
            userId: task.user_id,
          },
        });
        
        if (coverError) {
          console.error('❌ Cover generation error:', coverError);
        } else {
          console.log('✅ MusicVerse cover generated');
        }
      } catch (coverErr) {
        console.error('❌ Cover generation invoke error:', coverErr);
      }

      await supabase.from('generation_tasks').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        callback_received_at: new Date().toISOString(),
        audio_clips: JSON.stringify(clips),
        received_clips: clips.length,
      }).eq('id', task.id);

      if (task.telegram_chat_id && clips.length > 0) {
        // Wait for cover generation to complete
        console.log('⏳ Waiting for cover generation to complete...');
        await new Promise(resolve => setTimeout(resolve, 6000));
        
        // Fetch fresh track data with generated cover
        const { data: freshTrackData, error: freshTrackError } = await supabase
          .from('tracks')
          .select('title, style, cover_url, local_cover_url, tags')
          .eq('id', trackId)
          .single();
        
        console.log('📸 Fresh track data:', {
          title: freshTrackData?.title,
          cover_url: freshTrackData?.cover_url?.substring(0, 80),
          local_cover_url: freshTrackData?.local_cover_url?.substring(0, 80),
          error: freshTrackError
        });
        
        // Use our generated cover (local_cover_url) - NOT Suno's cover
        const generatedCoverUrl = freshTrackData?.local_cover_url || freshTrackData?.cover_url;
        
        // Get track title
        let notifyTitle = freshTrackData?.title || clips[0]?.title;
        if (!notifyTitle || notifyTitle === 'Untitled' || notifyTitle === 'Трек') {
          const promptLines = (task.prompt || '').split('\n').filter((line: string) => line.trim().length > 0);
          if (promptLines.length > 0) {
            notifyTitle = promptLines[0].substring(0, 60).trim().replace(/^(create|generate|make)\s+/i, '');
          } else {
            notifyTitle = 'AI Music Track';
          }
        }
        
        // Send both versions in a single notification using media group type
        const maxClipsToSend = Math.min(clips.length, 2);
        console.log(`📤 Sending ${maxClipsToSend} track version(s) as media group to Telegram chat: ${task.telegram_chat_id}`);
        
        // Prepare all audio clips data
        const audioClipsData = [];
        for (let i = 0; i < maxClipsToSend; i++) {
          const clip = clips[i];
          const versionLabel = ['A', 'B', 'C', 'D', 'E'][i] || `V${i + 1}`;
          audioClipsData.push({
            audioUrl: getAudioUrl(clip),
            title: `${notifyTitle} (${versionLabel})`,
            duration: clip.duration,
            versionLabel,
          });
        }
        
        try {
          const { error: notifyError } = await supabase.functions.invoke('send-telegram-notification', {
            body: {
              type: 'generation_complete_multi',
              chatId: task.telegram_chat_id,
              trackId,
              coverUrl: generatedCoverUrl,
              title: notifyTitle,
              audioClips: audioClipsData,
              tags: freshTrackData?.tags || clips[0]?.tags,
              style: freshTrackData?.style || task.tracks?.style,
              versionsCount: clips.length,
            },
          });
          
          if (notifyError) {
            console.error('❌ Telegram multi notification error:', notifyError);
            // Fallback to single notifications
            for (let i = 0; i < maxClipsToSend; i++) {
              const clip = audioClipsData[i];
              await supabase.functions.invoke('send-telegram-notification', {
                body: {
                  type: 'generation_complete',
                  chatId: task.telegram_chat_id,
                  trackId,
                  audioUrl: clip.audioUrl,
                  coverUrl: generatedCoverUrl,
                  title: clip.title,
                  duration: clip.duration,
                  tags: freshTrackData?.tags || clips[0]?.tags,
                  style: freshTrackData?.style,
                  versionLabel: clip.versionLabel,
                  currentVersion: i + 1,
                  totalVersions: maxClipsToSend,
                },
              });
              if (i < maxClipsToSend - 1) await new Promise(r => setTimeout(r, 1000));
            }
          } else {
            console.log('✅ Telegram multi notification sent');
          }
        } catch (err) {
          console.error('❌ Telegram invoke error:', err);
        }
      } else {
        console.log(`ℹ️ No Telegram notification: chat_id=${task.telegram_chat_id}, clips=${clips.length}`);
      }

      const versionText = clips.length > 1 ? ` (${clips.length} версии)` : '';
      await supabase.from('notifications').insert({
        user_id: task.user_id, type: 'track_generated',
        title: 'Генерация завершена 🎵', message: `Ваш трек готов${versionText}`,
        action_url: '/library',
      });
    }

    return new Response(JSON.stringify({ success: true, callbackType }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

  } catch (error: any) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message || 'Unknown error' }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});