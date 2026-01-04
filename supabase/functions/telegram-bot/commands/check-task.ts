import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BOT_CONFIG } from '../config.ts';
import { editMessageText } from '../telegram-api.ts';

const supabase = createClient(
  BOT_CONFIG.supabaseUrl,
  BOT_CONFIG.supabaseServiceKey
);

// Helper to escape markdown special characters
function escapeMarkdown(text: string): string {
  // Escape markdown special characters for Telegram MarkdownV2
  return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

export async function handleCheckTask(
  chatId: number, 
  userId: number, 
  taskId: string,
  messageId?: number
) {
  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', userId)
      .single();

    if (!profile) {
      if (messageId) {
        await editMessageText(
          chatId,
          messageId,
          '❌ Пользователь не найден\\. Войдите в приложение сначала\\.',
          { inline_keyboard: [[{ text: '⬅️ Назад', callback_data: 'status' }]] }
        );
      }
      return;
    }

    // Get task details with track info
    const { data: task, error: taskError } = await supabase
      .from('generation_tasks')
      .select('*, tracks(*)')
      .eq('id', taskId)
      .eq('user_id', profile.user_id)
      .single();

    if (taskError || !task) {
      if (messageId) {
        await editMessageText(
          chatId,
          messageId,
          '❌ Задача не найдена',
          { inline_keyboard: [[{ text: '⬅️ Назад', callback_data: 'status' }]] }
        );
      }
      return;
    }

    // If task doesn't have suno_task_id, can't check status
    if (!task.suno_task_id) {
      if (messageId) {
        await editMessageText(
          chatId,
          messageId,
          '❌ Задача ещё не начала генерацию в Suno API',
          { inline_keyboard: [[{ text: '⬅️ Назад', callback_data: 'status' }]] }
        );
      }
      return;
    }

    // Call Suno API to check status
    const sunoApiKey = Deno.env.get('SUNO_API_KEY');
    if (!sunoApiKey) {
      throw new Error('SUNO_API_KEY not configured');
    }

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
      throw new Error(`Suno API error: ${sunoResponse.status}`);
    }

    const sunoData = await sunoResponse.json();

    if (sunoData.code !== 200) {
      if (messageId) {
        await editMessageText(
          chatId,
          messageId,
          `❌ Ошибка при проверке статуса: ${escapeMarkdown(sunoData.msg || 'Unknown error')}`,
          { inline_keyboard: [[{ text: '⬅️ Назад', callback_data: 'status' }]] }
        );
      }
      return;
    }

    const taskData = sunoData.data;
    const promptEscaped = escapeMarkdown(task.prompt.substring(0, 100));
    let statusText = `🔍 *Проверка трека*\n\n`;
    statusText += `📝 Промпт: ${promptEscaped}${task.prompt.length > 100 ? '\\.\\.\\.' : ''}\n\n`;
    
    // Map status
    const statusMap: Record<string, string> = {
      'PENDING': '⏳ В очереди',
      'TEXT_SUCCESS': '📝 Текст готов',
      'FIRST_SUCCESS': '🎵 Первый клип готов',
      'SUCCESS': '✅ Готово',
      'CREATE_TASK_FAILED': '❌ Ошибка создания',
      'GENERATE_AUDIO_FAILED': '❌ Ошибка генерации',
      'CALLBACK_EXCEPTION': '❌ Ошибка обратного вызова',
      'SENSITIVE_WORD_ERROR': '❌ Обнаружены недопустимые слова'
    };

    statusText += `📊 Статус: ${statusMap[taskData.status] || taskData.status}\n`;
    statusText += `🎼 Тип: ${escapeMarkdown(taskData.type || 'N/A')}\n`;
    
    if (taskData.errorMessage) {
      statusText += `\n⚠️ Ошибка: ${escapeMarkdown(taskData.errorMessage)}`;
    }

    // Define proper types for Suno API response
    interface SunoClip {
      id?: string;
      title?: string;
      audioUrl?: string;
      imageUrl?: string;
      duration?: number;
      modelName?: string;
      tags?: string[];
      lyric?: string;
    }

    interface InlineKeyboardButton {
      text: string;
      callback_data: string;
    }

    const trackButtons: InlineKeyboardButton[][] = [];

    if (taskData.response?.sunoData && taskData.response.sunoData.length > 0) {
      const clips = taskData.response.sunoData as SunoClip[];
      statusText += `\n\n🎵 *Клипов создано:* ${clips.length}\n`;
      
      clips.forEach((clip: SunoClip, index: number) => {
        const clipTitle = clip.title || 'Без названия';
        statusText += `\n${index + 1}\\. ${escapeMarkdown(clipTitle)}\n`;
        statusText += `   ⏱️ Длительность: ${clip.duration ? Math.floor(clip.duration) + ' сек' : 'N/A'}\n`;
        statusText += `   🎨 Модель: ${escapeMarkdown(clip.modelName || 'N/A')}\n`;
      });

      // Update task status if SUCCESS and download audio files
      if (taskData.status === 'SUCCESS' && task.status !== 'completed') {
        const firstClip = clips[0];
        
        if (firstClip && task.track_id) {
          // Download and save audio to storage
          let localAudioUrl = null;

          try {
            if (firstClip.audioUrl) {
              // Download audio
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

            // Skip downloading Suno's cover - we'll generate custom MusicVerse cover
            // Update track with audio data (cover will be set by generate-track-cover)
            await supabase
              .from('tracks')
              .update({
                status: 'completed',
                audio_url: firstClip.audioUrl,
                streaming_url: firstClip.audioUrl,
                local_audio_url: localAudioUrl,
                title: firstClip.title || task.tracks?.title,
                duration_seconds: firstClip.duration || null,
                tags: firstClip.tags || task.tracks?.tags,
                lyrics: firstClip.lyric || task.tracks?.lyrics,
                suno_id: firstClip.id || null,
              })
              .eq('id', task.track_id);

            // Create track version (cover will be updated by generate-track-cover)
            await supabase
              .from('track_versions')
              .insert({
                track_id: task.track_id,
                audio_url: firstClip.audioUrl,
                duration_seconds: firstClip.duration,
                version_type: 'original',
                is_primary: true,
              });

            // Generate custom MusicVerse cover (same as suno-music-callback)
            // Use direct HTTP call instead of supabase.functions.invoke for reliability
            console.log('Generating MusicVerse cover for track:', task.track_id);
            try {
              const coverResponse = await fetch(`${BOT_CONFIG.supabaseUrl}/functions/v1/generate-track-cover`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${BOT_CONFIG.supabaseServiceKey}`,
                },
                body: JSON.stringify({
                  trackId: task.track_id,
                  title: firstClip.title || task.tracks?.title,
                  style: task.tracks?.style || firstClip.tags || '',
                  lyrics: firstClip.lyric || task.prompt || '',
                  userId: task.user_id,
                  projectId: task.tracks?.project_id || null,
                }),
              });
              
              if (!coverResponse.ok) {
                const errorText = await coverResponse.text();
                console.error('Cover generation error:', coverResponse.status, errorText);
              } else {
                console.log('MusicVerse cover generation started');
              }
            } catch (coverErr) {
              console.error('Cover generation invoke error:', coverErr);
            }

            // Log completion
            await supabase
              .from('track_change_log')
              .insert({
                track_id: task.track_id,
                user_id: task.user_id,
                change_type: 'generation_completed',
                changed_by: 'telegram_bot_sync',
                metadata: {
                  clips: clips.length,
                  duration: firstClip.duration,
                  synced_from_check: true,
                },
              });

          } catch (downloadError) {
            console.error('Error downloading and saving files:', downloadError);
          }
        }

        // Update task to completed
        await supabase
          .from('generation_tasks')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString(),
            callback_received_at: new Date().toISOString(),
            audio_clips: clips,
          })
          .eq('id', taskId);
        
        statusText += `\n\n✅ Трек синхронизирован с БД`;

        // Add listen button if track available
        if (task.track_id) {
          trackButtons.push([
            { text: '🎵 Прослушать', callback_data: `track_details_${task.track_id}` }
          ]);
        }
      }
    }

    // Handle failed status
    if (taskData.status.includes('FAILED') || taskData.status.includes('ERROR')) {
      await supabase
        .from('generation_tasks')
        .update({ 
          status: 'failed',
          error_message: taskData.errorMessage || 'Generation failed',
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (task.track_id) {
        await supabase
          .from('tracks')
          .update({ 
            status: 'failed',
            error_message: taskData.errorMessage || 'Generation failed'
          })
          .eq('id', task.track_id);
      }
      
      statusText += `\n\n❌ Статус обновлён на "ошибка"`;
    }

    // Build keyboard
    const keyboard = [
      ...trackButtons,
      [{ text: '🔄 Проверить ещё раз', callback_data: `check_task_${taskId}` }],
      [{ text: '⬅️ Назад к статусу', callback_data: 'status' }]
    ];

    if (messageId) {
      await editMessageText(
        chatId,
        messageId,
        statusText,
        { inline_keyboard: keyboard }
      );
    }

  } catch (error) {
    console.error('Error in handleCheckTask:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (messageId) {
      await editMessageText(
        chatId,
        messageId,
        `❌ Ошибка при проверке: ${escapeMarkdown(errorMessage)}`,
        { inline_keyboard: [[{ text: '⬅️ Назад', callback_data: 'status' }]] }
      );
    }
  }
}