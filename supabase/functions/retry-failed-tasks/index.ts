import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODEL_MAP: Record<string, string> = {
  'V5': 'chirp-crow',
  'V4_5PLUS': 'chirp-bluejay',
  'V4_5ALL': 'chirp-auk',
  'V4': 'chirp-v4',
};

function getApiModelName(uiKey: string): string {
  return MODEL_MAP[uiKey] || uiKey;
}

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

    const { taskIds, newModel = 'chirp-auk' } = await req.json();

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return new Response(JSON.stringify({ error: 'taskIds array required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Retrying ${taskIds.length} failed tasks with model: ${newModel}`);

    // Fetch failed tasks with their associated track data
    const { data: failedTasks, error: fetchError } = await supabase
      .from('generation_tasks')
      .select('*, tracks!generation_tasks_track_id_fkey(*)')
      .in('id', taskIds)
      .eq('status', 'failed');

    if (fetchError) {
      console.error('Error fetching tasks:', fetchError);
      throw fetchError;
    }

    if (!failedTasks || failedTasks.length === 0) {
      return new Response(JSON.stringify({ message: 'No failed tasks found', retried: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = [];
    const callbackUrl = `${supabaseUrl}/functions/v1/suno-music-callback`;
    const apiModel = getApiModelName(newModel);

    for (const task of failedTasks) {
      try {
        const track = task.tracks;
        const customMode = task.generation_mode === 'custom';
        const instrumental = track?.has_vocals === false;

        // Create new track record
        const { data: newTrack, error: trackError } = await supabase
          .from('tracks')
          .insert({
            user_id: task.user_id,
            project_id: track?.project_id,
            prompt: task.prompt,
            title: track?.title,
            style: track?.style,
            has_vocals: !instrumental,
            status: 'pending',
            provider: 'suno',
            suno_model: newModel,
            generation_mode: task.generation_mode || 'custom',
            vocal_gender: track?.vocal_gender,
            negative_tags: track?.negative_tags,
            artist_id: track?.artist_id,
            artist_name: track?.artist_name,
            artist_avatar_url: track?.artist_avatar_url,
          })
          .select()
          .single();

        if (trackError || !newTrack) {
          console.error('Error creating track:', trackError);
          results.push({ taskId: task.id, success: false, error: 'Failed to create track' });
          continue;
        }

        // Create new generation task
        const { data: newTask, error: taskInsertError } = await supabase
          .from('generation_tasks')
          .insert({
            user_id: task.user_id,
            prompt: task.prompt,
            status: 'pending',
            telegram_chat_id: task.telegram_chat_id,
            track_id: newTrack.id,
            source: 'retry',
            generation_mode: task.generation_mode || 'custom',
            model_used: newModel,
          })
          .select()
          .single();

        if (taskInsertError || !newTask) {
          console.error('Error creating task:', taskInsertError);
          results.push({ taskId: task.id, success: false, error: 'Failed to create task' });
          continue;
        }

        // Prepare Suno API payload
        const sunoPayload: any = {
          customMode,
          instrumental,
          model: apiModel,
          callBackUrl: callbackUrl,
          prompt: task.prompt,
        };

        if (customMode) {
          if (track?.style) sunoPayload.style = track.style;
          if (track?.title) sunoPayload.title = track.title;
        }

        if (track?.negative_tags) sunoPayload.negativeTags = track.negative_tags;
        if (track?.vocal_gender) sunoPayload.vocalGender = track.vocal_gender;

        console.log(`Calling Suno API for task ${task.id} with model ${apiModel}`);

        // Call Suno API directly
        const sunoResponse = await fetch('https://api.sunoapi.org/api/v1/generate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sunoApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sunoPayload),
        });

        const sunoData = await sunoResponse.json();

        if (!sunoResponse.ok || sunoData.code !== 200) {
          console.error('Suno API error:', sunoData);
          
          // Update task with error
          await supabase
            .from('generation_tasks')
            .update({ 
              status: 'failed', 
              error_message: sunoData.message || 'Suno API error' 
            })
            .eq('id', newTask.id);
          
          await supabase
            .from('tracks')
            .update({ status: 'failed', error_message: sunoData.message })
            .eq('id', newTrack.id);

          results.push({ 
            taskId: task.id, 
            newTaskId: newTask.id, 
            success: false, 
            error: sunoData.message || 'Suno API error' 
          });
          continue;
        }

        // Update task with Suno task ID
        const sunoTaskId = sunoData.data?.taskId;
        if (sunoTaskId) {
          await supabase
            .from('generation_tasks')
            .update({ 
              suno_task_id: sunoTaskId, 
              status: 'processing' 
            })
            .eq('id', newTask.id);

          await supabase
            .from('tracks')
            .update({ 
              suno_task_id: sunoTaskId, 
              status: 'processing' 
            })
            .eq('id', newTrack.id);
        }

        console.log(`Successfully started generation for task ${task.id} -> ${newTask.id}`);
        results.push({ 
          taskId: task.id, 
          newTaskId: newTask.id, 
          newTrackId: newTrack.id,
          sunoTaskId,
          success: true 
        });

        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 3000));

      } catch (err) {
        console.error('Error processing task:', task.id, err);
        results.push({ taskId: task.id, success: false, error: String(err) });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Retry complete: ${successCount}/${failedTasks.length} successful`);

    return new Response(JSON.stringify({ 
      message: `Retried ${successCount} of ${failedTasks.length} tasks`,
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in retry-failed-tasks:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
