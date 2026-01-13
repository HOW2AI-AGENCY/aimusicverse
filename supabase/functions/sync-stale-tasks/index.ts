import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from '../_shared/supabase-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper functions for snake_case field access (Suno API uses snake_case)
const getAudioUrl = (clip: any) => clip.source_audio_url || clip.audio_url;
const getStreamUrl = (clip: any) => clip.source_stream_audio_url || clip.stream_audio_url;
const getImageUrl = (clip: any) => clip.source_image_url || clip.image_url;
const getLyrics = (clip: any) => clip.prompt || clip.lyric || ''; // Suno uses 'prompt' for lyrics

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sunoApiKey = Deno.env.get('SUNO_API_KEY');

    if (!sunoApiKey) {
      throw new Error('SUNO_API_KEY not configured');
    }

    const supabase = getSupabaseClient();

    // Parse request body for optional user_id filter
    let userId: string | null = null;
    try {
      const body = await req.json();
      userId = body?.user_id || null;
    } catch {
      // No body or invalid JSON, proceed without filter
    }

    console.log('🔄 Starting stale tasks sync...', userId ? `for user ${userId}` : 'for all users');

    // PHASE 1: Find tasks with completed status but track not updated
    // This handles cases where callback succeeded but track update failed
    let recoveryQuery = supabase
      .from('generation_tasks')
      .select('*, tracks(*)')
      .eq('status', 'completed')
      .not('audio_clips', 'is', null);

    if (userId) {
      recoveryQuery = recoveryQuery.eq('user_id', userId);
    }

    const { data: recoveryTasks, error: recoveryError } = await recoveryQuery;

    if (recoveryError) {
      console.error('Error fetching recovery tasks:', recoveryError);
    } else {
      console.log(`📊 Found ${recoveryTasks?.length || 0} tasks for recovery check`);
      let recoveredCount = 0;

      // Recover tracks where task completed but track didn't update
      for (const task of recoveryTasks || []) {
        // Skip replace_section tasks - they don't update the main track
        if (task.generation_mode === 'replace_section') {
          // For replace_section, check if version was created
          const { data: existingVersion } = await supabase
            .from('track_versions')
            .select('id')
            .eq('track_id', task.track_id)
            .eq('metadata->>original_task_id', task.id)
            .single();
          
          if (existingVersion) continue; // Already processed
          
          console.log(`🔧 Recovering replace_section task ${task.id}`);
          
          try {
            let clips = task.audio_clips;
            if (typeof clips === 'string') {
              clips = JSON.parse(clips);
            }
            
            if (!clips || !Array.isArray(clips) || clips.length === 0) {
              console.error(`❌ No valid clips in replace_section task ${task.id}`);
              continue;
            }

            const clip = clips[0];
            const audioUrl = getAudioUrl(clip);
            
            if (!audioUrl) {
              console.error(`❌ No audio URL in replace_section clip for task ${task.id}`);
              continue;
            }

            // Download audio
            let localAudioUrl = null;
            try {
              const audioResponse = await fetch(audioUrl);
              if (audioResponse.ok) {
                const audioBlob = await audioResponse.blob();
                const audioFileName = `tracks/${task.user_id}/${task.track_id}_replace_${Date.now()}.mp3`;
                const { data: audioUpload } = await supabase.storage
                  .from('project-assets')
                  .upload(audioFileName, audioBlob, { contentType: 'audio/mpeg', upsert: true });
                if (audioUpload) {
                  localAudioUrl = supabase.storage.from('project-assets').getPublicUrl(audioFileName).data.publicUrl;
                }
              }
            } catch (downloadError) {
              console.error(`⚠️ Error downloading replace_section audio:`, downloadError);
            }

            // Get next version label
            const { data: latestVersion } = await supabase
              .from('track_versions')
              .select('version_label')
              .eq('track_id', task.track_id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            const nextLabel = latestVersion?.version_label 
              ? String.fromCharCode(latestVersion.version_label.charCodeAt(0) + 1)
              : 'A';

            // Create version
            await supabase.from('track_versions').insert({
              track_id: task.track_id,
              audio_url: localAudioUrl || audioUrl,
              duration_seconds: Math.round(clip.duration) || null,
              version_type: 'replace_section',
              version_label: nextLabel,
              is_primary: false,
              metadata: {
                suno_id: clip.id,
                suno_task_id: task.suno_task_id,
                replace_section: true,
                original_task_id: task.id,
                recovered: true,
              },
            });

            console.log(`✅ Replace section version ${nextLabel} created for task ${task.id}`);
            recoveredCount++;
            continue;
          } catch (recoveryErr) {
            console.error(`❌ Error recovering replace_section task ${task.id}:`, recoveryErr);
            continue;
          }
        }
        
        if (!task.tracks || task.tracks.status === 'completed') continue;
        
        console.log(`🔧 Recovering track ${task.track_id} from completed task ${task.id}`);
        
        try {
          // Parse audio_clips - handle both string and object
          let clips = task.audio_clips;
          if (typeof clips === 'string') {
            clips = JSON.parse(clips);
          }
          
          if (!clips || !Array.isArray(clips) || clips.length === 0) {
            console.error(`❌ No valid clips in task ${task.id}`);
            continue;
          }

          const firstClip = clips[0];
          const audioUrl = getAudioUrl(firstClip);
          const imageUrl = getImageUrl(firstClip);
          const lyrics = getLyrics(firstClip);

          if (!audioUrl) {
            console.error(`❌ No audio URL in clip for task ${task.id}`);
            continue;
          }

          // Download and save files
          let localAudioUrl = null;
          let localCoverUrl = null;

          try {
            if (audioUrl) {
              const audioResponse = await fetch(audioUrl);
              if (audioResponse.ok) {
                const audioBlob = await audioResponse.blob();
                const audioFileName = `tracks/${task.user_id}/${task.track_id}_recovered_${Date.now()}.mp3`;
                const { data: audioUpload } = await supabase.storage
                  .from('project-assets')
                  .upload(audioFileName, audioBlob, { contentType: 'audio/mpeg', upsert: true });
                if (audioUpload) {
                  localAudioUrl = supabase.storage.from('project-assets').getPublicUrl(audioFileName).data.publicUrl;
                }
              }
            }

            if (imageUrl) {
              const coverResponse = await fetch(imageUrl);
              if (coverResponse.ok) {
                const coverBlob = await coverResponse.blob();
                const coverFileName = `covers/${task.user_id}/${task.track_id}_recovered_cover_${Date.now()}.jpg`;
                const { data: coverUpload } = await supabase.storage
                  .from('project-assets')
                  .upload(coverFileName, coverBlob, { contentType: 'image/jpeg', upsert: true });
                if (coverUpload) {
                  localCoverUrl = supabase.storage.from('project-assets').getPublicUrl(coverFileName).data.publicUrl;
                }
              }
            }
          } catch (downloadError) {
            console.error(`⚠️ Error downloading files for recovery:`, downloadError);
          }

          // Update main track record
          await supabase.from('tracks').update({
            status: 'completed',
            audio_url: audioUrl,
            streaming_url: getStreamUrl(firstClip) || audioUrl,
            local_audio_url: localAudioUrl,
            cover_url: imageUrl,
            local_cover_url: localCoverUrl,
            title: firstClip.title || task.tracks?.title || 'Recovered Track',
            duration_seconds: Math.round(firstClip.duration) || null,
            tags: firstClip.tags || task.tracks?.tags,
            lyrics: lyrics,
            suno_id: firstClip.id,
            model_name: firstClip.model_name || 'chirp-v4',
          }).eq('id', task.track_id);

          // Create versions for all clips
          const versionLabels = ['A', 'B', 'C', 'D', 'E'];
          for (let i = 0; i < clips.length; i++) {
            const clip = clips[i];
            const versionLabel = versionLabels[i] || `V${i + 1}`;
            
            // Check if version already exists
            const { data: existingVersion } = await supabase
              .from('track_versions')
              .select('id')
              .eq('track_id', task.track_id)
              .eq('version_label', versionLabel)
              .single();

            if (!existingVersion) {
              await supabase.from('track_versions').insert({
                track_id: task.track_id,
                audio_url: localAudioUrl || getAudioUrl(clip),
                cover_url: localCoverUrl || getImageUrl(clip),
                duration_seconds: Math.round(clip.duration) || null,
                version_type: i === 0 ? 'initial' : 'alternative',
                version_label: versionLabel,
                clip_index: i,
                is_primary: i === 0,
                metadata: {
                  suno_id: clip.id,
                  title: clip.title,
                  tags: clip.tags,
                  lyrics: getLyrics(clip),
                  recovered: true,
                },
              });
              console.log(`✅ Version ${versionLabel} created for recovered track`);
            }
          }

          console.log(`✅ Track ${task.track_id} recovered successfully`);
          recoveredCount++;
        } catch (recoveryErr) {
          console.error(`❌ Error recovering track ${task.track_id}:`, recoveryErr);
        }
      }
    }

    // PHASE 2: Find tasks stuck in processing/pending for more than 10 minutes
    let staleQuery = supabase
      .from('generation_tasks')
      .select('*, tracks(*)')
      .in('status', ['pending', 'processing'])
      .lt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
      .not('suno_task_id', 'is', null);

    if (userId) {
      staleQuery = staleQuery.eq('user_id', userId);
    }

    const { data: staleTasks, error: fetchError } = await staleQuery;

    if (fetchError) {
      console.error('Error fetching stale tasks:', fetchError);
      throw fetchError;
    }

    console.log(`📊 Found ${staleTasks?.length || 0} stale tasks to check with Suno API`);

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
          await supabase.from('generation_tasks').update({
            status: 'failed',
            error_message: sunoData.msg || 'Suno API error',
            completed_at: new Date().toISOString(),
          }).eq('id', task.id);

          if (task.track_id) {
            await supabase.from('tracks').update({
              status: 'failed',
              error_message: sunoData.msg || 'Suno API error',
            }).eq('id', task.track_id);
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
          console.log(`✅ Task ${task.id} completed! Processing ${clips.length} clips`);

          // Download and save files for first clip
          let localAudioUrl = null;
          let localCoverUrl = null;
          const audioUrl = getAudioUrl(firstClip);
          const imageUrl = getImageUrl(firstClip);

          try {
            if (audioUrl) {
              const audioResponse = await fetch(audioUrl);
              if (audioResponse.ok) {
                const audioBlob = await audioResponse.blob();
                const audioFileName = `tracks/${task.user_id}/${task.track_id}_${Date.now()}.mp3`;
                const { data: audioUpload } = await supabase.storage
                  .from('project-assets')
                  .upload(audioFileName, audioBlob, { contentType: 'audio/mpeg', upsert: true });
                if (audioUpload) {
                  localAudioUrl = supabase.storage.from('project-assets').getPublicUrl(audioFileName).data.publicUrl;
                }
              }
            }

            if (imageUrl) {
              const coverResponse = await fetch(imageUrl);
              if (coverResponse.ok) {
                const coverBlob = await coverResponse.blob();
                const coverFileName = `covers/${task.user_id}/${task.track_id}_cover_${Date.now()}.jpg`;
                const { data: coverUpload } = await supabase.storage
                  .from('project-assets')
                  .upload(coverFileName, coverBlob, { contentType: 'image/jpeg', upsert: true });
                if (coverUpload) {
                  localCoverUrl = supabase.storage.from('project-assets').getPublicUrl(coverFileName).data.publicUrl;
                }
              }
            }
          } catch (downloadError) {
            console.error(`⚠️ Error downloading files for task ${task.id}:`, downloadError);
          }

          // Update track with snake_case field access
          await supabase.from('tracks').update({
            status: 'completed',
            audio_url: audioUrl,
            streaming_url: getStreamUrl(firstClip) || audioUrl,
            local_audio_url: localAudioUrl,
            cover_url: imageUrl,
            local_cover_url: localCoverUrl,
            title: firstClip.title || task.tracks?.title,
            duration_seconds: Math.round(firstClip.duration) || null,
            tags: firstClip.tags,
            lyrics: getLyrics(firstClip),
            suno_id: firstClip.id,
            model_name: firstClip.model_name || 'chirp-v4',
          }).eq('id', task.track_id);

          // Update generation task
          await supabase.from('generation_tasks').update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            callback_received_at: new Date().toISOString(),
            audio_clips: clips,
            received_clips: clips.length,
          }).eq('id', task.id);

          // Save ALL clips as versions
          console.log(`💾 Saving ${clips.length} versions...`);
          const versionLabels = ['A', 'B', 'C', 'D', 'E'];

          for (let i = 0; i < clips.length; i++) {
            const clip = clips[i];
            const versionLabel = versionLabels[i] || `V${i + 1}`;
            const clipAudioUrl = getAudioUrl(clip);
            const clipImageUrl = getImageUrl(clip);

            // Download files for each version
            let versionLocalAudioUrl = null;
            let versionLocalCoverUrl = null;

            try {
              if (clipAudioUrl) {
                const audioResponse = await fetch(clipAudioUrl);
                if (audioResponse.ok) {
                  const audioBlob = await audioResponse.blob();
                  const audioFileName = `tracks/${task.user_id}/${task.track_id}_v${versionLabel}_${Date.now()}.mp3`;
                  const { data: audioUpload } = await supabase.storage
                    .from('project-assets')
                    .upload(audioFileName, audioBlob, { contentType: 'audio/mpeg', upsert: true });
                  if (audioUpload) {
                    versionLocalAudioUrl = supabase.storage.from('project-assets').getPublicUrl(audioFileName).data.publicUrl;
                  }
                }
              }

              if (clipImageUrl) {
                const coverResponse = await fetch(clipImageUrl);
                if (coverResponse.ok) {
                  const coverBlob = await coverResponse.blob();
                  const coverFileName = `covers/${task.user_id}/${task.track_id}_v${versionLabel}_cover_${Date.now()}.jpg`;
                  const { data: coverUpload } = await supabase.storage
                    .from('project-assets')
                    .upload(coverFileName, coverBlob, { contentType: 'image/jpeg', upsert: true });
                  if (coverUpload) {
                    versionLocalCoverUrl = supabase.storage.from('project-assets').getPublicUrl(coverFileName).data.publicUrl;
                  }
                }
              }
            } catch (downloadError) {
              console.error(`⚠️ Error downloading files for version ${versionLabel}:`, downloadError);
            }

            // Check if version exists
            const { data: existingVersion } = await supabase
              .from('track_versions')
              .select('id')
              .eq('track_id', task.track_id)
              .eq('version_label', versionLabel)
              .single();

            const versionData = {
              audio_url: versionLocalAudioUrl || clipAudioUrl,
              cover_url: versionLocalCoverUrl || clipImageUrl,
              duration_seconds: Math.round(clip.duration) || null,
              metadata: {
                suno_id: clip.id,
                title: clip.title,
                tags: clip.tags,
                lyrics: getLyrics(clip),
                model_name: clip.model_name,
                synced_by: 'sync_stale_tasks',
              },
            };

            if (existingVersion) {
              await supabase.from('track_versions').update(versionData).eq('id', existingVersion.id);
            } else {
              const { data: newVersion } = await supabase.from('track_versions').insert({
                track_id: task.track_id,
                ...versionData,
                version_type: i === 0 ? 'initial' : 'alternative',
                version_label: versionLabel,
                clip_index: i,
                is_primary: i === 0,
              }).select().single();

              if (newVersion && i === 0) {
                await supabase.from('tracks')
                  .update({ active_version_id: newVersion.id })
                  .eq('id', task.track_id)
                  .is('active_version_id', null);
              }
            }

            console.log(`✅ Version ${versionLabel} saved`);

            // Log version creation
            await supabase.from('track_change_log').insert({
              track_id: task.track_id,
              user_id: task.user_id,
              change_type: i === 0 ? 'generation_completed' : 'version_created',
              changed_by: 'sync_stale_tasks',
              metadata: {
                clip_index: i,
                suno_clip_id: clip.id,
                version_label: versionLabel,
                auto_synced: true,
              },
            });
          }

          // Create notification with group_key for auto-replace
          await supabase.from('notifications').insert({
            user_id: task.user_id,
            type: 'track_generated',
            title: '🎵 Трек готов!',
            message: `Ваш трек "${firstClip.title || 'Без названия'}" успешно сгенерирован`,
            action_url: `/library`,
            group_key: `generation_${task.id}`,
            metadata: { taskId: task.id, trackTitle: firstClip.title },
            priority: 8,
          });

          // Send Telegram notification if chat_id exists - send BOTH versions
          if (task.telegram_chat_id) {
            try {
              const maxClipsToSend = Math.min(clips.length, 2);
              console.log(`📤 Sending ${maxClipsToSend} track version(s) via sync-stale-tasks`);
              
              for (let i = 0; i < maxClipsToSend; i++) {
                const clip = clips[i];
                const versionLabel = ['A', 'B', 'C', 'D', 'E'][i] || `V${i + 1}`;
                
                // Get readable title
                let trackTitle = clip.title || firstClip.title;
                if (!trackTitle || trackTitle === 'Untitled' || trackTitle === 'Трек') {
                  const promptLines = (task.prompt || '').split('\n').filter((line: string) => line.trim().length > 0);
                  trackTitle = promptLines.length > 0 ? promptLines[0].substring(0, 60).trim() : 'AI Music Track';
                  trackTitle = trackTitle.replace(/^(create|generate|make)\s+/i, '');
                }
                
                const titleWithVersion = maxClipsToSend > 1 ? `${trackTitle} (версия ${versionLabel})` : trackTitle;
                
                // Delay between messages
                if (i > 0) {
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
                await supabase.functions.invoke('send-telegram-notification', {
                  body: {
                    type: 'generation_complete',
                    task_id: task.id,
                    chat_id: task.telegram_chat_id,
                    track_id: task.track_id,
                    audioUrl: getAudioUrl(clip),
                    coverUrl: getImageUrl(clip),
                    title: titleWithVersion,
                    duration: clip.duration,
                    tags: clip.tags,
                    versionsCount: clips.length,
                    versionLabel: versionLabel,
                    currentVersion: i + 1,
                    totalVersions: maxClipsToSend,
                    style: task.tracks?.style,
                  },
                });
              }
            } catch (notifError) {
              console.error('Error sending Telegram notification:', notifError);
            }
          }

          completedCount++;
        } else if (taskData.status && (taskData.status.includes('FAILED') || taskData.status.includes('ERROR'))) {
          // Mark as failed
          const errorMessage = taskData.errorMessage || 'Generation failed';
          console.log(`❌ Task ${task.id} failed:`, errorMessage);

          await supabase.from('generation_tasks').update({
            status: 'failed',
            error_message: errorMessage,
            completed_at: new Date().toISOString(),
          }).eq('id', task.id);

          if (task.track_id) {
            await supabase.from('tracks').update({
              status: 'failed',
              error_message: errorMessage,
            }).eq('id', task.track_id);
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
      recovered: recoveryTasks?.filter(t => t.tracks?.status !== 'completed').length || 0,
      checked: staleTasks?.length || 0,
      updated: updatedCount,
      completed: completedCount,
      failed: failedCount,
    });

    console.log(`📊 Sync completed: { recovered: ${recoveryTasks?.filter(t => t.tracks?.status !== 'completed').length || 0}, checked: ${staleTasks?.length || 0}, updated: ${updatedCount}, completed: ${completedCount}, failed: ${failedCount} }`);
    
    return new Response(
      JSON.stringify({
        success: true,
        recovered: recoveryTasks?.filter(t => t.tracks?.status !== 'completed').length || 0,
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
