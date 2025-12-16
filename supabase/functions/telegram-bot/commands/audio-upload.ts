/**
 * Audio upload commands for creating covers and extending tracks via Telegram bot
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BOT_CONFIG } from '../config.ts';
import { sendMessage, editMessageText, deleteMessage } from '../telegram-api.ts';
import { setPendingUpload, cancelPendingUpload, hasPendingUpload } from '../core/db-session-store.ts';
import { escapeMarkdown } from '../utils/index.ts';

const supabase = createClient(
  BOT_CONFIG.supabaseUrl,
  BOT_CONFIG.supabaseServiceKey
);

/**
 * /cover command - initiate cover creation from audio
 */
export async function handleCoverCommand(
  chatId: number, 
  userId: number, 
  args: string,
  messageId?: number,
  deleteOriginal?: boolean
): Promise<void> {
  // Parse arguments for options
  const options = parseAudioOptions(args);
  
  // Set pending upload for user (now async with DB)
  await setPendingUpload(userId, 'cover', options);
  
  const text = `🎵 *Создание кавера*

Отправьте аудиофайл \\(MP3, WAV, OGG\\) для создания кавер\\-версии\\.

${options.prompt ? `📝 Описание: _${escapeMarkdown(options.prompt)}_\n` : ''}${options.style ? `🎨 Стиль: _${escapeMarkdown(options.style)}_\n` : ''}${options.instrumental ? '🎸 Режим: _Инструментал_\n' : ''}

⏳ Ожидание аудио\\.\\.\\. \\(15 минут\\)
❌ Отмена: /cancel`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '❌ Отмена', callback_data: 'cancel_upload' },
        { text: '📱 Открыть в приложении', url: `${BOT_CONFIG.deepLinkBase}?startapp=upload_cover` }
      ]
    ]
  };

  if (messageId && deleteOriginal) {
    await deleteMessage(chatId, messageId);
    await sendMessage(chatId, text, keyboard);
  } else if (messageId) {
    const result = await editMessageText(chatId, messageId, text, keyboard);
    if (!result) {
      await deleteMessage(chatId, messageId);
      await sendMessage(chatId, text, keyboard);
    }
  } else {
    await sendMessage(chatId, text, keyboard);
  }
}

/**
 * /extend command - initiate track extension from audio
 */
export async function handleExtendCommand(
  chatId: number, 
  userId: number, 
  args: string,
  messageId?: number,
  deleteOriginal?: boolean
): Promise<void> {
  const options = parseAudioOptions(args);
  
  await setPendingUpload(userId, 'extend', options);
  
  const text = `🔄 *Расширение трека*

Отправьте аудиофайл \\(MP3, WAV, OGG\\) для продолжения/расширения\\.

${options.prompt ? `📝 Текст: _${escapeMarkdown(options.prompt)}_\n` : ''}${options.style ? `🎨 Стиль: _${escapeMarkdown(options.style)}_\n` : ''}${options.title ? `📛 Название: _${escapeMarkdown(options.title)}_\n` : ''}

⏳ Ожидание аудио\\.\\.\\. \\(15 минут\\)
❌ Отмена: /cancel`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '❌ Отмена', callback_data: 'cancel_upload' },
        { text: '📱 Открыть в приложении', url: `${BOT_CONFIG.deepLinkBase}?startapp=upload_extend` }
      ]
    ]
  };

  if (messageId && deleteOriginal) {
    await deleteMessage(chatId, messageId);
    await sendMessage(chatId, text, keyboard);
  } else if (messageId) {
    const result = await editMessageText(chatId, messageId, text, keyboard);
    if (!result) {
      await deleteMessage(chatId, messageId);
      await sendMessage(chatId, text, keyboard);
    }
  } else {
    await sendMessage(chatId, text, keyboard);
  }
}

/**
 * /cancel command - cancel pending upload
 */
export async function handleCancelCommand(
  chatId: number,
  userId: number
): Promise<void> {
  const cancelled = await cancelPendingUpload(userId);
  if (cancelled) {
    await sendMessage(chatId, '✅ Загрузка аудио отменена\\.');
  } else {
    await sendMessage(chatId, 'ℹ️ Нет активных ожиданий загрузки\\.');
  }
}

/**
 * Handle cancel_upload callback
 */
export async function handleCancelUploadCallback(
  chatId: number,
  userId: number,
  messageId: number,
  callbackId: string
): Promise<void> {
  await cancelPendingUpload(userId);
  
  const { answerCallbackQuery } = await import('../telegram-api.ts');
  await answerCallbackQuery(callbackId, '✅ Загрузка отменена');
  
  await editMessageText(chatId, messageId, '✅ Загрузка аудио отменена\\.');
}

/**
 * Get file info from Telegram API
 */
async function getFileInfo(fileId: string): Promise<any> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');

  const response = await fetch(`https://api.telegram.org/bot${botToken}/getFile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_id: fileId }),
  });

  const data = await response.json();

  if (!data.ok || !data.result) {
    throw new Error('Failed to get file info from Telegram');
  }

  return data.result;
}

/**
 * Handle audio action callback (when user clicks inline button after sending audio)
 */
export async function handleAudioActionCallback(
  chatId: number,
  userId: number,
  action: string,
  messageId: number,
  callbackId: string
): Promise<void> {
  const { answerCallbackQuery } = await import('../telegram-api.ts');
  const { consumePendingAudio, getPendingAudioWithoutConsuming } = await import('../core/db-session-store.ts');

  // For show_lyrics and transcribe, we don't consume the audio data (can be reused)
  if (action === 'show_lyrics') {
    const audioData = await getPendingAudioWithoutConsuming(userId);
    if (!audioData?.analysisResult?.lyrics) {
      await answerCallbackQuery(callbackId, '❌ Текст не найден');
      return;
    }
    
    await answerCallbackQuery(callbackId, '📝 Показываю текст...');
    
    const lyrics = audioData.analysisResult.lyrics;
    const lyricsText = lyrics.length > 3000 ? lyrics.substring(0, 3000) + '...' : lyrics;
    
    await editMessageText(chatId, messageId, `📝 *Текст песни:*

_${escapeMarkdown(lyricsText)}_

Выберите действие:`, {
      inline_keyboard: [
        [
          { text: '🎤 Создать кавер', callback_data: 'audio_action_cover' },
          { text: '➕ Расширить', callback_data: 'audio_action_extend' }
        ],
        [
          { text: '📤 Сохранить в облако', callback_data: 'audio_action_upload' }
        ]
      ]
    });
    return;
  }

  if (action === 'transcribe') {
    const audioData = await getPendingAudioWithoutConsuming(userId);
    if (!audioData) {
      await answerCallbackQuery(callbackId, '⚠️ Аудио файл истёк. Отправьте снова.');
      return;
    }
    
    await answerCallbackQuery(callbackId, '🎼 Распознаю текст...');
    await editMessageText(chatId, messageId, `🎼 *Распознаю текст песни\\.\\.\\.*\n\n⏳ Это может занять 30\\-60 секунд\\.`);
    
    try {
      // Get file URL and transcribe
      const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
      const fileResponse = await fetch(`https://api.telegram.org/bot${botToken}/getFile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: audioData.fileId }),
      });
      const fileData = await fileResponse.json();
      
      if (!fileData.ok) {
        throw new Error('Failed to get file');
      }
      
      const fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
      
      // Download and upload to storage for analysis
      const audioResponse = await fetch(fileUrl);
      const audioBuffer = await audioResponse.arrayBuffer();
      
      const fileName = `temp-transcribe/${userId}/${Date.now()}.mp3`;
      const { error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(fileName, new Uint8Array(audioBuffer), {
          contentType: 'audio/mpeg',
          upsert: true,
        });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('project-assets')
        .getPublicUrl(fileName);
      
      // Call transcribe-lyrics
      const { data: transcribeData, error: transcribeError } = await supabase.functions.invoke(
        'transcribe-lyrics',
        {
          body: { audio_url: publicUrl, analyze_style: true },
        }
      );
      
      if (transcribeError) throw transcribeError;
      
      if (transcribeData?.lyrics) {
        const lyrics = transcribeData.lyrics;
        const lyricsText = lyrics.length > 2500 ? lyrics.substring(0, 2500) + '...' : lyrics;
        
        // Update stored analysis with lyrics
        const { updatePendingAudioAnalysis } = await import('../core/db-session-store.ts');
        await updatePendingAudioAnalysis(userId, {
          lyrics,
          hasVocals: transcribeData.has_vocals,
          genre: transcribeData.analysis?.genre,
          mood: transcribeData.analysis?.mood,
        });
        
        await editMessageText(chatId, messageId, `✅ *Текст распознан\\!*

📝 *Лирика:*
_${escapeMarkdown(lyricsText)}_

Выберите действие:`, {
          inline_keyboard: [
            [
              { text: '🎤 Создать кавер', callback_data: 'audio_action_cover' },
              { text: '➕ Расширить', callback_data: 'audio_action_extend' }
            ],
            [
              { text: '📤 Сохранить в облако', callback_data: 'audio_action_upload' }
            ]
          ]
        });
      } else if (transcribeData?.has_vocals === false) {
        await editMessageText(chatId, messageId, `🎸 *Инструментальный трек*

В этом аудио не обнаружен вокал\\.

Выберите действие:`, {
          inline_keyboard: [
            [
              { text: '🎤 Создать кавер', callback_data: 'audio_action_cover' },
              { text: '➕ Расширить', callback_data: 'audio_action_extend' }
            ],
            [
              { text: '📤 Сохранить в облако', callback_data: 'audio_action_upload' }
            ]
          ]
        });
      } else {
        await editMessageText(chatId, messageId, `❌ Не удалось распознать текст\\. Попробуйте другой файл\\.`);
      }
    } catch (error) {
      const logger = (await import('../utils/index.ts')).logger;
      logger.error('Transcription failed', error);
      await editMessageText(chatId, messageId, `❌ Ошибка распознавания текста\\. Попробуйте позже\\.`);
    }
    return;
  }

  if (action === 'midi') {
    await answerCallbackQuery(callbackId, '🎹 MIDI конвертация...');
    // Don't consume - redirect to MIDI command flow
    const { handleMidiCommand } = await import('./midi.ts');
    await handleMidiCommand(chatId, userId);
    return;
  }

  // For cover/extend/upload actions - get the audio data (don't consume yet for cover/extend)
  const audioData = await getPendingAudioWithoutConsuming(userId);

  if (!audioData) {
    await answerCallbackQuery(callbackId, '⚠️ Аудио файл истёк. Отправьте снова.');
    return;
  }

  const styleFromAnalysis = audioData.analysisResult?.style;
  
  // Handle upload action - needs to re-process the file
  if (action === 'upload') {
    const consumedData = await consumePendingAudio(userId);
    if (!consumedData) {
      await answerCallbackQuery(callbackId, '⚠️ Аудио файл истёк');
      return;
    }
    await setPendingUpload(userId, 'upload', {});
    await answerCallbackQuery(callbackId, '📤 Загрузка в облако');
    
    try {
      const fileInfo = await getFileInfo(consumedData.fileId);
      const audioObject = {
        file_id: consumedData.fileId,
        file_unique_id: fileInfo.file_unique_id || consumedData.fileId,
        duration: 0,
        file_size: fileInfo.file_size || 0,
      };
      
      await editMessageText(chatId, messageId, `✅ *Действие выбрано*\n\n⬇️ Загружаю в облако\\.\\.\\.`);
      
      const { handleAudioMessage } = await import('../handlers/audio.ts');
      await handleAudioMessage(chatId, userId, audioObject, consumedData.fileType as any);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await editMessageText(chatId, messageId, `❌ *Ошибка*\n\n${escapeMarkdown(errorMessage)}`);
    }
    return;
  }

  // For cover/extend - use existing reference_audio from DB (audio already uploaded and analyzed)
  if (action === 'cover' || action === 'extend') {
    await answerCallbackQuery(callbackId, action === 'cover' ? '🎤 Создание кавера' : '➕ Расширение трека');
    
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('telegram_id', userId)
        .single();

      if (!profile) {
        await editMessageText(chatId, messageId, '❌ Профиль не найден\\. Откройте Mini App\\.');
        return;
      }

      // Find the reference_audio record by telegram_file_id
      const { data: refAudio, error: refError } = await supabase
        .from('reference_audio')
        .select('id, file_url, duration_seconds, style_description, genre, mood, transcription')
        .eq('user_id', profile.user_id)
        .eq('telegram_file_id', audioData.fileId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (refError || !refAudio?.file_url) {
        // Fallback: try to find by recent uploads
        const { data: recentAudio } = await supabase
          .from('reference_audio')
          .select('id, file_url, duration_seconds, style_description, genre, mood, transcription')
          .eq('user_id', profile.user_id)
          .eq('analysis_status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!recentAudio?.file_url) {
          await editMessageText(chatId, messageId, `❌ Аудио не найдено\\. Отправьте файл снова\\.`);
          return;
        }
        
        // Use recent audio
        await processGenerationWithReference(
          chatId, userId, profile.user_id, messageId, action, recentAudio, styleFromAnalysis
        );
        return;
      }

      // Use found reference audio
      await processGenerationWithReference(
        chatId, userId, profile.user_id, messageId, action, refAudio, styleFromAnalysis
      );

      // Consume audio data after successful initiation
      await consumePendingAudio(userId);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await editMessageText(chatId, messageId, `❌ *Ошибка*\n\n${escapeMarkdown(errorMessage)}\n\nПопробуйте отправить аудио ещё раз\\.`);
    }
    return;
  }

  await answerCallbackQuery(callbackId, '❌ Неизвестное действие');
}

/**
 * Process generation (cover/extend) using existing reference audio URL
 */
async function processGenerationWithReference(
  chatId: number,
  telegramUserId: number,
  supabaseUserId: string,
  messageId: number,
  action: 'cover' | 'extend',
  refAudio: { 
    id: string; 
    file_url: string; 
    duration_seconds?: number | null;
    style_description?: string | null;
    genre?: string | null;
    mood?: string | null;
    transcription?: string | null;
  },
  styleFromAnalysis?: string
): Promise<void> {
  const isExtend = action === 'extend';
  const modeText = isExtend ? 'расширения' : 'кавера';
  
  await editMessageText(chatId, messageId, `✅ *Действие выбрано*\n\n🎵 Отправляю на генерацию ${modeText}\\.\\.\\.`);

  // Build style prompt from analysis
  const stylePrompt = styleFromAnalysis || refAudio.style_description || 
    [refAudio.genre, refAudio.mood].filter(Boolean).join(', ') || 
    'modern music';

  try {
    const endpoint = isExtend ? 'suno-upload-extend' : 'suno-upload-cover';
    
    const { data, error } = await supabase.functions.invoke(endpoint, {
      body: {
        source: 'telegram_bot',
        userId: supabaseUserId,
        telegramChatId: chatId,
        audioUrl: refAudio.file_url,
        audioDuration: refAudio.duration_seconds,
        customMode: true,
        instrumental: false,
        style: stylePrompt,
        prompt: refAudio.transcription?.substring(0, 500) || undefined,
        model: 'V5',
      },
      headers: {
        'x-telegram-bot-secret': Deno.env.get('TELEGRAM_BOT_TOKEN') || '',
      },
    });

    if (error) {
      throw new Error(error.message || 'Generation failed');
    }

    if (!data?.success) {
      throw new Error(data?.error || 'No task ID received');
    }

    await editMessageText(chatId, messageId, `✅ *Генерация ${modeText} началась\\!*

⏳ Обычно занимает 2\\-4 минуты
🔔 Вы получите уведомление когда трек будет готов

🆔 Задача: \`${escapeMarkdown(data.taskId || 'N/A')}\``, {
      inline_keyboard: [
        [{ text: '📱 Открыть в приложении', web_app: { url: `${BOT_CONFIG.miniAppUrl}` } }],
        [{ text: '🏠 Меню', callback_data: 'nav_main' }]
      ]
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await editMessageText(chatId, messageId, `❌ *Ошибка генерации*

${escapeMarkdown(errorMessage)}

Попробуйте:
• Проверить формат файла
• Использовать файл меньшего размера
• Попробовать позже`, {
      inline_keyboard: [
        [{ text: '🔄 Попробовать снова', callback_data: `audio_action_${action}` }],
        [{ text: '🏠 Меню', callback_data: 'nav_main' }]
      ]
    });
  }
}

/**
 * Check upload status for a user
 */
export async function checkUploadPending(userId: number): Promise<boolean> {
  return await hasPendingUpload(userId);
}

/**
 * Parse audio options from command arguments
 */
function parseAudioOptions(args: string): {
  prompt?: string;
  style?: string;
  title?: string;
  instrumental?: boolean;
  model?: string;
} {
  const options: {
    prompt?: string;
    style?: string;
    title?: string;
    instrumental?: boolean;
    model?: string;
  } = {};
  
  let remaining = args;
  
  // Parse flags
  const flagRegex = /--([\w]+)(?:=("[^"]+"|'[^']+'|\S+))?/g;
  let match;
  
  while ((match = flagRegex.exec(args)) !== null) {
    const flag = match[1];
    const value = match[2]?.replace(/^["']|["']$/g, '') || 'true';
    
    switch (flag) {
      case 'instrumental':
        options.instrumental = true;
        break;
      case 'style':
        options.style = value;
        break;
      case 'title':
        options.title = value;
        break;
      case 'model':
        options.model = value.toUpperCase();
        break;
    }
    
    remaining = remaining.replace(match[0], '').trim();
  }
  
  // Remaining text is the prompt/description
  if (remaining.trim()) {
    options.prompt = remaining.trim();
  }
  
  return options;
}

/**
 * Get help text for audio upload commands
 */
export function getAudioUploadHelp(): string {
  return `🎵 *Загрузка аудио*

*Создание кавера:*
/cover \\- базовая команда
/cover энергичный рок \\- с описанием
/cover \\-\\-style="indie rock" \\-\\-instrumental \\- с параметрами

*Расширение трека:*
/extend \\- базовая команда  
/extend \\-\\-title="My Song Part 2" продолжение песни
/extend \\-\\-style="epic orchestra" \\-\\-model=V5

*Параметры:*
\\-\\-style="стиль" \\- музыкальный стиль
\\-\\-title="название" \\- название трека
\\-\\-instrumental \\- без вокала
\\-\\-model=V5 \\- модель генерации

*Поддерживаемые форматы:*
MP3, WAV, OGG, M4A \\(до 25MB\\)`;
}
