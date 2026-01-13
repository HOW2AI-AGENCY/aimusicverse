/**
 * /upload command - Upload audio to cloud storage for later use
 */

import { getSupabaseClient } from '../core/supabase-client.ts';
import { BOT_CONFIG } from '../config.ts';
import { sendMessage, editMessageText, answerCallbackQuery, deleteMessage } from '../telegram-api.ts';
import { setPendingUpload, cancelPendingUpload } from '../core/session-store.ts';
import { escapeMarkdown, trackMetric } from '../utils/index.ts';
import { createLogger } from '../../_shared/logger.ts';

const logger = createLogger('telegram-upload-cmd');

const supabase = getSupabaseClient();

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
 * Show user's uploaded audio files with detailed info
 */
export async function handleMyUploads(
  chatId: number,
  userId: number,
  messageId?: number,
  page: number = 0
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

    const pageSize = 5;
    const offset = page * pageSize;

    // Get total count
    const { count: totalCount } = await supabase
      .from('reference_audio')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.user_id);

    // Get user's uploaded reference audio with full details
    const { data: uploads, error } = await supabase
      .from('reference_audio')
      .select('id, file_name, duration_seconds, created_at, source, genre, mood, analysis_status, stems_status, has_vocals, transcription, style_description')
      .eq('user_id', profile.user_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      logger.error('Error fetching uploads', error);
      await sendMessage(chatId, '❌ Ошибка при загрузке списка файлов\\.');
      return;
    }

    if (!uploads || uploads.length === 0) {
      const text = `📂 *Мои загрузки*

У вас пока нет загруженных аудиофайлов\\.

💡 Просто отправьте любой аудиофайл в чат \\- он автоматически загрузится в облако и будет проанализирован\\!`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '☁️ Загрузить аудио', callback_data: 'start_upload' }],
          [{ text: '📱 Открыть в приложении', web_app: { url: `${BOT_CONFIG.miniAppUrl}?startapp=cloud` } }]
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

    // Build list with icons
    const getStatusIcons = (upload: typeof uploads[0]): string => {
      const icons: string[] = [];
      if (upload.has_vocals) icons.push('🎤');
      if (upload.transcription) icons.push('📝');
      if (upload.stems_status === 'completed') icons.push('🎛️');
      if (upload.style_description) icons.push('🎨');
      return icons.join('');
    };

    let text = `📂 *Мои загрузки* \\(${totalCount || uploads.length}\\)\n\n`;
    
    uploads.forEach((upload, i) => {
      const num = offset + i + 1;
      const name = escapeMarkdown(upload.file_name.substring(0, 25) + (upload.file_name.length > 25 ? '...' : ''));
      const duration = formatDuration(upload.duration_seconds);
      const icons = getStatusIcons(upload);
      const genre = upload.genre ? escapeMarkdown(upload.genre) : '';
      const mood = upload.mood ? escapeMarkdown(upload.mood) : '';
      const tags = [genre, mood].filter(Boolean).join(' • ');
      
      text += `${num}\\. 🎵 *${name}*\n`;
      text += `   ⏱️ ${duration}`;
      if (tags) text += ` \\| ${tags}`;
      if (icons) text += ` ${icons}`;
      text += `\n\n`;
    });

    // Pagination
    const totalPages = Math.ceil((totalCount || 0) / pageSize);
    const currentPage = page + 1;
    if (totalPages > 1) {
      text += `📄 Страница ${currentPage}/${totalPages}`;
    }

    // Build keyboard with uploaded files
    const fileButtons = uploads.map(upload => [{
      text: `${getStatusIcons(upload) || '🎵'} ${upload.file_name.substring(0, 28)}${upload.file_name.length > 28 ? '...' : ''}`,
      callback_data: `select_ref_${upload.id.substring(0, 32)}`
    }]);

    // Pagination buttons
    const navButtons: Array<{ text: string; callback_data: string }> = [];
    if (page > 0) {
      navButtons.push({ text: '◀️ Назад', callback_data: `uploads_page_${page - 1}` });
    }
    if (currentPage < totalPages) {
      navButtons.push({ text: 'Вперёд ▶️', callback_data: `uploads_page_${page + 1}` });
    }

    const keyboard = {
      inline_keyboard: [
        ...fileButtons,
        navButtons.length > 0 ? navButtons : [],
        [
          { text: '☁️ Загрузить', callback_data: 'start_upload' },
          { text: '🔍 Поиск', callback_data: 'search_uploads' }
        ],
        [
          { text: '📱 Открыть в приложении', web_app: { url: `${BOT_CONFIG.miniAppUrl}?startapp=cloud` } }
        ]
      ].filter(row => row.length > 0)
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
 * Handle reference audio selection - show detailed view
 */
export async function handleSelectReference(
  chatId: number,
  userId: number,
  referenceId: string,
  messageId: number,
  callbackId: string
): Promise<void> {
  try {
    // Get reference audio details with all analysis
    const { data: reference } = await supabase
      .from('reference_audio')
      .select('*')
      .eq('id', referenceId)
      .single();

    if (!reference) {
      await answerCallbackQuery(callbackId, '❌ Файл не найден');
      return;
    }

    // Format duration
    const formatDuration = (seconds: number | null): string => {
      if (!seconds) return '?:??';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    let text = `📁 *${escapeMarkdown(reference.file_name)}*\n\n`;
    
    // Basic info
    text += `⏱️ Длительность: ${formatDuration(reference.duration_seconds)}\n`;
    
    // Analysis info
    if (reference.genre || reference.mood) {
      text += `\n📊 *Анализ:*\n`;
      if (reference.genre) text += `🎵 Жанр: ${escapeMarkdown(reference.genre)}\n`;
      if (reference.mood) text += `💫 Настроение: ${escapeMarkdown(reference.mood)}\n`;
      if (reference.bpm) text += `🥁 BPM: ${reference.bpm}\n`;
      if (reference.energy) text += `⚡ Энергия: ${escapeMarkdown(reference.energy)}\n`;
    }
    
    // Type
    if (reference.has_vocals !== null) {
      text += `\n${reference.has_vocals ? '🎤 Вокал обнаружен' : '🎸 Инструментал'}\n`;
    }
    
    // Transcription preview
    if (reference.transcription) {
      const lyricsPreview = reference.transcription.substring(0, 100);
      text += `📝 Текст извлечён \\(${reference.transcription.length} символов\\)\n`;
    }
    
    // Stems status
    if (reference.stems_status === 'completed') {
      text += `🎛️ Стемы разделены ✅\n`;
    } else if (reference.stems_status === 'processing') {
      text += `🎛️ Стемы обрабатываются\\.\\.\\.\n`;
    }
    
    // Style description
    if (reference.style_description) {
      text += `\n🎨 *Стиль для генерации:*\n_${escapeMarkdown(reference.style_description.substring(0, 150))}${reference.style_description.length > 150 ? '...' : ''}_\n`;
    }

    // Build action keyboard
    const actionRows: Array<Array<{ text: string; callback_data?: string; url?: string }>> = [
      [
        { text: '🎤 Кавер', callback_data: `use_ref_cover_${referenceId}` },
        { text: '🔄 Расширить', callback_data: `use_ref_extend_${referenceId}` }
      ],
    ];
    
    // Stems button
    if (reference.stems_status !== 'completed' && reference.stems_status !== 'processing') {
      actionRows.push([
        { text: '🎛️ Разделить на стемы', callback_data: `separate_ref_stems_${referenceId}` }
      ]);
    } else if (reference.stems_status === 'completed') {
      actionRows.push([
        { text: '⬇️ Скачать стемы', callback_data: `download_ref_stems_${referenceId}` },
        { text: '🎤 Вокал → Кавер', callback_data: `stem_use_vocal_${referenceId}` }
      ]);
    }
    
    // Lyrics and style buttons
    const utilityRow: Array<{ text: string; callback_data: string }> = [];
    if (reference.transcription) {
      utilityRow.push({ text: '📝 Текст', callback_data: `show_lyrics_${referenceId}` });
    }
    utilityRow.push({ text: '✏️ Стиль', callback_data: `edit_ref_style_${referenceId}` });
    if (utilityRow.length > 0) actionRows.push(utilityRow);
    
    // Delete and back
    actionRows.push([
      { text: '🗑️ Удалить', callback_data: `delete_ref_${referenceId}` },
      { text: '🔙 К списку', callback_data: 'my_uploads' }
    ]);

    const keyboard = { inline_keyboard: actionRows };

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

    // Get reference audio with analysis data
    const { data: reference } = await supabase
      .from('reference_audio')
      .select('id, file_name, file_url, genre, mood, vocal_style, transcription, has_vocals, duration_seconds')
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

    // Build style from analysis data if available
    const styleFromAnalysis = [
      reference.genre,
      reference.mood,
      reference.vocal_style
    ].filter(Boolean).join(', ');

    // Determine if we have custom params (style from analysis)
    const hasCustomParams = Boolean(styleFromAnalysis);
    const isInstrumental = reference.has_vocals === false;

    // Build request body - CRITICAL: customMode requires style, non-customMode requires prompt
    const requestBody: Record<string, unknown> = {
      source: 'telegram_bot',
      userId: profile.user_id,
      telegramChatId: chatId,
      audioUrl: reference.file_url,
      model: 'V5',
      instrumental: isInstrumental,
    };

    if (hasCustomParams) {
      // Custom mode with style from analysis
      requestBody.customMode = true;
      requestBody.style = styleFromAnalysis;
      requestBody.title = reference.file_name?.replace(/\.[^/.]+$/, '') || (mode === 'cover' ? 'Cover Version' : 'Extended Track');
      // Add lyrics if available and not instrumental
      if (!isInstrumental && reference.transcription) {
        requestBody.prompt = reference.transcription.substring(0, 2000);
      }
    } else {
      // Non-custom mode - MUST provide prompt
      requestBody.customMode = false;
      requestBody.prompt = `Create an AI ${mode === 'cover' ? 'cover version' : 'extended version'} of this audio track with similar style and mood`;
    }

    // For extend mode, add continueAt parameter
    if (mode === 'extend') {
      const duration = reference.duration_seconds || 60;
      requestBody.continueAt = Math.floor(duration * 0.8);
    }

    logger.info('Generating from reference', { 
      mode, 
      hasCustomParams, 
      style: styleFromAnalysis,
      isInstrumental 
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-bot-secret': telegramBotToken,
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    if (result.error) {
      logger.error('Generation error', { error: result.error });
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
      metadata: { referenceId, hasCustomParams },
    });

  } catch (error) {
    logger.error('Error in handleGenerateFromReference', error);
    await sendMessage(chatId, '❌ Произошла ошибка при запуске генерации\\.');
  }
}
