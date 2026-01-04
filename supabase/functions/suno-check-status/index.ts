import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
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

    const { taskId, useFallback } = await req.json();

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

    console.log('Checking status for Suno task:', sunoTaskId, 'useFallback:', useFallback);

    // Helper function to fetch status with retry
    const fetchStatusWithRetry = async (endpoint: string, maxRetries = 2): Promise<any> => {
      let lastError: Error | null = null;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch(endpoint, {
            headers: {
              'Authorization': `Bearer ${sunoApiKey}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(`Suno API error: ${response.status}`);
          }

          const data = await response.json();
          
          if (!isSunoSuccessCode(data.code)) {
            const code = data.code ?? 'unknown';
            throw new Error(data.msg || `API returned code ${code}`);
          }
          
          return data;
        } catch (error) {
          console.error(`Attempt ${attempt + 1} failed:`, error);
          lastError = error as Error;
          
          if (attempt < maxRetries) {
            // Exponential backoff: 1s, 2s, 4s
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
          }
        }
      }
      
      throw lastError;
    };

    // Try primary endpoint first, then fallback
    let sunoData;
    let taskData;
    
    try {
      if (useFallback) {
        // Use fallback endpoint directly if requested
        console.log('Using fallback endpoint: GET /api/get');
        sunoData = await fetchStatusWithRetry(
          `https://api.sunoapi.org/api/v1/generate/get?taskId=${sunoTaskId}`
        );
      } else {
        // Try primary endpoint
        console.log('Using primary endpoint: record-info');
        sunoData = await fetchStatusWithRetry(
          `https://api.sunoapi.org/api/v1/generate/record-info?taskId=${sunoTaskId}`
        );
      }
      
      taskData = sunoData.data;
    } catch (primaryError) {
      console.error('Primary endpoint failed, trying fallback:', primaryError);
      
      // Log the error for debugging
      await supabase.from('api_usage_logs').insert({
        service: 'suno',
        endpoint: 'check-status-primary-failed',
        method: 'GET',
        user_id: user.id,
        request_body: { taskId: sunoTaskId, error: (primaryError as Error).message },
        response_status: 500,
      });
      
      // Try fallback endpoint
      try {
        console.log('Attempting fallback endpoint: GET /api/get');
        sunoData = await fetchStatusWithRetry(
          `https://api.sunoapi.org/api/v1/generate/get?taskId=${sunoTaskId}`,
          1 // Fewer retries for fallback
        );
        taskData = sunoData.data;
        console.log('Fallback endpoint succeeded');
      } catch (fallbackError) {
        console.error('Fallback endpoint also failed:', fallbackError);
        throw new Error(`Both endpoints failed: ${(primaryError as Error).message}`);
      }
    }
    const trackId = task.track_id;

    // Check if at least first clip is ready for streaming
    if (taskData.response?.sunoData && taskData.response.sunoData.length > 0) {
      const clips = taskData.response.sunoData;
      const firstClip = clips[0];
      
      // Check if it's streaming ready (first clip) or fully completed (all clips)
      const isComplete = taskData.status === 'SUCCESS' && clips.length >= 2;
      const isStreamingReady = clips.length === 1 || (!isComplete && firstClip.audioUrl);
      
      console.log(`Task status: ${taskData.status}, clips: ${clips.length}, streaming ready: ${isStreamingReady}, complete: ${isComplete}`);

      // If streaming ready but not complete, update with streaming URL
      if (isStreamingReady && !isComplete) {
        console.log('Streaming ready - updating track with streaming URL');
        
        await supabase
          .from('tracks')
          .update({
            status: 'streaming_ready',
            streaming_url: firstClip.audioUrl,
            audio_url: firstClip.audioUrl,
            cover_url: firstClip.imageUrl || task.tracks?.cover_url,
            title: firstClip.title || task.tracks?.title,
          })
          .eq('id', trackId);

        await supabase
          .from('generation_tasks')
          .update({
            status: 'processing',
            audio_clips: [firstClip],
          })
          .eq('id', task.id);

        return new Response(
          JSON.stringify({ 
            success: true, 
            status: 'streaming_ready',
            track: firstClip,
            message: 'Track is ready for streaming',
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      // If complete, download and save to storage
      if (isComplete) {
        console.log('Task completed, downloading and saving files');
        console.log('Track ID to update:', trackId);
        console.log('First clip data:', JSON.stringify({
          title: firstClip.title,
          audioUrl: firstClip.audioUrl,
          imageUrl: firstClip.imageUrl,
          duration: firstClip.duration,
        }));
        
        let localAudioUrl = null;
        let localCoverUrl = null;

        try {
          // Download and save audio to storage
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

        // Update track with complete data - use service role to bypass RLS
        console.log('Updating track with ID:', trackId);
        
        const { data: updatedTrack, error: trackUpdateError } = await supabase
          .from('tracks')
          .update({
            status: 'completed',
            audio_url: firstClip.audioUrl,
            streaming_url: firstClip.audioUrl,
            local_audio_url: localAudioUrl,
            cover_url: firstClip.imageUrl || task.tracks?.cover_url,
            local_cover_url: localCoverUrl,
            title: firstClip.title || task.tracks?.title || 'Untitled',
            duration_seconds: Math.floor(firstClip.duration || 0),
            tags: firstClip.tags || task.tracks?.tags,
            lyrics: firstClip.lyric || task.tracks?.lyrics,
            suno_id: firstClip.id || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', trackId)
          .select();

        if (trackUpdateError) {
          console.error('❌ Error updating track:', trackUpdateError);
          throw new Error(`Failed to update track: ${trackUpdateError.message}`);
        } else {
          console.log('✅ Track updated successfully:', updatedTrack);
        }

        // Update generation task
        console.log('Updating generation task with ID:', task.id);
        
        const { data: updatedTask, error: taskUpdateError } = await supabase
          .from('generation_tasks')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            callback_received_at: new Date().toISOString(),
            audio_clips: clips,
            updated_at: new Date().toISOString(),
          })
          .eq('id', task.id)
          .select();

        if (taskUpdateError) {
          console.error('❌ Error updating generation task:', taskUpdateError);
        } else {
          console.log('✅ Generation task updated successfully:', updatedTask);
        }
      }

      // Create track version (only if doesn't exist)
      const { data: existingVersion } = await supabase
        .from('track_versions')
        .select('id')
        .eq('track_id', trackId)
        .eq('version_type', 'original')
        .single();

      if (!existingVersion) {
        const { error: versionError } = await supabase
          .from('track_versions')
          .insert({
            track_id: trackId,
            audio_url: firstClip.audioUrl,
            cover_url: firstClip.imageUrl,
            duration_seconds: firstClip.duration,
            version_type: 'initial',
            is_primary: true,
          });

        if (versionError) {
          console.error('Error creating track version:', versionError);
        }
      }

      // Log completion
      const { error: logError } = await supabase
        .from('track_change_log')
        .insert({
          track_id: trackId,
          user_id: task.user_id,
          change_type: 'generation_completed',
          changed_by: 'web_interface_check',
          metadata: {
            clips: clips.length,
            duration: firstClip.duration,
            synced_from_check: true,
          },
        });

      if (logError) {
        console.error('Error logging completion:', logError);
      }

      // Create notification
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: task.user_id,
          type: 'track_generated',
          title: 'Трек готов! 🎵',
          message: `Ваш трек "${firstClip.title || 'Без названия'}" успешно сгенерирован`,
          action_url: `/library`,
        });

      if (notifError) {
        console.error('Error creating notification:', notifError);
      }

      console.log('✅ Track generation fully completed and synced');

      return new Response(
        JSON.stringify({ 
          success: true, 
          status: 'completed',
          track: {
            id: trackId,
            title: firstClip.title,
            audioUrl: firstClip.audioUrl,
            coverUrl: firstClip.imageUrl,
            duration: firstClip.duration,
          },
          message: 'Track generation completed successfully',
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } else if (taskData.status && (taskData.status.includes('FAILED') || taskData.status.includes('ERROR'))) {
      // Generation failed
      const errorMessage = taskData.errorMessage || 'Generation failed';

      await supabase
        .from('generation_tasks')
        .update({
          status: 'failed',
          error_message: errorMessage,
          completed_at: new Date().toISOString(),
        })
        .eq('id', task.id);

      if (trackId) {
        await supabase
          .from('tracks')
          .update({
            status: 'failed',
            error_message: errorMessage,
          })
          .eq('id', trackId);
      }

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
          progress: taskData.status || 'queued',
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
