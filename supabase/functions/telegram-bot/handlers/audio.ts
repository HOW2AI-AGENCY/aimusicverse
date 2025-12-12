/**
 * Handler for processing audio messages received in Telegram bot
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BOT_CONFIG } from '../config.ts';
import { sendMessage, sendAudio } from '../telegram-api.ts';
import { consumePendingUpload, type PendingUpload, setPendingAudio } from '../core/db-session-store.ts';
import { escapeMarkdown, trackMetric } from '../utils/index.ts';
import { createLogger } from '../../_shared/logger.ts';

const logger = createLogger('telegram-audio-handler');

const supabase = createClient(
  BOT_CONFIG.supabaseUrl,
  BOT_CONFIG.supabaseServiceKey
);

interface TelegramAudio {
  file_id: string;
  file_unique_id: string;
  duration: number;
  performer?: string;
  title?: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

interface TelegramVoice {
  file_id: string;
  file_unique_id: string;
  duration: number;
  mime_type?: string;
  file_size?: number;
}

interface TelegramDocument {
  file_id: string;
  file_unique_id: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

/**
 * Handle incoming audio message
 */
export async function handleAudioMessage(
  chatId: number,
  userId: number,
  audio: TelegramAudio | TelegramVoice | TelegramDocument,
  type: 'audio' | 'voice' | 'document'
): Promise<void> {
  const startTime = Date.now();
  
  try {
    // Check for pending upload (now async with DB)
    const pendingUpload = await consumePendingUpload(userId);
    
    if (!pendingUpload) {
      // No pending upload - show help with inline keyboard options
      await sendMessage(chatId, `🎵 *Аудио получено\\!*

Выберите что хотите сделать:`, {
        inline_keyboard: [
          [
            { text: '🎤 Создать кавер', callback_data: 'audio_action_cover' },
            { text: '➕ Расширить трек', callback_data: 'audio_action_extend' }
          ],
          [
            { text: '📤 Загрузить в облако', callback_data: 'audio_action_upload' },
            { text: '🎼 Распознать песню', callback_data: 'audio_action_recognize' }
          ],
          [
            { text: '🎹 Конвертировать в MIDI', callback_data: 'audio_action_midi' }
          ]
        ]
      });
      
      // Store audio file_id for reuse when user selects action
      await storeTemporaryAudio(userId, audio.file_id, type);
      return;
    }
    
    // Handle 'upload' mode - save to cloud storage
    if (pendingUpload.mode === 'upload') {
      await handleCloudUpload(chatId, userId, audio, type, pendingUpload, startTime);
      return;
    }
    
    // Validate file size (max 25MB for Telegram)
    const fileSize = 'file_size' in audio ? audio.file_size || 0 : 0;
    if (fileSize > 25 * 1024 * 1024) {
      await sendMessage(chatId, '❌ Файл слишком большой \\(максимум 25MB\\)\\.');
      return;
    }
    
    // Get file info from Telegram
    const fileId = audio.file_id;
    
    await sendMessage(chatId, `⬇️ Загружаю аудиофайл\\.\\.\\.`);
    
    // Download file from Telegram
    const fileUrl = await getFileUrl(fileId);
    
    if (!fileUrl) {
      await sendMessage(chatId, '❌ Не удалось получить файл\\. Попробуйте ещё раз\\.');
      return;
    }
    
    await sendMessage(chatId, `📤 Обрабатываю и отправляю на генерацию\\.\\.\\.`);
    
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', userId)
      .single();
    
    if (!profile) {
      await sendMessage(chatId, '❌ Профиль не найден\\. Откройте Mini App для регистрации\\.');
      return;
    }
    
    // Download the audio file
    const audioResponse = await fetch(fileUrl);
    if (!audioResponse.ok) {
      throw new Error('Failed to download audio from Telegram');
    }
    
    const audioBlob = await audioResponse.blob();
    const audioBuffer = await audioBlob.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
    
    // Prepare filename
    const fileNameValue = 'file_name' in audio && audio.file_name ? audio.file_name : 
                     'title' in audio && audio.title ? `${audio.title}.mp3` : 
                     `telegram_audio_${Date.now()}.mp3`;
    
    // Determine mime type
    const mimeType = 'mime_type' in audio ? audio.mime_type || 'audio/mpeg' : 'audio/mpeg';
    
    // Call appropriate generation function
    const result = await processAudioUpload(
      profile.user_id,
      pendingUpload,
      {
        name: fileNameValue,
        type: mimeType,
        data: `data:${mimeType};base64,${base64Audio}`,
      },
      chatId
    );
    
    if (result.success) {
      const modeText = pendingUpload.mode === 'cover' ? 'кавера' : 'расширения';
      
      await sendMessage(chatId, `✅ *Генерация ${modeText} началась\\!*

⏳ Обычно занимает 2\\-4 минуты
🔔 Вы получите уведомление когда трек будет готов

🆔 Задача: \`${escapeMarkdown(result.taskId || 'N/A')}\``, {
        inline_keyboard: [[
          { text: '📱 Открыть в приложении', web_app: { url: `${BOT_CONFIG.miniAppUrl}` } }
        ]]
      });
      
      trackMetric({
        eventType: pendingUpload.mode === 'cover' ? 'cover_started' : 'extend_started',
        success: true,
        telegramChatId: chatId,
        responseTimeMs: Date.now() - startTime,
        metadata: { taskId: result.taskId },
      });
    } else {
      await sendMessage(chatId, `❌ *Ошибка при отправке на генерацию*

${escapeMarkdown(result.error || 'Неизвестная ошибка')}

Попробуйте:
• Проверить формат файла
• Использовать файл меньшего размера
• Попробовать позже`);
      
      trackMetric({
        eventType: pendingUpload.mode === 'cover' ? 'cover_failed' : 'extend_failed',
        success: false,
        telegramChatId: chatId,
        errorMessage: result.error,
        responseTimeMs: Date.now() - startTime,
      });
    }
    
  } catch (error) {
    logger.error('Error handling audio message', error);
    
    await sendMessage(chatId, `❌ Произошла ошибка при обработке аудио\\. Попробуйте ещё раз\\.`);
    
    trackMetric({
      eventType: 'audio_processing_error',
      success: false,
      telegramChatId: chatId,
      errorMessage: error instanceof Error ? error.message : String(error),
      responseTimeMs: Date.now() - startTime,
    });
  }
}

/**
 * Store temporary audio file_id for later processing
 */
async function storeTemporaryAudio(
  userId: number,
  fileId: string,
  type: 'audio' | 'voice' | 'document'
): Promise<void> {
  try {
    await setPendingAudio(userId, fileId, type);
  } catch (error) {
    logger.error('Error storing temporary audio', error);
  }
}

/**
 * Get file URL from Telegram
 */
async function getFileUrl(fileId: string): Promise<string | null> {
  try {
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getFile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id: fileId }),
    });
    
    const data = await response.json();
    
    if (!data.ok || !data.result?.file_path) {
      logger.warn('getFile failed', { data });
      return null;
    }
    
    return `https://api.telegram.org/file/bot${botToken}/${data.result.file_path}`;
  } catch (error) {
    logger.error('Error getting file URL', error);
    return null;
  }
}

/**
 * Handle cloud upload - save audio to storage without generation
 */
async function handleCloudUpload(
  chatId: number,
  userId: number,
  audio: TelegramAudio | TelegramVoice | TelegramDocument,
  type: 'audio' | 'voice' | 'document',
  pendingUpload: PendingUpload,
  startTime: number
): Promise<void> {
  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', userId)
      .single();

    if (!profile) {
      await sendMessage(chatId, '❌ Профиль не найден\\. Откройте Mini App для регистрации\\.');
      return;
    }

    await sendMessage(chatId, '⬇️ Загружаю файл в облако\\.\\.\\.');

    // Get file from Telegram
    const fileId = audio.file_id;
    const fileUrl = await getFileUrl(fileId);

    if (!fileUrl) {
      await sendMessage(chatId, '❌ Не удалось получить файл\\. Попробуйте ещё раз\\.');
      return;
    }

    // Download the audio file
    const audioResponse = await fetch(fileUrl);
    if (!audioResponse.ok) {
      throw new Error('Failed to download audio from Telegram');
    }

    const audioBlob = await audioResponse.blob();
    const audioBuffer = await audioBlob.arrayBuffer();

    // Prepare filename (sanitized)
    const originalName = 'file_name' in audio && audio.file_name 
      ? audio.file_name 
      : 'title' in audio && audio.title 
        ? `${audio.title}.mp3` 
        : `voice_${Date.now()}.ogg`;
    
    const extension = originalName.split('.').pop() || 'mp3';
    const sanitizedName = `audio_${Date.now()}.${extension}`;
    const storagePath = `${profile.user_id}/reference-audio/${sanitizedName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('reference-audio')
      .upload(storagePath, new Uint8Array(audioBuffer), {
        contentType: audioBlob.type || 'audio/mpeg',
        upsert: false,
      });

    if (uploadError) {
      logger.error('Cloud upload error', uploadError);
      await sendMessage(chatId, '❌ Ошибка загрузки файла\\. Попробуйте позже\\.');
      return;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('reference-audio')
      .getPublicUrl(storagePath);

    // Get duration if available
    const duration = 'duration' in audio ? audio.duration : null;

    // Save to reference_audio table
    const { data: savedRef, error: dbError } = await supabase
      .from('reference_audio')
      .insert({
        user_id: profile.user_id,
        file_name: originalName.substring(0, 255),
        file_url: publicUrl,
        file_size: 'file_size' in audio ? audio.file_size : null,
        mime_type: audioBlob.type || 'audio/mpeg',
        duration_seconds: duration,
        source: 'telegram_upload',
        metadata: {
          telegram_file_id: fileId,
          upload_type: type,
          title: pendingUpload.title,
        },
      })
      .select('id')
      .single();

    if (dbError) {
      logger.error('Error saving reference audio', dbError);
      await sendMessage(chatId, '❌ Ошибка сохранения\\. Попробуйте позже\\.');
      return;
    }

    const displayName = originalName.length > 40 
      ? originalName.substring(0, 37) + '...' 
      : originalName;

    await sendMessage(chatId, `✅ *Аудио загружено в облако\\!*

📁 Файл: _${escapeMarkdown(displayName)}_
${duration ? `⏱️ Длительность: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}\n` : ''}
Теперь вы можете использовать этот файл для:
• 🎤 Создания каверов
• 🔄 Расширения треков
• 🎛️ Работы в Studio`, {
      inline_keyboard: [
        [
          { text: '🎤 Создать кавер', callback_data: `use_ref_cover_${savedRef?.id}` },
          { text: '🔄 Расширить', callback_data: `use_ref_extend_${savedRef?.id}` }
        ],
        [
          { text: '📂 Мои загрузки', callback_data: 'my_uploads' }
        ]
      ]
    });

    trackMetric({
      eventType: 'upload_completed',
      success: true,
      telegramChatId: chatId,
      responseTimeMs: Date.now() - startTime,
      metadata: { referenceId: savedRef?.id },
    });

  } catch (error) {
    logger.error('Error in handleCloudUpload', error);
    await sendMessage(chatId, '❌ Произошла ошибка\\. Попробуйте позже\\.');
    
    trackMetric({
      eventType: 'upload_failed',
      success: false,
      telegramChatId: chatId,
      errorMessage: error instanceof Error ? error.message : String(error),
      responseTimeMs: Date.now() - startTime,
    });
  }
}

/**
 * Process audio upload and call generation API
 */
async function processAudioUpload(
  userId: string,
  pendingUpload: PendingUpload,
  audioFile: { name: string; type: string; data: string },
  telegramChatId: number
): Promise<{ success: boolean; taskId?: string; error?: string }> {
  try {
    // Create a mock auth token for internal service call
    // We'll use service role to bypass auth
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const sunoApiKey = Deno.env.get('SUNO_API_KEY');
    
    if (!sunoApiKey) {
      return { success: false, error: 'API key not configured' };
    }
    
    // Upload audio to Supabase Storage first
    const fileName = `${userId}/telegram-uploads/${Date.now()}-${audioFile.name}`;
    
    // Decode base64
    const base64Data = audioFile.data.split(',')[1];
    const audioBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('project-assets')
      .upload(fileName, audioBuffer, {
        contentType: audioFile.type,
        upsert: false,
      });
    
    if (uploadError) {
      logger.error('Upload error', uploadError);
      return { success: false, error: 'Failed to upload audio file' };
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('project-assets')
      .getPublicUrl(fileName);
    
    logger.info('Audio uploaded', { publicUrl });
    
    // Determine API endpoint and prepare body
    const isExtend = pendingUpload.mode === 'extend';
    const endpoint = isExtend
      ? 'https://api.sunoapi.org/api/v1/generate/upload-extend'
      : 'https://api.sunoapi.org/api/v1/generate/upload-cover';

    const model = pendingUpload.model || 'V4_5';
    const apiModel = model === 'V4_5ALL' ? 'V4_5' : model;

    // Fixed: Determine if we have custom parameters
    const hasCustomParams = Boolean(
      pendingUpload.style ||
      pendingUpload.prompt ||
      pendingUpload.title
    );

    const requestBody: Record<string, unknown> = {
      uploadUrl: publicUrl,
      model: apiModel,
      callBackUrl: `${supabaseUrl}/functions/v1/suno-music-callback`,
      customMode: hasCustomParams, // Fixed: Use customMode consistently for both cover and extend
    };

    // Add custom parameters if we have them
    if (hasCustomParams) {
      requestBody.instrumental = pendingUpload.instrumental || false;
      if (pendingUpload.style) requestBody.style = pendingUpload.style;
      if (pendingUpload.title) requestBody.title = pendingUpload.title;
      if (pendingUpload.prompt && !pendingUpload.instrumental) {
        requestBody.prompt = pendingUpload.prompt;
      }
    }
    
    logger.apiCall('SunoAPI', isExtend ? 'upload-extend' : 'upload-cover', { model: apiModel });
    
    // Call Suno API
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sunoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    const data = await response.json();
    logger.info('Suno API response', { code: data.code, taskId: data.data?.taskId });
    
    if (!response.ok || (data.code !== 200 && data.code !== 201)) {
      if (data.code === 429) {
        return { success: false, error: 'Недостаточно кредитов на API' };
      }
      if (data.code === 430) {
        return { success: false, error: 'Слишком частые запросы, попробуйте позже' };
      }
      return { success: false, error: data.msg || 'API error' };
    }
    
    const taskId = data.data?.taskId;
    
    if (!taskId) {
      return { success: false, error: 'No task ID received' };
    }
    
    // Create generation task in database
    const generationMode = isExtend ? 'upload_extend' : 'upload_cover';
    
    const { error: taskError } = await supabase
      .from('generation_tasks')
      .insert({
        user_id: userId,
        prompt: pendingUpload.prompt || pendingUpload.style || `Audio ${pendingUpload.mode}`,
        status: 'pending',
        suno_task_id: taskId,
        generation_mode: generationMode,
        model_used: model,
        source: 'telegram_bot',
        telegram_chat_id: telegramChatId,
      });
    
    if (taskError) {
      logger.error('Error creating task', taskError);
    }
    
    // Create placeholder track
    const { error: trackError } = await supabase
      .from('tracks')
      .insert({
        user_id: userId,
        prompt: pendingUpload.prompt || pendingUpload.style || `Audio ${pendingUpload.mode}`,
        status: 'pending',
        suno_task_id: taskId,
        suno_model: model,
        generation_mode: generationMode,
        title: pendingUpload.title || (isExtend ? 'Extended Audio' : 'Cover Version'),
        style: pendingUpload.style,
        has_vocals: !pendingUpload.instrumental,
        provider: 'suno',
      });
    
    if (trackError) {
      logger.error('Error creating track', trackError);
    }
    
    logger.success(`${pendingUpload.mode} generation started`, { taskId });
    return { success: true, taskId };
    
  } catch (error) {
    logger.error('Error in processAudioUpload', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal error' 
    };
  }
}

/**
 * Check if message contains audio
 */
export function isAudioMessage(message: unknown): message is { 
  audio?: TelegramAudio; 
  voice?: TelegramVoice; 
  document?: TelegramDocument;
} {
  const msg = message as Record<string, unknown>;
  
  // Check for audio
  if (msg.audio) return true;
  
  // Check for voice message
  if (msg.voice) return true;
  
  // Check for audio document
  if (msg.document) {
    const doc = msg.document as TelegramDocument;
    const mimeType = doc.mime_type || '';
    const fileName = doc.file_name || '';
    
    // Check if it's an audio file
    if (mimeType.startsWith('audio/')) return true;
    if (/\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(fileName)) return true;
  }
  
  return false;
}
