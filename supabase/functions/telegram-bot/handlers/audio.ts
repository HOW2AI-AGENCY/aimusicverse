/**
 * Handler for processing audio messages received in Telegram bot
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BOT_CONFIG } from '../config.ts';
import { sendMessage, sendAudio } from '../telegram-api.ts';
import { consumePendingUpload, type PendingUpload } from '../core/session-store.ts';
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
    // Check for pending upload
    const pendingUpload = consumePendingUpload(userId);
    
    if (!pendingUpload) {
      // No pending upload - show help
      await sendMessage(chatId, `🎵 *Аудио получено*

Чтобы обработать аудио, используйте:
• /cover \\- создать кавер\\-версию
• /extend \\- расширить/продолжить трек

Затем отправьте аудиофайл\\.`);
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
    
    const requestBody: Record<string, unknown> = {
      uploadUrl: publicUrl,
      model: apiModel,
      callBackUrl: `${supabaseUrl}/functions/v1/suno-music-callback`,
    };
    
    if (isExtend) {
      requestBody.defaultParamFlag = true; // Custom mode for extend
      requestBody.instrumental = pendingUpload.instrumental || false;
      if (pendingUpload.style) requestBody.style = pendingUpload.style;
      if (pendingUpload.title) requestBody.title = pendingUpload.title;
      if (pendingUpload.prompt && !pendingUpload.instrumental) {
        requestBody.prompt = pendingUpload.prompt;
      }
    } else {
      requestBody.customMode = Boolean(pendingUpload.style);
      requestBody.instrumental = pendingUpload.instrumental || false;
      if (pendingUpload.style) requestBody.style = pendingUpload.style;
      if (pendingUpload.prompt) requestBody.prompt = pendingUpload.prompt;
      if (pendingUpload.title) requestBody.title = pendingUpload.title;
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
    
    if (!response.ok || data.code !== 200) {
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
