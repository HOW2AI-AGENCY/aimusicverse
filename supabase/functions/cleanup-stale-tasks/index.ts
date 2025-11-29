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
    
    // Find tasks that are "stuck" in processing for more than 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    const { data: staleTasks, error: fetchError } = await supabase
      .from('generation_tasks')
      .select('*, tracks(*)')
      .in('status', ['pending', 'processing'])
      .lt('created_at', tenMinutesAgo);

    if (fetchError) {
      console.error('Error fetching stale tasks:', fetchError);
      throw fetchError;
    }

    if (!staleTasks || staleTasks.length === 0) {
      console.log('No stale tasks found');
      return new Response(
        JSON.stringify({ success: true, message: 'No stale tasks', checked: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`Found ${staleTasks.length} stale tasks, checking status...`);

    let updated = 0;
    let failed = 0;

    for (const task of staleTasks) {
      if (!task.suno_task_id) {
        // No Suno task ID - mark as failed
        await supabase
          .from('generation_tasks')
          .update({
            status: 'failed',
            error_message: 'Task stuck without Suno task ID',
            completed_at: new Date().toISOString()
          })
          .eq('id', task.id);

        if (task.track_id) {
          await supabase
            .from('tracks')
            .update({
              status: 'failed',
              error_message: 'Generation stuck'
            })
            .eq('id', task.track_id);
        }

        failed++;
        continue;
      }

      try {
        // Check status with Suno API
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
          console.error(`Suno API error for task ${task.id}:`, sunoResponse.status);
          continue;
        }

        const sunoData = await sunoResponse.json();

        if (sunoData.code !== 200) {
          console.error(`Suno API returned error for task ${task.id}:`, sunoData);
          continue;
        }

        const taskData = sunoData.data;

        // If completed, sync to database
        if (taskData.status === 'SUCCESS' && taskData.response?.sunoData && taskData.response.sunoData.length > 0) {
          const clips = taskData.response.sunoData;
          const firstClip = clips[0];
          const trackId = task.track_id;

          if (trackId && firstClip) {
            // Download and save audio/cover
            let localAudioUrl = null;
            let localCoverUrl = null;

            try {
              if (firstClip.audioUrl) {
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
              }

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
                title: firstClip.title || task.tracks?.title || 'Новый трек',
                duration_seconds: firstClip.duration || null,
                tags: firstClip.tags || task.tracks?.tags,
                lyrics: firstClip.lyric || task.tracks?.lyrics,
                suno_id: firstClip.id || null,
              })
              .eq('id', trackId);

            // Update task
            await supabase
              .from('generation_tasks')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                callback_received_at: new Date().toISOString(),
                audio_clips: clips,
              })
              .eq('id', task.id);

            // Create version
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

            // Log
            await supabase
              .from('track_change_log')
              .insert({
                track_id: trackId,
                user_id: task.user_id,
                change_type: 'generation_completed',
                changed_by: 'cleanup_job',
                metadata: {
                  clips: clips.length,
                  duration: firstClip.duration,
                  auto_synced: true,
                },
              });

            // Notify user
            await supabase
              .from('notifications')
              .insert({
                user_id: task.user_id,
                type: 'track_generated',
                title: 'Трек готов! 🎵',
                message: `Ваш трек "${firstClip.title || 'Без названия'}" успешно сгенерирован`,
                action_url: `/library`,
              });

            updated++;
            console.log(`Successfully synced task ${task.id}`);
          }
        } else if (taskData.status && (taskData.status.includes('FAILED') || taskData.status.includes('ERROR'))) {
          // Mark as failed
          await supabase
            .from('generation_tasks')
            .update({
              status: 'failed',
              error_message: taskData.errorMessage || 'Generation failed',
              completed_at: new Date().toISOString()
            })
            .eq('id', task.id);

          if (task.track_id) {
            await supabase
              .from('tracks')
              .update({
                status: 'failed',
                error_message: taskData.errorMessage || 'Generation failed'
              })
              .eq('id', task.track_id);
          }

          failed++;
          console.log(`Marked task ${task.id} as failed`);
        }
      } catch (error) {
        console.error(`Error processing task ${task.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked: staleTasks.length,
        updated,
        failed,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in cleanup-stale-tasks:', error);
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
