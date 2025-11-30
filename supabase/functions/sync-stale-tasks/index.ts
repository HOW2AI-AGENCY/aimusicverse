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

    console.log('🔄 Starting stale tasks sync...');

    // Find tasks that are stuck in processing/pending for more than 10 minutes
    const { data: staleTasks, error: fetchError } = await supabase
      .from('generation_tasks')
      .select('*, tracks(*)')
      .in('status', ['pending', 'processing'])
      .lt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
      .not('suno_task_id', 'is', null);

    if (fetchError) {
      console.error('Error fetching stale tasks:', fetchError);
      throw fetchError;
    }

    console.log(`📊 Found ${staleTasks?.length || 0} stale tasks`);

    let updatedCount = 0;
    let failedCount = 0;
    let completedCount = 0;

    for (const task of staleTasks || []) {
      try {
        console.log(`\n🔍 Checking task ${task.id} (suno_task_id: ${task.suno_task_id})`);

        // Query Suno API for task status
        const sunoResponse = await fetch(
          `https://api.sunoapi.org/api/v1/generate/record-info?taskId=${task.suno_task_id}`,
          {
            headers: {
              'Authorization': `Bearer ${sunoApiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!sunoResponse.ok) {
          console.error(`❌ Suno API error for task ${task.id}: ${sunoResponse.status}`);
          continue;
        }

        const sunoData = await sunoResponse.json();

        if (sunoData.code !== 200) {
          console.error(`❌ SunoAPI query error for task ${task.id}:`, sunoData.msg);
          
          // Mark as failed if Suno API returns error
          await supabase
            .from('generation_tasks')
            .update({
              status: 'failed',
              error_message: sunoData.msg || 'Suno API error',
              completed_at: new Date().toISOString(),
            })
            .eq('id', task.id);

          if (task.track_id) {
            await supabase
              .from('tracks')
              .update({
                status: 'failed',
                error_message: sunoData.msg || 'Suno API error',
              })
              .eq('id', task.track_id);
          }

          failedCount++;
          continue;
        }

        const taskData = sunoData.data;
        console.log(`📈 Task ${task.id} status:`, taskData.status);

        // Check if generation is complete
        if (taskData.status === 'SUCCESS' && taskData.response?.sunoData && taskData.response.sunoData.length > 0) {
          const clips = taskData.response.sunoData;
          const firstClip = clips[0];
          console.log(`✅ Task ${task.id} completed! Processing clip:`, firstClip.id);

          // Download files
          let localAudioUrl = null;
          let localCoverUrl = null;

          try {
            // Download and save audio
            if (firstClip.audioUrl) {
              const audioResponse = await fetch(firstClip.audioUrl);
              const audioBlob = await audioResponse.blob();
              const audioFileName = `${task.track_id}_${Date.now()}.mp3`;
              
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
            }

            // Download and save cover image
            if (firstClip.imageUrl) {
              const coverResponse = await fetch(firstClip.imageUrl);
              const coverBlob = await coverResponse.blob();
              const coverFileName = `${task.track_id}_cover_${Date.now()}.jpg`;
              
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
            console.error(`⚠️ Error downloading files for task ${task.id}:`, downloadError);
          }

          // Update track
          await supabase
            .from('tracks')
            .update({
              status: 'completed',
              audio_url: firstClip.audioUrl,
              streaming_url: firstClip.audioUrl,
              local_audio_url: localAudioUrl,
              cover_url: firstClip.imageUrl,
              local_cover_url: localCoverUrl,
              title: firstClip.title,
              duration_seconds: firstClip.duration || null,
              tags: firstClip.tags,
              lyrics: firstClip.lyric,
              suno_id: firstClip.id,
            })
            .eq('id', task.track_id);

          // Update generation task
          await supabase
            .from('generation_tasks')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              callback_received_at: new Date().toISOString(),
              audio_clips: clips,
            })
            .eq('id', task.id);

          // Save ALL clips as versions
          console.log(`💾 Saving ${clips.length} versions...`);
          const savedVersions = [];

          for (let i = 0; i < clips.length; i++) {
            const clip = clips[i];
            const isFirstClip = i === 0;
            
            let localAudioUrl = null;
            let localCoverUrl = null;

            try {
              // Download and save audio - use source_audio_url which is permanent
              const audioUrl = clip.sourceAudioUrl || clip.audioUrl;
              if (audioUrl) {
                const audioResponse = await fetch(audioUrl);
                const audioBlob = await audioResponse.blob();
                const audioFileName = `${task.track_id}_v${i + 1}_${Date.now()}.mp3`;
                
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
              }

              // Download and save cover image
              const coverUrl = clip.sourceImageUrl || clip.imageUrl;
              if (coverUrl) {
                const coverResponse = await fetch(coverUrl);
                const coverBlob = await coverResponse.blob();
                const coverFileName = `${task.track_id}_v${i + 1}_cover_${Date.now()}.jpg`;
                
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
              console.error(`⚠️ Error downloading files for version ${i}:`, downloadError);
            }

            // For first clip, update main track record
            if (isFirstClip) {
              await supabase
                .from('tracks')
                .update({
                  status: 'completed',
                  audio_url: clip.audioUrl,
                  streaming_url: clip.audioUrl,
                  local_audio_url: localAudioUrl,
                  cover_url: clip.imageUrl,
                  local_cover_url: localCoverUrl,
                  title: clip.title,
                  duration_seconds: clip.duration || null,
                  tags: clip.tags,
                  lyrics: clip.lyric,
                  suno_id: clip.id,
                })
                .eq('id', task.track_id);
            }

            // Create version for each clip
            const { data: version, error: versionError } = await supabase
              .from('track_versions')
              .insert({
                track_id: task.track_id,
                audio_url: localAudioUrl || clip.audioUrl,
                cover_url: localCoverUrl || clip.imageUrl,
                duration_seconds: clip.duration,
                version_type: isFirstClip ? 'original' : 'alternative',
                is_primary: isFirstClip,
                metadata: {
                  suno_id: clip.id,
                  title: clip.title,
                  tags: clip.tags,
                  lyrics: clip.lyric,
                },
              })
              .select()
              .single();

            if (versionError) {
              console.error(`❌ Error saving version ${i}:`, versionError);
            } else if (version) {
              console.log(`✅ Version ${i} saved:`, version.id);
              savedVersions.push({ versionId: version.id, clip, clipIndex: i });

              // Log version creation
              await supabase.from('track_change_log').insert({
                track_id: task.track_id,
                user_id: task.user_id,
                version_id: version.id,
                change_type: isFirstClip ? 'generation_completed' : 'version_created',
                changed_by: 'auto_sync_stale_tasks',
                metadata: {
                  clip_index: i,
                  suno_clip_id: clip.id,
                  version_type: isFirstClip ? 'original' : 'alternative',
                  auto_synced: true,
                },
              });
            }
          }

          console.log(`✅ Saved ${savedVersions.length}/${clips.length} versions`);

          // Log completion
          await supabase
            .from('track_change_log')
            .insert({
              track_id: task.track_id,
              user_id: task.user_id,
              change_type: 'generation_completed',
              changed_by: 'auto_sync_stale_tasks',
              metadata: {
                clips: clips.length,
                duration: firstClip.duration,
                auto_synced: true,
              },
            });

          // Create notification
          await supabase
            .from('notifications')
            .insert({
              user_id: task.user_id,
              type: 'track_generated',
              title: '🎵 Трек готов!',
              message: `Ваш трек "${firstClip.title || 'Без названия'}" успешно сгенерирован`,
              action_url: `/library`,
            });

          // Send Telegram notification if chat_id exists
          if (task.telegram_chat_id) {
            try {
              await fetch(`${supabaseUrl}/functions/v1/send-telegram-notification`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  task_id: task.id,
                  chat_id: task.telegram_chat_id,
                  status: 'completed',
                  track_id: task.track_id,
                }),
              });
            } catch (notifError) {
              console.error('Error sending Telegram notification:', notifError);
            }
          }

          completedCount++;
        } else if (taskData.status && (taskData.status.includes('FAILED') || taskData.status.includes('ERROR'))) {
          // Mark as failed
          const errorMessage = taskData.errorMessage || 'Generation failed';
          console.log(`❌ Task ${task.id} failed:`, errorMessage);

          await supabase
            .from('generation_tasks')
            .update({
              status: 'failed',
              error_message: errorMessage,
              completed_at: new Date().toISOString(),
            })
            .eq('id', task.id);

          if (task.track_id) {
            await supabase
              .from('tracks')
              .update({
                status: 'failed',
                error_message: errorMessage,
              })
              .eq('id', task.track_id);
          }

          failedCount++;
        } else {
          console.log(`⏳ Task ${task.id} still processing:`, taskData.status);
        }

        updatedCount++;
      } catch (taskError: any) {
        console.error(`❌ Error processing task ${task.id}:`, taskError);
      }
    }

    console.log('\n📊 Sync completed:', {
      checked: staleTasks?.length || 0,
      updated: updatedCount,
      completed: completedCount,
      failed: failedCount,
    });

    return new Response(
      JSON.stringify({
        success: true,
        checked: staleTasks?.length || 0,
        updated: updatedCount,
        completed: completedCount,
        failed: failedCount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('❌ Error in sync-stale-tasks:', error);
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
