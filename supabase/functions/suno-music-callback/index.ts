import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createLogger } from '../_shared/logger.ts';
import { isSunoSuccessCode } from '../_shared/suno.ts';

const logger = createLogger('suno-music-callback');

// Cost per generation in user credits (must match suno-music-generate)
const GENERATION_COST = 10;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to get audio/image URLs - Suno API uses snake_case
const getAudioUrl = (clip: any) => clip.source_audio_url || clip.audio_url;
const getStreamUrl = (clip: any) => clip.source_stream_audio_url || clip.stream_audio_url;
const getImageUrl = (clip: any) => clip.source_image_url || clip.image_url;

/**
 * Log action to content_audit_log for deposition/copyright proof
 */
async function logAuditAction(
  supabaseUrl: string, 
  supabaseKey: string, 
  entry: {
    entityType: 'track' | 'project' | 'artist' | 'lyrics' | 'cover' | 'reference_audio';
    entityId: string;
    userId: string;
    actorType: 'user' | 'ai' | 'system';
    aiModelUsed?: string;
    actionType: string;
    actionCategory?: string;
    contentUrl?: string;
    promptUsed?: string;
    inputMetadata?: Record<string, unknown>;
    outputMetadata?: Record<string, unknown>;
    chainId?: string;
  }
) {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/audit-log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify(entry),
    });
    
    if (!response.ok) {
      logger.warn('Audit log failed', { status: response.status });
    } else {
      const result = await response.json();
      logger.debug('Audit logged', { auditId: result?.auditId });
    }
  } catch (error) {
    logger.warn('Audit log error', { error: String(error) });
  }
}

/**
 * Fetches a resource with exponential backoff retry logic
 * @param url - URL to fetch
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param initialDelay - Initial delay in ms (default: 2000ms = 2s)
 * @returns Promise<Response> if successful
 * @throws Last error encountered if all retries fail
 */
async function fetchWithRetry(url: string, maxRetries = 3, initialDelay = 2000): Promise<Response> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug('Fetch attempt', { attempt, maxRetries, url: url.substring(0, 100) });
      const response = await fetch(url);

      if (response.ok) {
        logger.debug('Fetch successful', { attempt, status: response.status });
        return response;
      }

      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      logger.warn('Fetch failed with bad status', { attempt, status: response.status, error: lastError.message });
    } catch (error: any) {
      lastError = error;
      logger.warn('Fetch failed with exception', { attempt, error: error.message });
    }

    // Don't delay after the last attempt
    if (attempt < maxRetries) {
      // Exponential backoff: 2s, 4s, 8s
      const delay = initialDelay * Math.pow(2, attempt - 1);
      logger.info('Retrying after delay', { attempt, nextAttempt: attempt + 1, delayMs: delay });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  logger.error('All fetch attempts failed', lastError, { maxRetries });
  throw lastError || new Error('All fetch attempts failed');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    logger.info('Callback received from SunoAPI', { code: payload.code, callbackType: payload.data?.callbackType });

    const { code, msg, data } = payload;
    const { callbackType, taskId, task_id, data: audioData } = data || {};
    const sunoTaskId = taskId || task_id;

    // Validate required taskId
    if (!sunoTaskId) {
      logger.error('No taskId in callback payload');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing taskId' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate taskId exists in database (prevents spoofed callbacks)
    const { data: task, error: taskError } = await supabase
      .from('generation_tasks')
      .select('*, tracks(*), telegram_message_id')
      .eq('suno_task_id', sunoTaskId)
      .single();

    if (taskError || !task) {
      logger.error('Task not found in database', taskError, { sunoTaskId });
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or unknown taskId' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Validate task is in expected state (not already completed/failed)
    if (task.status === 'completed' && callbackType === 'complete') {
      logger.warn('Duplicate completion callback', { sunoTaskId });
      return new Response(
        JSON.stringify({ success: true, status: 'already_processed' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trackId = task.track_id;
    logger.info('Processing callback', { taskId: task.id, trackId, callbackType, status: task.status });

    if (!isSunoSuccessCode(code)) {
      logger.error('SunoAPI generation failed', null, { msg });
      await supabase.from('generation_tasks').update({
        status: 'failed',
        error_message: msg || 'Generation failed',
        callback_received_at: new Date().toISOString(),
      }).eq('id', task.id);

      await supabase.from('tracks').update({
        status: 'failed',
        error_message: msg || 'Generation failed',
      }).eq('id', trackId);

      // Send failure notification to Telegram - update progress message if exists
      if (task.telegram_chat_id) {
        try {
          // If we have a progress message, update it with error
          if (task.telegram_message_id) {
            await supabase.functions.invoke('send-telegram-notification', {
              body: {
                type: 'error_update',
                chatId: task.telegram_chat_id,
                messageId: task.telegram_message_id,
                error_message: msg || 'Generation failed',
              },
            });
          } else {
            // Fallback to new message
            await supabase.functions.invoke('send-telegram-notification', {
              body: {
                type: 'failed',
                status: 'failed',
                chatId: task.telegram_chat_id,
                trackId,
                error_message: msg || 'Generation failed',
              },
            });
          }
          logger.info('Failure notification sent to Telegram');
        } catch (notifyErr) {
          logger.error('Failed to send failure notification', notifyErr);
        }
      }

      return new Response(JSON.stringify({ success: true, status: 'failed' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Handle replace_section mode separately
    if (task.generation_mode === 'replace_section') {
      logger.info('Processing replace_section callback', { callbackType });
      
      if (callbackType === 'complete') {
        const clips = audioData || [];
        if (clips.length === 0) {
          logger.error('No audio clips in replace_section callback');
          await supabase.from('generation_tasks').update({
            status: 'failed',
            error_message: 'No audio clips received',
            callback_received_at: new Date().toISOString(),
          }).eq('id', task.id);
          return new Response(JSON.stringify({ success: false, error: 'No clips' }), 
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
        }

        const clip = clips[0];
        const audioUrl = getAudioUrl(clip);
        logger.info('Replace section clip received', { audioUrl: !!audioUrl, duration: clip.duration });

        // Upload to storage
        let localAudioUrl = null;
        try {
          const audioResponse = await fetch(audioUrl);
          if (audioResponse.ok) {
            const audioBlob = await audioResponse.blob();
            const audioFileName = `tracks/${task.user_id}/${trackId}_replace_${Date.now()}.mp3`;
            const { data: audioUpload } = await supabase.storage
              .from('project-assets')
              .upload(audioFileName, audioBlob, { contentType: 'audio/mpeg', upsert: true });
            if (audioUpload) {
              localAudioUrl = supabase.storage.from('project-assets').getPublicUrl(audioFileName).data.publicUrl;
              logger.success('Replace section audio uploaded');
            }
          }
        } catch (e) {
          logger.error('Failed to upload replace section audio', e);
        }

        const finalAudioUrl = localAudioUrl || audioUrl;

        // Create new version for replaced section
        const { data: latestVersion } = await supabase
          .from('track_versions')
          .select('version_label')
          .eq('track_id', trackId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const nextLabel = latestVersion?.version_label 
          ? String.fromCharCode(latestVersion.version_label.charCodeAt(0) + 1)
          : 'A';

        const { data: newVersion } = await supabase.from('track_versions').insert({
          track_id: trackId,
          audio_url: finalAudioUrl,
          duration_seconds: Math.round(clip.duration) || null,
          version_type: 'replace_section',
          version_label: nextLabel,
          is_primary: false,
          metadata: {
            suno_id: clip.id,
            suno_task_id: task.suno_task_id,
            replace_section: true,
            original_task_id: task.id,
          },
        }).select().single();

        logger.success('Replace section version created', { versionLabel: nextLabel });

        // Update task with completion
        await supabase.from('generation_tasks').update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          callback_received_at: new Date().toISOString(),
          audio_clips: JSON.stringify(clips),
          received_clips: 1,
        }).eq('id', task.id);

        // Get section timing from started log
        let sectionStart = 0;
        let sectionEnd = 0;
        try {
          const { data: startedLog } = await supabase
            .from('track_change_log')
            .select('metadata')
            .eq('track_id', trackId)
            .eq('change_type', 'replace_section_started')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          if (startedLog?.metadata) {
            const meta = startedLog.metadata as { infillStartS?: number; infillEndS?: number };
            sectionStart = meta.infillStartS ?? 0;
            sectionEnd = meta.infillEndS ?? 0;
          }
        } catch (e) {
          logger.warn('Could not fetch section timing from started log');
        }

        // Log completion with timing info
        await supabase.from('track_change_log').insert({
          track_id: trackId,
          user_id: task.user_id,
          change_type: 'replace_section_completed',
          changed_by: 'suno_api',
          version_id: newVersion?.id,
          metadata: {
            taskId: task.suno_task_id,
            audioUrl: finalAudioUrl,
            versionLabel: nextLabel,
            infillStartS: sectionStart,
            infillEndS: sectionEnd,
          },
        });

        // Log to content_audit_log for deposition/copyright proof
        await logAuditAction(supabaseUrl, supabaseServiceKey, {
          entityType: 'track',
          entityId: trackId,
          userId: task.user_id,
          actorType: 'ai',
          aiModelUsed: clip.model_name || 'suno-chirp-v4',
          actionType: 'section_replaced',
          actionCategory: 'modification',
          contentUrl: finalAudioUrl,
          promptUsed: task.prompt,
          inputMetadata: {
            suno_task_id: task.suno_task_id,
            section_start: sectionStart,
            section_end: sectionEnd,
            version_label: nextLabel,
          },
          outputMetadata: {
            audio_url: finalAudioUrl,
            duration_seconds: Math.round(clip.duration),
            version_id: newVersion?.id,
          },
          chainId: task.id,
        });

        // Send notification with audio file
        if (task.telegram_chat_id) {
          // Get track title
          const { data: trackData } = await supabase
            .from('tracks')
            .select('title, cover_url')
            .eq('id', trackId)
            .single();
          
          await supabase.functions.invoke('send-telegram-notification', {
            body: {
              type: 'section_replaced',
              chatId: task.telegram_chat_id,
              trackId,
              audioUrl: finalAudioUrl,
              title: trackData?.title || 'Новая секция',
              coverUrl: trackData?.cover_url,
              versionLabel: nextLabel,
              message: `Секция трека успешно заменена! Версия ${nextLabel}`,
            },
          });
        }

        await supabase.from('notifications').insert({
          user_id: task.user_id,
          type: 'section_replaced',
          title: 'Секция заменена 🎵',
          message: 'Новая версия секции готова для прослушивания',
          action_url: `/studio/${trackId}`,
          group_key: `section_${task.id}`,
          metadata: { taskId: task.id, trackId },
          priority: 6,
        });

        return new Response(JSON.stringify({ success: true, callbackType: 'replace_section_complete' }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }

      // For other callback types in replace_section mode, just acknowledge
      return new Response(JSON.stringify({ success: true, callbackType }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    if (callbackType === 'first') {
      logger.info('First clip ready for streaming');
      const firstClip = audioData?.[0];
      if (firstClip) {
        const streamUrl = getStreamUrl(firstClip);
        const imageUrl = getImageUrl(firstClip);
        
        logger.debug('First clip data', { id: firstClip.id, title: firstClip.title, hasStream: !!streamUrl, hasImage: !!imageUrl });

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
              logger.success('Version A created', { versionId: newVersion.id });
            }
          }

          await supabase.from('generation_tasks').update({
            audio_clips: JSON.stringify([firstClip]),
            received_clips: 1,
            status: 'streaming_ready',
          }).eq('id', task.id);

          // Send progress notification to Telegram - update existing message if available
          if (task.telegram_chat_id) {
            try {
              const notificationBody = task.telegram_message_id
                ? {
                    type: 'progress_update',
                    chatId: task.telegram_chat_id,
                    messageId: task.telegram_message_id,
                    title: firstClip.title || task.prompt?.substring(0, 50) || 'Трек',
                    progress: 70,
                    message: '🎵 Первая версия готова, обрабатываем...',
                  }
                : {
                    type: 'progress',
                    chatId: task.telegram_chat_id,
                    trackId,
                    title: firstClip.title || task.prompt?.substring(0, 50) || 'Трек',
                    progress: 70,
                    message: '🎵 Первая версия готова, обрабатываем...',
                  };
              
              await supabase.functions.invoke('send-telegram-notification', {
                body: notificationBody,
              });
            } catch (progressErr) {
              logger.warn('Failed to send progress notification', { error: progressErr });
            }
          }
        }
      }

    } else if (callbackType === 'complete') {
      logger.info('Generation complete', { clipsCount: audioData?.length });
      const clips = audioData || [];
      
      if (clips.length === 0) throw new Error('No audio clips in completion callback');

      const versionLabels = ['A', 'B', 'C', 'D', 'E'];
      let trackTitle = '';

      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        const versionLabel = versionLabels[i] || `V${i + 1}`;
        const audioUrl = getAudioUrl(clip);
        const streamUrl = getStreamUrl(clip);
        
        logger.debug('Processing clip', { index: i, versionLabel, id: clip.id, duration: clip.duration, hasAudio: !!audioUrl });

        if (!audioUrl) {
          logger.error('No audio URL for clip', null, { clipIndex: i });
          continue;
        }

        let localAudioUrl = null;

        try {
          // Use retry logic with exponential backoff (3 attempts: 2s, 4s, 8s delays)
          logger.info('Downloading audio with retry', { versionLabel, url: audioUrl.substring(0, 100) });
          const audioResponse = await fetchWithRetry(audioUrl, 3, 2000);

          const audioBlob = await audioResponse.blob();
          const audioFileName = `tracks/${task.user_id}/${trackId}_v${versionLabel}_${Date.now()}.mp3`;

          const { data: audioUpload, error: uploadError } = await supabase.storage
            .from('project-assets')
            .upload(audioFileName, audioBlob, { contentType: 'audio/mpeg', upsert: true });

          if (uploadError) {
            logger.error('Storage upload failed', uploadError, { versionLabel });
          } else if (audioUpload) {
            localAudioUrl = supabase.storage.from('project-assets').getPublicUrl(audioFileName).data.publicUrl;
            logger.success('Audio downloaded and uploaded to storage', { versionLabel, fileName: audioFileName });
          }
        } catch (e) {
          logger.error('Audio download failed after all retries', e, { clipIndex: i, versionLabel });
          // Continue processing - will use Suno's URL as fallback
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
          logger.success('Version updated', { versionLabel });
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
          logger.success('Version created', { versionLabel });
        }

        // Extract project_track_id from task metadata for linking
        const taskMeta = typeof task.audio_clips === 'string' 
          ? JSON.parse(task.audio_clips || '{}') 
          : (task.audio_clips || {});
        const projectTrackIdFromMeta = taskMeta?.project_track_id;

        if (i === 0) {
          logger.db('UPDATE', 'tracks');
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
            // Link track to project and project_track
            project_id: task.tracks?.project_id || null,
            project_track_id: projectTrackIdFromMeta || null,
          }).eq('id', trackId);
          logger.success('Main track updated', { 
            projectId: task.tracks?.project_id, 
            projectTrackId: projectTrackIdFromMeta 
          });
        }

        await supabase.from('track_change_log').insert({
          track_id: trackId, user_id: task.user_id, change_type: 'version_created',
          changed_by: 'suno_api', ai_model_used: clip.model_name || 'chirp-v4',
          prompt_used: task.prompt, new_value: versionLabel,
          metadata: { version_label: versionLabel, clip_index: i, suno_clip_id: clip.id, title: trackTitle },
        });
      }

      // Generate custom MusicVerse cover (one cover for all versions)
      logger.info('Generating MusicVerse cover');
      try {
        const { error: coverError } = await supabase.functions.invoke('generate-track-cover', {
          body: {
            trackId,
            title: trackTitle,
            style: task.tracks?.style || clips[0]?.tags || '',
            lyrics: clips[0]?.prompt || task.prompt || '',
            userId: task.user_id,
            projectId: task.tracks?.project_id || null,
          },
        });
        
        if (coverError) {
          logger.error('Cover generation error', coverError);
        } else {
          logger.success('MusicVerse cover generated');
        }
      } catch (coverErr) {
        logger.error('Cover generation invoke error', coverErr);
      }

      // Link generated track to project_track if planTrackId was provided
      const taskMetadata = typeof task.audio_clips === 'string' ? JSON.parse(task.audio_clips || '{}') : (task.audio_clips || {});
      const projectTrackId = taskMetadata?.project_track_id;
      
      if (projectTrackId) {
        logger.info('Linking track to project_track', { projectTrackId, trackId });
        await supabase.from('project_tracks').update({
          track_id: trackId,
          status: 'completed',
        }).eq('id', projectTrackId);
      }

      // Handle studio project integration for add_instrumental mode
      const studioProjectId = taskMetadata?.studio_project_id;
      const pendingTrackId = taskMetadata?.pending_track_id;
      
      if (studioProjectId && pendingTrackId && task.generation_mode === 'add_instrumental') {
        logger.info('Updating studio project with instrumental versions', { studioProjectId, pendingTrackId });
        
        try {
          // Fetch current studio project
          const { data: studioProject, error: studioError } = await supabase
            .from('studio_projects')
            .select('tracks')
            .eq('id', studioProjectId)
            .single();
          
          if (studioError || !studioProject) {
            logger.error('Studio project not found', studioError);
          } else {
            // Prepare versions from clips (A/B)
            const versions = clips.slice(0, 2).map((clip: any, i: number) => ({
              label: ['A', 'B'][i] || `V${i + 1}`,
              audioUrl: getAudioUrl(clip),
              duration: Math.round(clip.duration) || 180,
            }));
            
            // Update the pending track with versions
            const tracks = (studioProject.tracks as any[]) || [];
            const updatedTracks = tracks.map((track: any) => {
              if (track.id === pendingTrackId && track.status === 'pending') {
                return {
                  ...track,
                  status: 'ready',
                  versions,
                  audioUrl: versions[0]?.audioUrl,
                  activeVersionLabel: versions[0]?.label || 'A',
                  clips: versions[0] ? [{
                    id: `clip-${Date.now()}`,
                    trackId: track.id,
                    audioUrl: versions[0].audioUrl,
                    name: track.name.replace(' (генерация...)', ''),
                    startTime: 0,
                    duration: versions[0].duration,
                    trimStart: 0,
                    trimEnd: 0,
                    fadeIn: 0,
                    fadeOut: 0,
                  }] : [],
                  name: track.name.replace(' (генерация...)', ''),
                };
              }
              return track;
            });
            
            // Save updated studio project
            const { error: updateError } = await supabase
              .from('studio_projects')
              .update({
                tracks: updatedTracks,
                updated_at: new Date().toISOString(),
              })
              .eq('id', studioProjectId);
            
            if (updateError) {
              logger.error('Failed to update studio project', updateError);
            } else {
              logger.success('Studio project updated with instrumental versions', { versions: versions.length });
            }
          }
        } catch (studioErr) {
          logger.error('Studio project update error', studioErr);
        }
      }

      await supabase.from('generation_tasks').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        callback_received_at: new Date().toISOString(),
        audio_clips: JSON.stringify(clips),
        received_clips: clips.length,
      }).eq('id', task.id);

      // Log to content_audit_log for deposition/copyright proof
      const finalClip = clips[0];
      await logAuditAction(supabaseUrl, supabaseServiceKey, {
        entityType: 'track',
        entityId: trackId,
        userId: task.user_id,
        actorType: 'ai',
        aiModelUsed: finalClip?.model_name || task.model_used || 'suno-chirp-v4',
        actionType: 'generated',
        actionCategory: 'generation',
        contentUrl: finalClip ? getAudioUrl(finalClip) : undefined,
        promptUsed: task.prompt,
        inputMetadata: {
          suno_task_id: sunoTaskId,
          generation_mode: task.generation_mode,
          clips_count: clips.length,
          reference_audio_id: task.tracks?.reference_audio_id || null,
          style: task.tracks?.style,
        },
        outputMetadata: {
          audio_url: finalClip ? getAudioUrl(finalClip) : null,
          duration_seconds: finalClip?.duration,
          title: trackTitle,
          tags: finalClip?.tags,
        },
        chainId: task.id, // Use task ID as chain ID
      });

      // Check if user is admin - admins don't get credits deducted
      const { data: isAdmin } = await supabase.rpc('has_role', { 
        _user_id: task.user_id, 
        _role: 'admin' 
      });

      // Deduct credits from user balance for generation (non-admin users only)
      if (!isAdmin) {
        try {
          logger.info('Deducting generation credits from user (atomic RPC)', { userId: task.user_id, cost: GENERATION_COST });

          // Use atomic RPC function to prevent race conditions
          const { data: deductResult, error: deductError } = await supabase
            .rpc('deduct_generation_credits', {
              p_user_id: task.user_id,
              p_cost: GENERATION_COST,
              p_description: `Генерация трека: ${clips[0]?.title || 'Трек'}`,
              p_metadata: {
                trackId,
                clips: clips.length,
                model: task.model_used,
              },
            });

          if (deductError) {
            logger.error('Failed to deduct credits via RPC', deductError);
          } else if (deductResult && deductResult.length > 0) {
            const { new_balance, success, message } = deductResult[0];
            if (success) {
              logger.success('Credits deducted successfully (atomic)', { newBalance: new_balance });
            } else {
              logger.warn('Credit deduction failed', { message, balance: new_balance });
            }
          }
        } catch (deductErr) {
          logger.error('Credit deduction error', deductErr);
        }
      } else {
        logger.info('Admin user - skipping credit deduction, using shared API balance', { userId: task.user_id });
      }

      // Reward user with XP for completing generation (no credits, just XP)
      try {
        logger.info('Rewarding user XP for generation completion');
        await supabase.functions.invoke('reward-action', {
          body: {
            userId: task.user_id,
            actionType: 'generation_complete',
            metadata: { trackId, clips: clips.length },
          },
        });
        logger.success('Generation XP reward granted');
      } catch (rewardErr) {
        logger.error('Reward action error', rewardErr);
      }

      // Create in-app notification for generation completion (with auto-replace via group_key)
      try {
        logger.info('Creating generation complete notification');
        await supabase.from('notifications').insert({
          user_id: task.user_id,
          title: '🎵 Трек готов!',
          message: `Ваш трек "${trackTitle}" успешно сгенерирован (${clips.length} версии)`,
          type: 'success',
          action_url: `/library?track=${trackId}`,
          group_key: `generation_${task.id}`,
          metadata: { taskId: task.id, trackId, trackTitle, clipsCount: clips.length },
          priority: 8,
          read: false,
        });
        logger.success('Generation notification created');
      } catch (notifErr) {
        logger.error('Notification creation error', notifErr);
      }

      if (task.telegram_chat_id && clips.length > 0) {
        // Delete progress message before sending audio results
        if (task.telegram_message_id) {
          logger.info('Deleting progress message before sending results');
          try {
            await supabase.functions.invoke('send-telegram-notification', {
              body: {
                type: 'delete_progress',
                chatId: task.telegram_chat_id,
                messageId: task.telegram_message_id,
              },
            });
          } catch (deleteErr) {
            logger.warn('Failed to delete progress message', { error: deleteErr });
          }
        }
        
        // Wait for cover generation to complete
        logger.info('Waiting for cover generation to complete');
        await new Promise(resolve => setTimeout(resolve, 6000));
        
        // Fetch fresh track data with generated cover
        const { data: freshTrackData, error: freshTrackError } = await supabase
          .from('tracks')
          .select('title, style, cover_url, local_cover_url, tags')
          .eq('id', trackId)
          .single();
        
        logger.debug('Fresh track data', {
          title: freshTrackData?.title,
          hasCover: !!freshTrackData?.cover_url,
          hasLocalCover: !!freshTrackData?.local_cover_url,
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
        logger.info('Sending track versions to Telegram', { count: maxClipsToSend });
        
        // Prepare all audio clips data with metadata
        const audioClipsData = [];
        for (let i = 0; i < maxClipsToSend; i++) {
          const clip = clips[i];
          const versionLabel = ['A', 'B', 'C', 'D', 'E'][i] || `V${i + 1}`;
          
          // Extract lyrics preview (first 2 non-tag lines)
          const lyricsPreview = (clip.prompt || task.prompt || '')
            .split('\n')
            .filter((line: string) => line.trim() && !line.trim().startsWith('['))
            .slice(0, 2)
            .join('\n')
            .substring(0, 150);
          
          audioClipsData.push({
            audioUrl: getAudioUrl(clip),
            title: `${notifyTitle} (${versionLabel})`,
            duration: clip.duration,
            versionLabel,
            lyricsPreview,
            coverUrl: generatedCoverUrl, // Same cover for all versions
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
            logger.error('Telegram multi notification error', notifyError);
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
            logger.success('Telegram multi notification sent');
          }
        } catch (err) {
          logger.error('Telegram invoke error', err);
        }
      } else {
        logger.info('No Telegram notification', { hasChatId: !!task.telegram_chat_id, clipsCount: clips.length });
      }

      // Auto MIDI transcription if enabled in user settings
      try {
        const { data: userSettings } = await supabase
          .from('user_notification_settings')
          .select('auto_midi_enabled, auto_midi_model, auto_midi_stems_only')
          .eq('user_id', task.user_id)
          .single();

        if (userSettings?.auto_midi_enabled && !userSettings?.auto_midi_stems_only) {
          const primaryAudioUrl = clips[0] ? getAudioUrl(clips[0]) : null;
          if (primaryAudioUrl) {
            logger.info('Auto MIDI transcription enabled, starting transcription');
            const { error: midiError } = await supabase.functions.invoke('transcribe-midi', {
              body: {
                track_id: trackId,
                audio_url: primaryAudioUrl,
                model_type: userSettings.auto_midi_model || 'basic-pitch',
                auto_select: false,
              },
            });
            
            if (midiError) {
              logger.error('Auto MIDI transcription error', midiError);
            } else {
              logger.success('Auto MIDI transcription started');
            }
          }
        }
      } catch (midiErr) {
        logger.error('Auto MIDI settings check error', midiErr);
      }

      const versionText = clips.length > 1 ? ` (${clips.length} версии)` : '';
      await supabase.from('notifications').insert({
        user_id: task.user_id, type: 'track_generated',
        title: 'Генерация завершена 🎵', message: `Ваш трек готов${versionText}`,
        action_url: trackId ? `/track/${trackId}` : '/library',
      });
    }

    return new Response(JSON.stringify({ success: true, callbackType }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

  } catch (error: any) {
    logger.error('Callback processing error', error);
    return new Response(JSON.stringify({ success: false, error: error.message || 'Unknown error' }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});
