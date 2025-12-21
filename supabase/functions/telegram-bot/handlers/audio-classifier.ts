/**
 * Audio Classifier Handler
 * 
 * New UX flow for audio uploads:
 * 1. User sends audio -> Show file info + ask for classification
 * 2. User selects: Instrumental / Vocal / Vocal+Instrumental
 * 3. If vocal -> Ask for gender: Male / Female / Duet
 * 4. Start processing with appropriate parameters
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BOT_CONFIG } from '../config.ts';
import { sendMessage, editMessageText, deleteMessage, answerCallbackQuery } from '../telegram-api.ts';
import { escapeMarkdown, trackMetric } from '../utils/index.ts';
import { createLogger } from '../../_shared/logger.ts';
import { setActiveMenuMessageId, deleteActiveMenu } from '../core/active-menu-manager.ts';

const logger = createLogger('audio-classifier');

const supabase = createClient(
  BOT_CONFIG.supabaseUrl,
  BOT_CONFIG.supabaseServiceKey
);

export type AudioType = 'instrumental' | 'vocal' | 'full';
export type VocalGender = 'male' | 'female' | 'duet';

export interface PendingClassification {
  fileId: string;
  fileType: 'audio' | 'voice' | 'document';
  fileName: string;
  fileSize?: number;
  duration?: number;
  mimeType?: string;
  storageUrl?: string;
  storagePath?: string;
  audioType?: AudioType;
  vocalGender?: VocalGender;
  createdAt: number;
}

/**
 * Store pending classification in session
 */
export async function setPendingClassification(
  telegramUserId: number,
  data: PendingClassification
): Promise<void> {
  try {
    // Clear any existing classification sessions
    await supabase
      .from('telegram_bot_sessions')
      .delete()
      .eq('telegram_user_id', telegramUserId)
      .eq('session_type', 'audio_classification');

    // Store new classification session (10 minute expiry)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    const { error } = await supabase
      .from('telegram_bot_sessions')
      .insert({
        telegram_user_id: telegramUserId,
        session_type: 'audio_classification',
        mode: 'classify',
        options: data,
        expires_at: expiresAt.toISOString(),
      });

    if (error) {
      logger.error('Failed to set pending classification', error);
      throw error;
    }
    
    logger.debug('Set pending classification', { telegramUserId, fileName: data.fileName });
  } catch (error) {
    logger.error('Error in setPendingClassification', error);
    throw error;
  }
}

/**
 * Get pending classification
 */
export async function getPendingClassification(
  telegramUserId: number
): Promise<PendingClassification | null> {
  try {
    const { data, error } = await supabase
      .from('telegram_bot_sessions')
      .select('*')
      .eq('telegram_user_id', telegramUserId)
      .eq('session_type', 'audio_classification')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) return null;

    return data.options as PendingClassification;
  } catch (error) {
    logger.error('Error in getPendingClassification', error);
    return null;
  }
}

/**
 * Update pending classification with type/gender
 */
export async function updatePendingClassification(
  telegramUserId: number,
  updates: Partial<PendingClassification>
): Promise<void> {
  try {
    const { data, error: fetchError } = await supabase
      .from('telegram_bot_sessions')
      .select('options')
      .eq('telegram_user_id', telegramUserId)
      .eq('session_type', 'audio_classification')
      .single();

    if (fetchError || !data) return;

    const currentOptions = data.options as PendingClassification;
    const newOptions = { ...currentOptions, ...updates };

    await supabase
      .from('telegram_bot_sessions')
      .update({ options: newOptions })
      .eq('telegram_user_id', telegramUserId)
      .eq('session_type', 'audio_classification');
      
  } catch (error) {
    logger.error('Error in updatePendingClassification', error);
  }
}

/**
 * Consume (delete) pending classification
 */
export async function consumePendingClassification(
  telegramUserId: number
): Promise<PendingClassification | null> {
  try {
    const pending = await getPendingClassification(telegramUserId);
    if (!pending) return null;

    await supabase
      .from('telegram_bot_sessions')
      .delete()
      .eq('telegram_user_id', telegramUserId)
      .eq('session_type', 'audio_classification');

    return pending;
  } catch (error) {
    logger.error('Error in consumePendingClassification', error);
    return null;
  }
}

/**
 * Format file size for display
 */
function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Неизвестно';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format duration for display
 */
function formatDuration(seconds?: number): string {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Show classification prompt to user
 */
export async function showClassificationPrompt(
  chatId: number,
  userId: number,
  pendingData: PendingClassification,
  messageIdToEdit?: number
): Promise<void> {
  const fileName = pendingData.fileName;
  const fileSize = formatFileSize(pendingData.fileSize);
  const duration = pendingData.duration ? ` • ${formatDuration(pendingData.duration)}` : '';
  
  const text = 
    `📁 *${escapeMarkdown(fileName)}*\n` +
    `📊 ${escapeMarkdown(fileSize)}${escapeMarkdown(duration)}\n\n` +
    `❓ *Что это за аудио?*\n\n` +
    `Выберите тип, чтобы мы правильно обработали файл:`;
  
  const keyboard = {
    inline_keyboard: [
      [
        { text: '🎸 Инструментал', callback_data: 'audio_type_instrumental' },
      ],
      [
        { text: '🎤 Только вокал', callback_data: 'audio_type_vocal' },
      ],
      [
        { text: '🎵 Вокал + Инструментал', callback_data: 'audio_type_full' },
      ],
      [
        { text: '❌ Отмена', callback_data: 'audio_classify_cancel' },
      ],
    ],
  };

  if (messageIdToEdit) {
    await editMessageText(chatId, messageIdToEdit, text, keyboard);
  } else {
    const msg = await sendMessage(chatId, text, keyboard);
    if (msg?.result?.message_id) {
      await setActiveMenuMessageId(userId, chatId, msg.result.message_id, 'audio_classification');
    }
  }
}

/**
 * Show gender selection prompt
 */
export async function showGenderPrompt(
  chatId: number,
  messageId: number,
  fileName: string,
  audioType: AudioType
): Promise<void> {
  const typeText = audioType === 'vocal' ? 'Только вокал' : 'Вокал + Инструментал';
  
  const text = 
    `📁 *${escapeMarkdown(fileName)}*\n` +
    `✅ Тип: ${escapeMarkdown(typeText)}\n\n` +
    `🎤 *Какой пол вокалиста?*`;
  
  const keyboard = {
    inline_keyboard: [
      [
        { text: '👨 Мужской', callback_data: 'audio_gender_male' },
        { text: '👩 Женский', callback_data: 'audio_gender_female' },
      ],
      [
        { text: '👥 Дуэт/Несколько', callback_data: 'audio_gender_duet' },
      ],
      [
        { text: '⬅️ Назад', callback_data: 'audio_classify_back' },
        { text: '❌ Отмена', callback_data: 'audio_classify_cancel' },
      ],
    ],
  };

  await editMessageText(chatId, messageId, text, keyboard);
}

/**
 * Start processing with selected parameters
 */
export async function startClassifiedProcessing(
  chatId: number,
  userId: number,
  messageId: number,
  pendingData: PendingClassification
): Promise<void> {
  const startTime = Date.now();
  
  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', userId)
      .single();

    if (!profile) {
      await editMessageText(chatId, messageId, '❌ Профиль не найден\\. Откройте Mini App для регистрации\\.');
      return;
    }

    // Determine processing parameters based on classification
    const audioType = pendingData.audioType || 'full';
    const vocalGender = pendingData.vocalGender;
    
    const skipLyrics = audioType === 'instrumental';
    const skipStems = audioType !== 'full';
    
    // Show processing message
    const processingText = 
      `🎵 *Обработка аудио*\n\n` +
      `📁 ${escapeMarkdown(pendingData.fileName)}\n` +
      `🏷 Тип: ${escapeMarkdown(getTypeLabel(audioType))}` +
      `${vocalGender ? `\n🎤 Вокал: ${escapeMarkdown(getGenderLabel(vocalGender))}` : ''}\n\n` +
      `▓░░░░░░░░░ 5%\n` +
      `⏳ Загружаем в облако\\.\\.\\.`;
    
    await editMessageText(chatId, messageId, processingText);

    // Get file URL from Telegram
    const fileUrl = await getFileUrl(pendingData.fileId);
    if (!fileUrl) {
      await editMessageText(chatId, messageId, '❌ Не удалось получить файл\\. Попробуйте ещё раз\\.');
      return;
    }

    // Download the audio file
    const audioResponse = await fetch(fileUrl);
    if (!audioResponse.ok) {
      throw new Error('Failed to download audio from Telegram');
    }

    const audioBlob = await audioResponse.blob();
    const audioBuffer = await audioBlob.arrayBuffer();

    // Upload to Storage
    const extension = pendingData.fileName.split('.').pop()?.toLowerCase() || 'mp3';
    const sanitizedName = `audio_${Date.now()}.${extension}`;
    const storagePath = `${profile.user_id}/reference-audio/${sanitizedName}`;

    const safeContentType = resolveContentType(extension, pendingData.mimeType, pendingData.fileType);

    const { error: uploadError } = await supabase.storage
      .from('reference-audio')
      .upload(storagePath, new Uint8Array(audioBuffer), {
        contentType: safeContentType,
        upsert: false,
      });

    if (uploadError) {
      logger.error('Cloud upload error', uploadError);
      await editMessageText(chatId, messageId, '❌ Ошибка загрузки файла\\. Попробуйте позже\\.');
      return;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('reference-audio')
      .getPublicUrl(storagePath);

    logger.info('Audio uploaded to storage', { storagePath, publicUrl });

    // Update progress
    await editMessageText(
      chatId, 
      messageId,
      `🎵 *Обработка аудио*\n\n` +
      `📁 ${escapeMarkdown(pendingData.fileName)}\n\n` +
      `▓▓░░░░░░░░ 15%\n` +
      `⏳ Анализируем стиль\\.\\.\\.`
    );

    // Convert audio to base64 for Replicate (fixes Audio Flamingo 400 error)
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
    const dataUri = `data:${safeContentType};base64,${base64Audio}`;

    // Call the comprehensive audio processing pipeline with classification params
    const { data: pipelineResult, error: pipelineError } = await supabase.functions.invoke(
      'process-audio-pipeline',
      {
        body: {
          audio_url: publicUrl,
          audio_base64: dataUri, // Pass base64 for Replicate
          user_id: profile.user_id,
          file_name: pendingData.fileName,
          file_size: pendingData.fileSize,
          duration_seconds: pendingData.duration,
          source: 'telegram_classified',
          telegram_chat_id: chatId,
          telegram_file_id: pendingData.fileId,
          telegram_message_id: messageId, // Reuse message for progress
          skip_stems: skipStems,
          skip_lyrics: skipLyrics,
          user_classification: {
            audio_type: audioType,
            vocal_gender: vocalGender,
          },
        },
      }
    );

    if (pipelineError) {
      logger.error('Pipeline error', pipelineError);
      throw new Error(pipelineError.message || 'Pipeline processing failed');
    }

    // Delete classification session
    await consumePendingClassification(userId);

    // Build final result message
    const processingTime = Math.round((Date.now() - startTime) / 1000);
    const analysis = pipelineResult?.analysis || {};
    
    let resultText = `✅ *Аудио сохранено и проанализировано\\!*\n\n` +
      `📁 ${escapeMarkdown(pendingData.fileName)}\n` +
      `⏱ Время: ${processingTime} сек\n`;

    // Type indicator from user classification
    resultText += `\n🏷 *Тип:* ${escapeMarkdown(getTypeLabel(audioType))}`;
    if (vocalGender) {
      resultText += ` \\| 🎤 ${escapeMarkdown(getGenderLabel(vocalGender))}`;
    }
    resultText += '\n';

    // Analysis results as quote block
    let analysisQuote = '';
    if (analysis.genre) analysisQuote += `🎵 Жанр: ${analysis.genre}\n`;
    if (analysis.mood) analysisQuote += `💫 Настроение: ${analysis.mood}\n`;
    if (analysis.bpm_estimate) analysisQuote += `🥁 BPM: ${analysis.bpm_estimate}\n`;
    if (analysis.energy) analysisQuote += `⚡ Энергия: ${analysis.energy}\n`;
    if (analysis.vocal_style && audioType !== 'instrumental') {
      analysisQuote += `🎙 Вокал: ${analysis.vocal_style}\n`;
    }
    if (analysis.instruments?.length > 0) {
      analysisQuote += `🎹 Инструменты: ${analysis.instruments.slice(0, 5).join(', ')}\n`;
    }

    if (analysisQuote) {
      const quotedLines = analysisQuote.trim().split('\n').map(line => `>${escapeMarkdown(line)}`).join('\n');
      resultText += `\n${quotedLines}\n`;
    }

    // Style prompt
    if (analysis.style_prompt) {
      resultText += `\n_${escapeMarkdown(analysis.style_prompt.substring(0, 200))}_\n`;
    }

    // Lyrics preview
    if (pipelineResult?.lyrics && audioType !== 'instrumental') {
      const lyricsPreview = pipelineResult.lyrics.substring(0, 100);
      resultText += `\n📝 *Текст:*\n_${escapeMarkdown(lyricsPreview)}${pipelineResult.lyrics.length > 100 ? '\\.\\.\\.' : ''}_\n`;
    }

    // Build action keyboard
    const actionRows = buildActionKeyboard(audioType, !!pipelineResult?.lyrics);

    await editMessageText(chatId, messageId, resultText, { inline_keyboard: actionRows });
    await setActiveMenuMessageId(userId, chatId, messageId, 'audio_result');

    trackMetric({
      eventType: 'classified_upload_completed',
      success: true,
      telegramChatId: chatId,
      responseTimeMs: Date.now() - startTime,
      metadata: { 
        audioType,
        vocalGender,
        referenceId: pipelineResult?.reference_id,
      },
    });

  } catch (error) {
    logger.error('Error in startClassifiedProcessing', error);
    
    await editMessageText(
      chatId, 
      messageId, 
      `❌ Ошибка обработки аудио\\.\n\n${escapeMarkdown(error instanceof Error ? error.message : 'Попробуйте ещё раз')}`
    );
    
    trackMetric({
      eventType: 'classified_upload_failed',
      success: false,
      telegramChatId: chatId,
      errorMessage: error instanceof Error ? error.message : String(error),
      responseTimeMs: Date.now() - startTime,
    });
  }
}

// Helper functions

function getTypeLabel(type: AudioType): string {
  switch (type) {
    case 'instrumental': return 'Инструментал';
    case 'vocal': return 'Только вокал';
    case 'full': return 'Вокал + Инструментал';
    default: return 'Неизвестно';
  }
}

function getGenderLabel(gender: VocalGender): string {
  switch (gender) {
    case 'male': return 'Мужской';
    case 'female': return 'Женский';
    case 'duet': return 'Дуэт';
    default: return '';
  }
}

function resolveContentType(
  ext: string,
  mimeType?: string,
  msgType?: 'audio' | 'voice' | 'document'
): string {
  const t = (mimeType || '').toLowerCase();
  if (t.startsWith('audio/')) return t;
  if (msgType === 'voice') return 'audio/ogg';

  switch (ext) {
    case 'mp3': return 'audio/mpeg';
    case 'wav': return 'audio/wav';
    case 'ogg':
    case 'oga':
    case 'opus': return 'audio/ogg';
    case 'm4a':
    case 'mp4': return 'audio/mp4';
    case 'flac': return 'audio/flac';
    default: return 'audio/mpeg';
  }
}

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

type InlineButton = { text: string; callback_data?: string; web_app?: { url: string } };

function buildActionKeyboard(audioType: AudioType, hasLyrics: boolean): InlineButton[][] {
  const rows: InlineButton[][] = [
    [
      { text: '🎤 Создать кавер', callback_data: 'audio_action_cover' },
      { text: '➕ Расширить трек', callback_data: 'audio_action_extend' }
    ],
  ];
  
  // Add type-specific actions
  if (audioType === 'instrumental') {
    rows.push([
      { text: '🎤 Добавить вокал', callback_data: 'audio_action_add_vocals' },
    ]);
  } else if (audioType === 'vocal') {
    rows.push([
      { text: '🎸 Добавить инструментал', callback_data: 'audio_action_add_instrumental' },
    ]);
  } else {
    // Full track - offer both
    rows.push([
      { text: '🎛️ Разделить на стемы', callback_data: 'audio_action_stems' },
      { text: '🎹 MIDI', callback_data: 'audio_action_midi' }
    ]);
  }
  
  if (hasLyrics) {
    rows.push([{ text: '📝 Полный текст', callback_data: 'audio_action_show_lyrics' }]);
  }
  
  rows.push([
    { text: '✏️ Изменить стиль', callback_data: 'audio_action_edit_style' },
    { text: '📂 Мои загрузки', callback_data: 'my_uploads' }
  ]);
  
  rows.push([
    { text: '📱 Открыть в приложении', web_app: { url: `${BOT_CONFIG.miniAppUrl}?startapp=cloud` } }
  ]);
  
  return rows;
}

/**
 * Handle classification callback queries
 */
export async function handleClassificationCallback(
  data: string,
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string
): Promise<boolean> {
  
  // Audio type selection
  if (data === 'audio_type_instrumental') {
    const pending = await getPendingClassification(userId);
    if (!pending) {
      await answerCallbackQuery(queryId, 'Сессия истекла. Отправьте аудио снова.');
      return true;
    }
    
    await updatePendingClassification(userId, { audioType: 'instrumental' });
    await answerCallbackQuery(queryId);
    
    // Instrumental - no gender needed, start processing
    pending.audioType = 'instrumental';
    await startClassifiedProcessing(chatId, userId, messageId, pending);
    return true;
  }
  
  if (data === 'audio_type_vocal') {
    const pending = await getPendingClassification(userId);
    if (!pending) {
      await answerCallbackQuery(queryId, 'Сессия истекла. Отправьте аудио снова.');
      return true;
    }
    
    await updatePendingClassification(userId, { audioType: 'vocal' });
    await answerCallbackQuery(queryId);
    
    // Show gender selection
    await showGenderPrompt(chatId, messageId, pending.fileName, 'vocal');
    return true;
  }
  
  if (data === 'audio_type_full') {
    const pending = await getPendingClassification(userId);
    if (!pending) {
      await answerCallbackQuery(queryId, 'Сессия истекла. Отправьте аудио снова.');
      return true;
    }
    
    await updatePendingClassification(userId, { audioType: 'full' });
    await answerCallbackQuery(queryId);
    
    // Show gender selection
    await showGenderPrompt(chatId, messageId, pending.fileName, 'full');
    return true;
  }
  
  // Gender selection
  if (data.startsWith('audio_gender_')) {
    const gender = data.replace('audio_gender_', '') as VocalGender;
    const pending = await getPendingClassification(userId);
    if (!pending) {
      await answerCallbackQuery(queryId, 'Сессия истекла. Отправьте аудио снова.');
      return true;
    }
    
    await updatePendingClassification(userId, { vocalGender: gender });
    await answerCallbackQuery(queryId);
    
    // Start processing
    pending.vocalGender = gender;
    await startClassifiedProcessing(chatId, userId, messageId, pending);
    return true;
  }
  
  // Back to type selection
  if (data === 'audio_classify_back') {
    const pending = await getPendingClassification(userId);
    if (!pending) {
      await answerCallbackQuery(queryId, 'Сессия истекла. Отправьте аудио снова.');
      return true;
    }
    
    // Clear type/gender selection
    await updatePendingClassification(userId, { audioType: undefined, vocalGender: undefined });
    await answerCallbackQuery(queryId);
    
    // Show classification prompt again
    await showClassificationPrompt(chatId, userId, pending, messageId);
    return true;
  }
  
  // Cancel
  if (data === 'audio_classify_cancel') {
    await consumePendingClassification(userId);
    await answerCallbackQuery(queryId, 'Загрузка отменена');
    await deleteMessage(chatId, messageId);
    return true;
  }
  
  return false;
}
