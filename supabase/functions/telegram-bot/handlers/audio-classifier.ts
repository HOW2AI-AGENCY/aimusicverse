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
import { sendAutoDeleteMessage, AUTO_DELETE_TIMINGS } from '../utils/auto-delete.ts';
import { handleSubmenu } from './dynamic-menu.ts';
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
 * Upload audio to cloud and show action buttons (without auto-processing)
 */
export async function uploadAndShowActions(
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
    
    // Show uploading message
    const uploadingText = 
      `🎵 *Загрузка аудио*\n\n` +
      `📁 ${escapeMarkdown(pendingData.fileName)}\n` +
      `🏷 Тип: ${escapeMarkdown(getTypeLabel(audioType))}` +
      `${vocalGender ? `\n🎤 Вокал: ${escapeMarkdown(getGenderLabel(vocalGender))}` : ''}\n\n` +
      `⏳ Загружаем в облако\\.\\.\\.`;
    
    await editMessageText(chatId, messageId, uploadingText);

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

    // Save reference_audio record to DB
    const { data: refRecord, error: refError } = await supabase
      .from('reference_audio')
      .insert({
        user_id: profile.user_id,
        file_url: publicUrl,
        file_name: pendingData.fileName,
        file_size: pendingData.fileSize,
        duration_seconds: pendingData.duration,
        mime_type: safeContentType,
        telegram_file_id: pendingData.fileId,
        source: 'telegram_classified',
        analysis_status: 'pending',
        metadata: {
          audio_type: audioType,
          vocal_gender: vocalGender,
        },
      })
      .select('id')
      .single();

    if (refError) {
      logger.error('Failed to save reference_audio record', refError);
      throw new Error('Failed to save audio record');
    }

    const referenceId = refRecord.id;

    // Update pending classification with storage info
    await updatePendingClassification(userId, {
      storageUrl: publicUrl,
      storagePath: storagePath,
    });

    // Delete classification session (upload complete)
    await consumePendingClassification(userId);

    // Show success message with action buttons
    const uploadTime = Math.round((Date.now() - startTime) / 1000);
    const successText = 
      `✅ *Аудио загружено в облако\\!*\n\n` +
      `📁 ${escapeMarkdown(pendingData.fileName)}\n` +
      `🏷 Тип: ${escapeMarkdown(getTypeLabel(audioType))}` +
      `${vocalGender ? ` \\| 🎤 ${escapeMarkdown(getGenderLabel(vocalGender))}` : ''}\n` +
      `⏱ Время загрузки: ${uploadTime} сек\n\n` +
      `*Выберите действие:*`;

    // Build action keyboard
    const skipStems = audioType !== 'full';
    const actionKeyboard = buildUploadedActionKeyboard(referenceId, skipStems);
    
    logger.info('Showing action buttons after upload', { 
      referenceId, 
      audioType, 
      skipStems, 
      buttonCount: actionKeyboard.length,
      buttons: actionKeyboard.map(row => row.map(btn => btn.text))
    });

    await editMessageText(chatId, messageId, successText, { inline_keyboard: actionKeyboard });
    await setActiveMenuMessageId(userId, chatId, messageId, 'audio_uploaded');

    trackMetric({
      eventType: 'classified_upload_completed',
      success: true,
      telegramChatId: chatId,
      responseTimeMs: Date.now() - startTime,
      metadata: { 
        audioType,
        vocalGender,
        referenceId,
      },
    });

  } catch (error) {
    logger.error('Error in uploadAndShowActions', { 
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined
    });
    
    // Delete the processing message
    await deleteMessage(chatId, messageId);
    
    // Clear the pending classification session
    await consumePendingClassification(userId);
    
    // Send auto-delete error notification
    const errorText = error instanceof Error ? error.message : 'Попробуйте ещё раз';
    await sendAutoDeleteMessage(
      chatId,
      `❌ *Ошибка загрузки аудио*\n\n_${escapeMarkdown(errorText)}_`,
      AUTO_DELETE_TIMINGS.MEDIUM,
      { parseMode: 'MarkdownV2' }
    );
    
    // Show main menu after short delay
    setTimeout(async () => {
      try {
        await handleSubmenu(chatId, userId, 'main');
      } catch (menuError) {
        logger.error('Failed to show main menu after error', menuError);
      }
    }, 1000);
    
    trackMetric({
      eventType: 'classified_upload_failed',
      success: false,
      telegramChatId: chatId,
      errorMessage: error instanceof Error ? error.message : String(error),
      responseTimeMs: Date.now() - startTime,
    });
  }
}

/**
 * Build action keyboard for uploaded audio
 */
function buildUploadedActionKeyboard(referenceId: string, skipStems: boolean): InlineButton[][] {
  const rows: InlineButton[][] = [];
  
  // Analyze button
  rows.push([
    { text: '🔍 Анализировать стиль', callback_data: `audio_action_analyze_${referenceId}` },
  ]);
  
  // Stems button (only for full tracks)
  if (!skipStems) {
    rows.push([
      { text: '🎛 Разделить на стемы', callback_data: `audio_action_stems_${referenceId}` },
    ]);
  }
  
  // Both actions
  if (!skipStems) {
    rows.push([
      { text: '✨ Анализ + Стемы', callback_data: `audio_action_full_${referenceId}` },
    ]);
  }
  
  // Open in app
  rows.push([
    { text: '📱 Открыть в приложении', web_app: { url: `${BOT_CONFIG.miniAppUrl}/reference/${referenceId}` } },
  ]);
  
  return rows;
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

function buildActionKeyboard(_audioType: AudioType, _hasLyrics: boolean, referenceId?: string): InlineButton[][] {
  const rows: InlineButton[][] = [];
  
  // Only one button - Open in App
  if (referenceId) {
    rows.push([
      { text: '📱 Открыть в приложении', web_app: { url: `${BOT_CONFIG.miniAppUrl}/reference/${referenceId}` } }
    ]);
  }
  
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
    
    // Instrumental - no gender needed, upload and show actions
    pending.audioType = 'instrumental';
    await uploadAndShowActions(chatId, userId, messageId, pending);
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
    
    // Upload and show actions
    pending.vocalGender = gender;
    await uploadAndShowActions(chatId, userId, messageId, pending);
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
  
  // Handle audio action buttons (analyze, stems, full)
  if (data.startsWith('audio_action_')) {
    const parts = data.replace('audio_action_', '').split('_');
    const action = parts[0]; // analyze, stems, or full
    const referenceId = parts.slice(1).join('_'); // UUID may contain underscores
    
    if (!referenceId) {
      await answerCallbackQuery(queryId, 'Ошибка: ID аудио не найден');
      return true;
    }
    
    await answerCallbackQuery(queryId, '⏳ Запускаем обработку...');
    
    // Get reference audio record
    const { data: refAudio, error: refError } = await supabase
      .from('reference_audio')
      .select('*')
      .eq('id', referenceId)
      .single();
    
    if (refError || !refAudio) {
      await editMessageText(chatId, messageId, '❌ Аудио не найдено\\. Попробуйте загрузить снова\\.');
      return true;
    }
    
    // Determine what to run
    const skipLyrics = refAudio.metadata?.audio_type === 'instrumental';
    const skipStems = action === 'analyze' || refAudio.metadata?.audio_type !== 'full';
    const runAnalysis = action === 'analyze' || action === 'full';
    const runStems = action === 'stems' || action === 'full';
    
    // Show processing message
    let processingText = `🎵 *Обработка аудио*\n\n` +
      `📁 ${escapeMarkdown(refAudio.file_name || 'audio')}\n\n`;
    
    if (runAnalysis && runStems) {
      processingText += `▓░░░░░░░░░ 10%\n⏳ Анализ стиля \\+ разделение на стемы\\.\\.\\.`;
    } else if (runAnalysis) {
      processingText += `▓░░░░░░░░░ 10%\n⏳ Анализ стиля\\.\\.\\.`;
    } else {
      processingText += `▓░░░░░░░░░ 10%\n⏳ Разделение на стемы\\.\\.\\.`;
    }
    
    await editMessageText(chatId, messageId, processingText);
    
    // Prepare base64 for Replicate if needed
    let audioBase64: string | undefined;
    if (runAnalysis || runStems) {
      try {
        const audioResponse = await fetch(refAudio.file_url);
        if (audioResponse.ok) {
          const audioBuffer = await audioResponse.arrayBuffer();
          const uint8Array = new Uint8Array(audioBuffer);
          const chunkSize = 32768;
          let base64Audio = '';
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
            base64Audio += String.fromCharCode(...chunk);
          }
          audioBase64 = `data:${refAudio.mime_type || 'audio/mpeg'};base64,${btoa(base64Audio)}`;
        }
      } catch (err) {
        logger.warn('Failed to prepare base64 for audio', { error: err instanceof Error ? err.message : String(err) });
      }
    }
    
    // Call pipeline
    const { data: pipelineResult, error: pipelineError } = await supabase.functions.invoke(
      'process-audio-pipeline',
      {
        body: {
          audio_url: refAudio.file_url,
          audio_base64: audioBase64,
          user_id: refAudio.user_id,
          file_name: refAudio.file_name,
          file_size: refAudio.file_size,
          duration_seconds: refAudio.duration_seconds,
          source: 'telegram_action',
          telegram_chat_id: chatId,
          telegram_file_id: refAudio.telegram_file_id,
          telegram_message_id: messageId,
          reference_id: referenceId, // Link to existing record
          skip_stems: !runStems || skipStems,
          skip_lyrics: skipLyrics,
          skip_analysis: !runAnalysis,
          user_classification: refAudio.metadata,
        },
      }
    );
    
    if (pipelineError) {
      logger.error('Pipeline error from action', pipelineError);
      await editMessageText(
        chatId,
        messageId,
        `❌ *Ошибка обработки*\n\n_${escapeMarkdown(pipelineError.message || 'Попробуйте ещё раз')}_`
      );
      return true;
    }
    
    // Handle successful pipeline response
    if (pipelineResult?.success) {
      const resultRefId = pipelineResult.reference_id || referenceId;
      const analysis = pipelineResult.analysis;
      const stems = pipelineResult.stems;
      
      // Build success message with results
      let successText = `✅ *Обработка завершена\\!*\n\n` +
        `📁 ${escapeMarkdown(refAudio.file_name || 'audio')}\n\n`;
      
      // Add analysis results if available
      if (analysis && runAnalysis) {
        successText += `*🎵 Анализ стиля:*\n`;
        if (analysis.genre) successText += `• Жанр: ${escapeMarkdown(analysis.genre)}${analysis.sub_genre ? ` \\(${escapeMarkdown(analysis.sub_genre)}\\)` : ''}\n`;
        if (analysis.mood) successText += `• Настроение: ${escapeMarkdown(analysis.mood)}\n`;
        if (analysis.energy) successText += `• Энергия: ${escapeMarkdown(analysis.energy)}\n`;
        if (analysis.tempo || analysis.bpm_estimate) successText += `• Темп: ${escapeMarkdown(analysis.tempo || '')}${analysis.bpm_estimate ? ` \\(~${analysis.bpm_estimate} BPM\\)` : ''}\n`;
        if (analysis.vocal_style) successText += `• Вокал: ${escapeMarkdown(analysis.vocal_style)}\n`;
        if (analysis.instruments && analysis.instruments.length > 0) {
          successText += `• Инструменты: ${escapeMarkdown(analysis.instruments.slice(0, 4).join(', '))}${analysis.instruments.length > 4 ? '...' : ''}\n`;
        }
        successText += '\n';
      }
      
      // Add stems status if processed
      if (stems && runStems && stems.status !== 'skipped') {
        successText += `*🎛 Стемы:*\n`;
        if (stems.vocal_url) successText += `• ✅ Вокал\n`;
        if (stems.instrumental_url) successText += `• ✅ Инструментал\n`;
        if (stems.drums_url) successText += `• ✅ Барабаны\n`;
        if (stems.bass_url) successText += `• ✅ Бас\n`;
        if (stems.other_url) successText += `• ✅ Другое\n`;
        successText += '\n';
      }
      
      successText += `⏱ Время: ${Math.round((pipelineResult.processing_time_ms || 0) / 1000)} сек`;
      
      // Build action keyboard for completed audio
      const completedKeyboard = buildCompletedActionKeyboard(resultRefId, action, refAudio.metadata?.audio_type);
      
      await editMessageText(chatId, messageId, successText, { inline_keyboard: completedKeyboard });
      await setActiveMenuMessageId(userId, chatId, messageId, 'audio_processed');
      
      logger.info('Pipeline completed, showing results', { action, referenceId: resultRefId });
    } else {
      // Pipeline returned but with unknown status
      await editMessageText(
        chatId,
        messageId,
        `⚠️ *Обработка завершена*\n\nОткройте приложение для просмотра результатов\\.`,
        { inline_keyboard: [[{ text: '📱 Открыть в приложении', web_app: { url: `${BOT_CONFIG.miniAppUrl}/reference/${referenceId}` } }]] }
      );
    }
    
    return true;
  }
  
  return false;
}

/**
 * Build action keyboard for completed audio processing
 */
function buildCompletedActionKeyboard(referenceId: string, completedAction: string, audioType?: string): InlineButton[][] {
  const rows: InlineButton[][] = [];
  const isFullTrack = audioType === 'full';
  
  // If only analyzed - offer stems option
  if (completedAction === 'analyze' && isFullTrack) {
    rows.push([
      { text: '🎛 Разделить на стемы', callback_data: `audio_action_stems_${referenceId}` },
    ]);
  }
  
  // If only stems - offer analysis option
  if (completedAction === 'stems') {
    rows.push([
      { text: '🔍 Анализировать стиль', callback_data: `audio_action_analyze_${referenceId}` },
    ]);
  }
  
  // Always show open in app
  rows.push([
    { text: '📱 Открыть в приложении', web_app: { url: `${BOT_CONFIG.miniAppUrl}/reference/${referenceId}` } },
  ]);
  
  // Back to main menu
  rows.push([
    { text: '🏠 Главное меню', callback_data: 'menu_main' },
  ]);
  
  return rows;
}
