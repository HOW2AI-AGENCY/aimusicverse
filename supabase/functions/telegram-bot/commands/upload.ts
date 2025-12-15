/**
 * /upload command - Upload audio to cloud storage for later use
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BOT_CONFIG } from '../config.ts';
import { sendMessage, editMessageText, answerCallbackQuery, deleteMessage } from '../telegram-api.ts';
import { setPendingUpload, cancelPendingUpload } from '../core/session-store.ts';
import { escapeMarkdown, trackMetric } from '../utils/index.ts';
import { createLogger } from '../../_shared/logger.ts';

const logger = createLogger('telegram-upload-cmd');

const supabase = createClient(
  BOT_CONFIG.supabaseUrl,
  BOT_CONFIG.supabaseServiceKey
);

/**
 * /upload command - initiate audio upload to cloud
 */
export async function handleUploadCommand(
  chatId: number,
  userId: number,
  args: string,
  messageId?: number,
  deleteOriginal?: boolean
): Promise<void> {
  // Set pending upload in 'upload' mode
  setPendingUpload(userId, 'upload', {
    title: args.trim() || undefined,
  });

  const text = `☁️ *Загрузка аудио в облако*

Отправьте аудиофайл \\(MP3, WAV, OGG, M4A\\) или голосовое сообщение\\.

Загруженные файлы можно использовать:
• 🎵 Как референс для генерации
• 🔍 Для анализа и распознавания
• 🎛️ В Stem Studio

⏳ Ожидание файла\\.\\.\\. \\(15 минут\\)
❌ Отмена: /cancel`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '❌ Отмена', callback_data: 'cancel_upload' },
        { text: '📂 Мои загрузки', callback_data: 'my_uploads' }
      ],
      [
        { text: '📱 Загрузить в приложении', url: `${BOT_CONFIG.deepLinkBase}?startapp=upload` }
      ]
    ]
  };

  if (messageId && deleteOriginal) {
    // Delete original message (e.g., photo message) and send new one
    await deleteMessage(chatId, messageId);
    await sendMessage(chatId, text, keyboard);
  } else if (messageId) {
    // Try to edit, fall back to delete + send if it fails
    const result = await editMessageText(chatId, messageId, text, keyboard);
    if (!result) {
      await deleteMessage(chatId, messageId);
      await sendMessage(chatId, text, keyboard);
    }
  } else {
    await sendMessage(chatId, text, keyboard);
  }

  trackMetric({
    eventType: 'upload_started',
    success: true,
    telegramChatId: chatId,
  });
}

/**
 * Show user's uploaded audio files
 */
export async function handleMyUploads(
  chatId: number,
  userId: number,
  messageId?: number
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

    // Get user's uploaded reference audio
    const { data: uploads, error } = await supabase
      .from('reference_audio')
      .select('id, file_name, duration_seconds, created_at, source')
      .eq('user_id', profile.user_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      logger.error('Error fetching uploads', error);
      await sendMessage(chatId, '❌ Ошибка при загрузке списка файлов\\.');
      return;
    }

    if (!uploads || uploads.length === 0) {
      const text = `📂 *Мои загрузки*

У вас пока нет загруженных аудиофайлов\\.

Используйте /upload чтобы загрузить аудио в облако\\.`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '☁️ Загрузить аудио', callback_data: 'start_upload' }]
        ]
      };

      if (messageId) {
        await editMessageText(chatId, messageId, text, keyboard);
      } else {
        await sendMessage(chatId, text, keyboard);
      }
      return;
    }

    // Format duration
    const formatDuration = (seconds: number | null): string => {
      if (!seconds) return '?:??';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Build keyboard with uploaded files
    const fileButtons = uploads.map(upload => [{
      text: `🎵 ${upload.file_name.substring(0, 30)}${upload.file_name.length > 30 ? '...' : ''} (${formatDuration(upload.duration_seconds)})`,
      callback_data: `select_ref_${upload.id.substring(0, 32)}`
    }]);

    const text = `📂 *Мои загрузки* \\(${uploads.length}\\)

Выберите файл для использования:`;

    const keyboard = {
      inline_keyboard: [
        ...fileButtons,
        [
          { text: '☁️ Загрузить новый', callback_data: 'start_upload' },
          { text: '🔙 Назад', callback_data: 'main_menu' }
        ]
      ]
    };

    if (messageId) {
      await editMessageText(chatId, messageId, text, keyboard);
    } else {
      await sendMessage(chatId, text, keyboard);
    }

  } catch (error) {
    logger.error('Error in handleMyUploads', error);
    await sendMessage(chatId, '❌ Произошла ошибка\\. Попробуйте позже\\.');
  }
}

/**
 * Handle reference audio selection
 */
export async function handleSelectReference(
  chatId: number,
  userId: number,
  referenceId: string,
  messageId: number,
  callbackId: string
): Promise<void> {
  try {
    // Get reference audio details
    const { data: reference } = await supabase
      .from('reference_audio')
      .select('id, file_name, file_url, duration_seconds')
      .eq('id', referenceId)
      .single();

    if (!reference) {
      await answerCallbackQuery(callbackId, '❌ Файл не найден');
      return;
    }

    const text = `🎵 *Выбран файл:*
${escapeMarkdown(reference.file_name)}

Что хотите сделать?`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🎤 Создать кавер', callback_data: `use_ref_cover_${referenceId}` },
          { text: '🔄 Расширить', callback_data: `use_ref_extend_${referenceId}` }
        ],
        [
          { text: '🎛️ Открыть в Studio', url: `${BOT_CONFIG.deepLinkBase}?startapp=studio_ref_${referenceId}` }
        ],
        [
          { text: '🗑️ Удалить', callback_data: `delete_ref_${referenceId}` },
          { text: '🔙 К списку', callback_data: 'my_uploads' }
        ]
      ]
    };

    await editMessageText(chatId, messageId, text, keyboard);
    await answerCallbackQuery(callbackId);

  } catch (error) {
    logger.error('Error in handleSelectReference', error);
    await answerCallbackQuery(callbackId, '❌ Ошибка');
  }
}

/**
 * Use selected reference for cover/extend
 */
export async function handleUseReference(
  chatId: number,
  userId: number,
  referenceId: string,
  mode: 'cover' | 'extend',
  messageId: number,
  callbackId: string
): Promise<void> {
  try {
    // Get reference audio
    const { data: reference } = await supabase
      .from('reference_audio')
      .select('id, file_name, file_url')
      .eq('id', referenceId)
      .single();

    if (!reference) {
      await answerCallbackQuery(callbackId, '❌ Файл не найден');
      return;
    }

    // Set pending upload with selected reference
    setPendingUpload(userId, mode, {
      selectedReferenceId: referenceId,
    });

    const modeText = mode === 'cover' ? 'кавера' : 'расширения';
    const text = `🎵 *Создание ${modeText}*

Файл: _${escapeMarkdown(reference.file_name)}_

Введите описание стиля или текст \\(опционально\\), или нажмите "Генерировать" для запуска:`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🎸 Инструментал', callback_data: `ref_instrumental_${referenceId}` },
          { text: '🎤 С вокалом', callback_data: `ref_vocal_${referenceId}` }
        ],
        [
          { text: '🚀 Генерировать', callback_data: `ref_generate_${mode}_${referenceId}` }
        ],
        [
          { text: '❌ Отмена', callback_data: 'cancel_upload' }
        ]
      ]
    };

    await editMessageText(chatId, messageId, text, keyboard);
    await answerCallbackQuery(callbackId, `✅ Выбран для ${modeText}`);

  } catch (error) {
    logger.error('Error in handleUseReference', error);
    await answerCallbackQuery(callbackId, '❌ Ошибка');
  }
}

/**
 * Delete reference audio
 */
export async function handleDeleteReference(
  chatId: number,
  userId: number,
  referenceId: string,
  messageId: number,
  callbackId: string
): Promise<void> {
  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', userId)
      .single();

    if (!profile) {
      await answerCallbackQuery(callbackId, '❌ Профиль не найден');
      return;
    }

    // Delete reference audio (only if owned by user)
    const { error } = await supabase
      .from('reference_audio')
      .delete()
      .eq('id', referenceId)
      .eq('user_id', profile.user_id);

    if (error) {
      logger.error('Error deleting reference', error);
      await answerCallbackQuery(callbackId, '❌ Ошибка удаления');
      return;
    }

    await answerCallbackQuery(callbackId, '✅ Файл удалён');
    
    // Refresh uploads list
    await handleMyUploads(chatId, userId, messageId);

  } catch (error) {
    logger.error('Error in handleDeleteReference', error);
    await answerCallbackQuery(callbackId, '❌ Ошибка');
  }
}

/**
 * Show lyrics from reference audio
 */
export async function handleShowLyrics(
  chatId: number,
  referenceId: string,
  messageId: number,
  callbackId: string
): Promise<void> {
  try {
    const { data: reference } = await supabase
      .from('reference_audio')
      .select('id, file_name, transcription')
      .eq('id', referenceId)
      .single();

    if (!reference) {
      await answerCallbackQuery(callbackId, '❌ Файл не найден');
      return;
    }

    if (!reference.transcription) {
      await answerCallbackQuery(callbackId, '❌ Текст не найден');
      return;
    }

    await answerCallbackQuery(callbackId, '📝 Показываю текст...');

    const lyrics = reference.transcription;
    const lyricsText = lyrics.length > 3000 ? lyrics.substring(0, 3000) + '...' : lyrics;

    await editMessageText(chatId, messageId, `📝 *Текст песни:*
_${escapeMarkdown(reference.file_name)}_

${escapeMarkdown(lyricsText)}`, {
      inline_keyboard: [
        [
          { text: '🎤 Создать кавер', callback_data: `use_ref_cover_${referenceId}` },
          { text: '🔄 Расширить', callback_data: `use_ref_extend_${referenceId}` }
        ],
        [
          { text: '🔙 Назад', callback_data: `select_ref_${referenceId}` }
        ]
      ]
    });

  } catch (error) {
    logger.error('Error in handleShowLyrics', error);
    await answerCallbackQuery(callbackId, '❌ Ошибка');
  }
}

/**
 * Start generation from reference
 */
export async function handleGenerateFromReference(
  chatId: number,
  userId: number,
  referenceId: string,
  mode: 'cover' | 'extend',
  messageId: number,
  callbackId: string
): Promise<void> {
  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', userId)
      .single();

    if (!profile) {
      await answerCallbackQuery(callbackId, '❌ Профиль не найден');
      return;
    }

    // Get reference audio
    const { data: reference } = await supabase
      .from('reference_audio')
      .select('id, file_name, file_url')
      .eq('id', referenceId)
      .single();

    if (!reference) {
      await answerCallbackQuery(callbackId, '❌ Файл не найден');
      return;
    }

    await answerCallbackQuery(callbackId, '🚀 Запускаем генерацию...');

    // Call the appropriate generation edge function
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
    const endpoint = mode === 'cover' 
      ? `${supabaseUrl}/functions/v1/suno-upload-cover`
      : `${supabaseUrl}/functions/v1/suno-upload-extend`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-bot-secret': telegramBotToken, // Required for bot auth
      },
      body: JSON.stringify({
        source: 'telegram_bot', // CRITICAL: Must be 'telegram_bot' for proper auth
        userId: profile.user_id, // User ID for the account
        telegramChatId: chatId,
        audioUrl: reference.file_url, // Use providedAudioUrl for pre-uploaded
        model: 'V5', // Default to V5 for best quality
        customMode: false, // Simple mode for quick generation
        instrumental: false,
      }),
    });

    const result = await response.json();

    if (result.error) {
      await editMessageText(chatId, messageId, `❌ *Ошибка*\n\n${escapeMarkdown(result.error)}`);
      return;
    }

    const modeText = mode === 'cover' ? 'кавера' : 'расширения';
    await editMessageText(chatId, messageId, `✅ *Генерация ${modeText} запущена\\!*

⏳ Обычно занимает 2\\-4 минуты
🔔 Вы получите уведомление когда трек будет готов

🆔 Задача: \`${escapeMarkdown(result.taskId || 'processing')}\``, {
      inline_keyboard: [[
        { text: '📱 Открыть приложение', web_app: { url: BOT_CONFIG.miniAppUrl } }
      ]]
    });

    trackMetric({
      eventType: `${mode}_from_reference`,
      success: true,
      telegramChatId: chatId,
      metadata: { referenceId },
    });

  } catch (error) {
    logger.error('Error in handleGenerateFromReference', error);
    await sendMessage(chatId, '❌ Произошла ошибка при запуске генерации\\.');
  }
}
