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
      // First clip ready - update with streaming URL and create version A
      console.log('First clip ready for streaming');
      
      const firstClip = audioData?.[0];
      if (firstClip?.sourceStreamAudioUrl || firstClip?.streamAudioUrl) {
        // Update track status
        await supabase
          .from('tracks')
          .update({
            status: 'streaming_ready',
            streaming_url: firstClip.sourceStreamAudioUrl || firstClip.streamAudioUrl,
            cover_url: firstClip.sourceImageUrl || firstClip.imageUrl || null,
            title: firstClip.title || task.tracks?.title,
          })
          .eq('id', trackId);

        // Create version A with clip_index 0
        const versionLabel = 'A';
        
        // Check if version A already exists
        const { data: existingVersion } = await supabase
          .from('track_versions')
          .select('id')
          .eq('track_id', trackId)
          .eq('version_label', versionLabel)
          .single();

        if (!existingVersion) {
          const { data: newVersion, error: versionError } = await supabase
            .from('track_versions')
            .insert({
              track_id: trackId,
              audio_url: firstClip.sourceStreamAudioUrl || firstClip.streamAudioUrl,
              cover_url: firstClip.sourceImageUrl || firstClip.imageUrl,
              duration_seconds: null, // Will be updated on complete
              version_type: 'initial',
              version_label: versionLabel,
              clip_index: 0,
              is_primary: true,
              metadata: {
                suno_id: firstClip.id,
                suno_task_id: sunoTaskId,
                title: firstClip.title,
                status: 'streaming',
              },
            })
            .select()
            .single();

          if (versionError) {
            console.error('Error creating version A:', versionError);
          } else {
            // Set as active version
            await supabase
              .from('tracks')
              .update({ active_version_id: newVersion?.id })
              .eq('id', trackId);

            console.log('✅ Version A created:', newVersion?.id);
          }
        }

        // Update task
        await supabase
          .from('generation_tasks')
          .update({
            audio_clips: JSON.stringify([firstClip]),
            received_clips: 1,
          })
          .eq('id', task.id);
      }

    } else if (callbackType === 'complete') {
      // All clips ready - create/update versions A and B
      console.log('All clips completed, processing versions:', audioData?.length);

      const clips = audioData || [];
      
      if (clips.length === 0) {
        throw new Error('No audio clips in completion callback');
      }

      const createdVersions: { versionId: string; label: string; clipIndex: number }[] = [];
      const versionLabels = ['A', 'B', 'C', 'D', 'E']; // Support up to 5 versions

      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        const versionLabel = versionLabels[i] || `V${i + 1}`;
        
        console.log(`💾 Processing clip ${i + 1}/${clips.length} as version ${versionLabel}:`, {
          id: clip.id,
          title: clip.title,
          duration: clip.duration,
        });

        let localAudioUrl = null;
        let localCoverUrl = null;

        try {
          // Download and save audio to storage
          const audioUrl = clip.sourceAudioUrl || clip.audioUrl;
          if (!audioUrl) {
            console.error(`❌ No audio URL for clip ${i}`);
            continue;
          }

          const audioResponse = await fetch(audioUrl);
          if (!audioResponse.ok) {
            console.error(`❌ Failed to fetch audio for clip ${i}: ${audioResponse.status}`);
            continue;
          }
          
          const audioBlob = await audioResponse.blob();
          const audioFileName = `tracks/${task.user_id}/${trackId}_v${versionLabel}_${Date.now()}.mp3`;
          
          const { data: audioUpload, error: audioError } = await supabase.storage
            .from('project-assets')
            .upload(audioFileName, audioBlob, {
              contentType: 'audio/mpeg',
              upsert: true,
            });

          if (audioError) {
            console.error(`❌ Audio upload error for clip ${i}:`, audioError);
          } else if (audioUpload) {
            const { data: publicData } = supabase.storage
              .from('project-assets')
              .getPublicUrl(audioFileName);
            localAudioUrl = publicData.publicUrl;
            console.log(`✅ Audio uploaded for version ${versionLabel}:`, localAudioUrl);
          }

          // Download and save cover image
          const coverUrl = clip.sourceImageUrl || clip.imageUrl;
          if (coverUrl) {
            const coverResponse = await fetch(coverUrl);
            if (coverResponse.ok) {
              const coverBlob = await coverResponse.blob();
              const coverFileName = `covers/${task.user_id}/${trackId}_v${versionLabel}_cover_${Date.now()}.jpg`;
              
              const { data: coverUpload, error: coverError } = await supabase.storage
                .from('project-assets')
                .upload(coverFileName, coverBlob, {
                  contentType: 'image/jpeg',
                  upsert: true,
                });

              if (coverError) {
                console.error(`❌ Cover upload error for clip ${i}:`, coverError);
              } else if (coverUpload) {
                const { data: publicData } = supabase.storage
                  .from('project-assets')
                  .getPublicUrl(coverFileName);
                localCoverUrl = publicData.publicUrl;
              }
            }
          }
        } catch (downloadError) {
          console.error(`❌ Error downloading files for clip ${i}:`, downloadError);
        }

        const trackTitle = clip.title || task.prompt?.split('\n')[0]?.substring(0, 100) || `Трек`;
        const isFirstVersion = i === 0;

        // Check if version already exists (from 'first' callback)
        const { data: existingVersion } = await supabase
          .from('track_versions')
          .select('id')
          .eq('track_id', trackId)
          .eq('version_label', versionLabel)
          .single();

        if (existingVersion) {
          // Update existing version
          await supabase
            .from('track_versions')
            .update({
              audio_url: localAudioUrl || clip.sourceAudioUrl || clip.audioUrl,
              cover_url: localCoverUrl || clip.sourceImageUrl || clip.imageUrl,
              duration_seconds: Math.round(clip.duration) || null,
              metadata: {
                suno_id: clip.id,
                suno_task_id: sunoTaskId,
                clip_index: i,
                title: trackTitle,
                tags: clip.tags,
                lyrics: clip.lyric,
                model_name: clip.modelName,
                prompt: task.prompt,
                local_storage: { audio: localAudioUrl, cover: localCoverUrl },
                status: 'completed',
              },
            })
            .eq('id', existingVersion.id);

          createdVersions.push({ versionId: existingVersion.id, label: versionLabel, clipIndex: i });
          console.log(`✅ Version ${versionLabel} updated:`, existingVersion.id);
        } else {
          // Create new version
          const { data: newVersion, error: versionError } = await supabase
            .from('track_versions')
            .insert({
              track_id: trackId,
              audio_url: localAudioUrl || clip.sourceAudioUrl || clip.audioUrl,
              cover_url: localCoverUrl || clip.sourceImageUrl || clip.imageUrl,
              duration_seconds: Math.round(clip.duration) || null,
              version_type: 'initial',
              version_label: versionLabel,
              clip_index: i,
              is_primary: isFirstVersion,
              metadata: {
                suno_id: clip.id,
                suno_task_id: sunoTaskId,
                clip_index: i,
                title: trackTitle,
                tags: clip.tags,
                lyrics: clip.lyric,
                model_name: clip.modelName,
                prompt: task.prompt,
                local_storage: { audio: localAudioUrl, cover: localCoverUrl },
                status: 'completed',
              },
            })
            .select()
            .single();

          if (versionError) {
            console.error(`❌ Error creating version ${versionLabel}:`, versionError);
          } else if (newVersion) {
            createdVersions.push({ versionId: newVersion.id, label: versionLabel, clipIndex: i });
            console.log(`✅ Version ${versionLabel} created:`, newVersion.id);

            // Set first version as active if not already set
            if (isFirstVersion) {
              await supabase
                .from('tracks')
                .update({ active_version_id: newVersion.id })
                .eq('id', trackId)
                .is('active_version_id', null);
            }
          }
        }

        // Update main track with first clip data
        if (isFirstVersion) {
          await supabase
            .from('tracks')
            .update({
              status: 'completed',
              audio_url: localAudioUrl || clip.sourceAudioUrl || clip.audioUrl,
              streaming_url: clip.sourceStreamAudioUrl || clip.streamAudioUrl || clip.sourceAudioUrl || clip.audioUrl,
              local_audio_url: localAudioUrl,
              cover_url: localCoverUrl || clip.sourceImageUrl || clip.imageUrl || task.tracks?.cover_url,
              local_cover_url: localCoverUrl,
              title: trackTitle,
              duration_seconds: Math.round(clip.duration) || null,
              tags: clip.tags || task.tracks?.tags,
              lyrics: clip.lyric || task.tracks?.lyrics,
              suno_id: clip.id,
              model_name: clip.modelName || 'chirp-v4',
              suno_task_id: sunoTaskId,
            })
            .eq('id', trackId);
        }

        // Log version creation
        await supabase
          .from('track_change_log')
          .insert({
            track_id: trackId,
            user_id: task.user_id,
            change_type: 'version_created',
            changed_by: 'suno_api',
            ai_model_used: clip.modelName || 'chirp-v4',
            prompt_used: task.prompt,
            new_value: versionLabel,
            metadata: {
              version_label: versionLabel,
              clip_index: i,
              suno_clip_id: clip.id,
              title: trackTitle,
            },
          });
      }

      console.log(`✅ Total versions created: ${createdVersions.length}/${clips.length}`);

      // Update generation task
      await supabase
        .from('generation_tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          callback_received_at: new Date().toISOString(),
          audio_clips: JSON.stringify(clips),
          received_clips: clips.length,
        })
        .eq('id', task.id);

      // Send telegram notification
      if (task.telegram_chat_id && clips.length > 0) {
        const firstClip = clips[0];
        const trackTitle = firstClip.title || task.prompt?.split('\n')[0]?.substring(0, 100) || 'Трек';
        
        console.log(`📱 Sending Telegram notification to chat ${task.telegram_chat_id}`);
        
        supabase.functions.invoke('send-telegram-notification', {
          body: {
            type: 'generation_complete',
            chatId: task.telegram_chat_id,
            trackId: trackId,
            audioUrl: firstClip.sourceAudioUrl || firstClip.audioUrl,
            coverUrl: firstClip.sourceImageUrl || firstClip.imageUrl,
            title: trackTitle,
            duration: firstClip.duration,
            tags: firstClip.tags,
            style: firstClip.tags,
            versionsCount: clips.length,
            generationMode: task.generation_mode,
          },
        }).catch(err => console.error('Error sending to Telegram:', err));
      }

      // Create notification
      const firstClip = clips[0];
      const versionText = clips.length > 1 
        ? ` (${clips.length} версии: ${versionLabels.slice(0, clips.length).join('/')})` 
        : '';
      
      await supabase
        .from('notifications')
        .insert({
          user_id: task.user_id,
          type: 'track_generated',
          title: `Генерация завершена 🎵`,
          message: `Ваш трек готов${versionText}`,
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
