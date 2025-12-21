/**
 * Handler for processing audio messages received in Telegram bot
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BOT_CONFIG } from '../config.ts';
import { sendMessage, sendAudio, deleteMessage } from '../telegram-api.ts';
import { consumePendingUpload, type PendingUpload, setPendingAudio } from '../core/db-session-store.ts';
import { escapeMarkdown, trackMetric } from '../utils/index.ts';
import { createLogger } from '../../_shared/logger.ts';
import { deleteActiveMenu, setActiveMenuMessageId } from '../core/active-menu-manager.ts';

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
 * 
 * NEW BEHAVIOR: All audio is automatically uploaded to user's cloud storage
 * and processed through comprehensive analysis pipeline
 */
export async function handleAudioMessage(
  chatId: number,
  userId: number,
  audio: TelegramAudio | TelegramVoice | TelegramDocument,
  type: 'audio' | 'voice' | 'document'
): Promise<void> {
  const startTime = Date.now();
  
  try {
    // Delete any active menu before showing audio-related messages
    await deleteActiveMenu(userId, chatId);
    
    // Check for pending upload (now async with DB)
    const pendingUpload = await consumePendingUpload(userId);
    
    if (!pendingUpload) {
      // === NEW: Auto-upload ALL audio to cloud with comprehensive analysis ===
      await handleAutoUploadWithPipeline(chatId, userId, audio, type, startTime);
      return;
    }
    
    // Handle 'upload' mode - save to cloud storage with full analysis
    if (pendingUpload.mode === 'upload') {
      await handleCloudUploadWithAnalysis(chatId, userId, audio, type, pendingUpload, startTime);
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
 * AUTO-UPLOAD: Handle automatic upload of all audio to cloud with comprehensive pipeline
 * 
 * This is the new default behavior:
 * 1. Upload audio to storage immediately
 * 2. Run comprehensive analysis (Audio Flamingo 3)
 * 3. Extract lyrics if vocals detected
 * 4. Separate stems if both vocals AND instrumentals
 * 5. Send live progress updates
 */
async function handleAutoUploadWithPipeline(
  chatId: number,
  userId: number,
  audio: TelegramAudio | TelegramVoice | TelegramDocument,
  type: 'audio' | 'voice' | 'document',
  startTime: number
): Promise<void> {
  let progressMessageId: number | undefined;
  
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

    // Prepare file info
    const originalName = 'file_name' in audio && audio.file_name 
      ? audio.file_name 
      : 'title' in audio && audio.title 
        ? `${audio.title}.mp3` 
        : type === 'voice' 
          ? `voice_${Date.now()}.ogg`
          : `audio_${Date.now()}.mp3`;
    
    const duration = 'duration' in audio ? audio.duration : undefined;
    const fileSize = 'file_size' in audio ? audio.file_size : undefined;
    
    // Send initial progress message
    const initialMsg = await sendMessage(chatId, 
      `🎵 *Аудио получено\\!*\n\n` +
      `📁 ${escapeMarkdown(originalName)}\n\n` +
      `▓░░░░░░░░░ 5%\n` +
      `⏳ Загружаем в облако\\.\\.\\.`
    );
    progressMessageId = initialMsg?.result?.message_id;
    
    // Get file URL from Telegram
    const fileUrl = await getFileUrl(audio.file_id);
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

    // Upload to Storage (Telegram sometimes reports application/octet-stream; Storage rejects it)
    const extension = originalName.split('.').pop()?.toLowerCase() || 'mp3';
    const sanitizedName = `audio_${Date.now()}.${extension}`;
    const storagePath = `${profile.user_id}/reference-audio/${sanitizedName}`;

    const resolveContentType = (
      ext: string,
      telegramOrBlobType?: string,
      msgType?: 'audio' | 'voice' | 'document'
    ): string => {
      const t = (telegramOrBlobType || '').toLowerCase();
      if (t.startsWith('audio/')) return t;

      // Voice messages are typically OGG/Opus
      if (msgType === 'voice') return 'audio/ogg';

      switch (ext) {
        case 'mp3':
          return 'audio/mpeg';
        case 'wav':
          return 'audio/wav';
        case 'ogg':
        case 'oga':
        case 'opus':
          return 'audio/ogg';
        case 'm4a':
          return 'audio/mp4';
        case 'mp4':
          return 'audio/mp4';
        case 'flac':
          return 'audio/flac';
        default:
          return 'audio/mpeg';
      }
    };

    const safeContentType = resolveContentType(
      extension,
      ('mime_type' in audio ? audio.mime_type : undefined) || audioBlob.type,
      type
    );

    const { error: uploadError } = await supabase.storage
      .from('reference-audio')
      .upload(storagePath, new Uint8Array(audioBuffer), {
        contentType: safeContentType,
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

    logger.info('Audio uploaded to storage', { storagePath, publicUrl });

    // NOTE: Do NOT send intermediate progress here - let pipeline handle all progress updates
    // The pipeline will edit the progressMessageId with 10% → 20% → 70% → 90% updates

    // Call the comprehensive audio processing pipeline
    const { data: pipelineResult, error: pipelineError } = await supabase.functions.invoke(
      'process-audio-pipeline',
      {
        body: {
          audio_url: publicUrl,
          user_id: profile.user_id,
          file_name: originalName,
          file_size: fileSize,
          duration_seconds: duration,
          source: 'telegram_auto',
          telegram_chat_id: chatId,
          telegram_file_id: audio.file_id,
          telegram_message_id: progressMessageId, // reuse existing progress message (prevents spam)
        },
      }
    );

    if (pipelineError) {
      logger.error('Pipeline error', pipelineError);
      throw new Error(pipelineError.message || 'Pipeline processing failed');
    }

    // Store audio info for quick actions
    await storeTemporaryAudio(userId, audio.file_id, type, {
      style: pipelineResult?.analysis?.style_prompt,
      genre: pipelineResult?.analysis?.genre,
      mood: pipelineResult?.analysis?.mood,
      lyrics: pipelineResult?.lyrics,
      hasVocals: pipelineResult?.analysis?.has_vocals,
    });

    // Delete progress message first
    if (progressMessageId) {
      try {
        await deleteMessage(chatId, progressMessageId);
      } catch (e) { /* ignore */ }
    }

    // Build final result message with analysis as quote block
    const processingTime = Math.round((Date.now() - startTime) / 1000);
    const analysis = pipelineResult?.analysis || {};
    
    let resultText = `✅ *Аудио сохранено и проанализировано\\!*\n\n` +
      `📁 ${escapeMarkdown(originalName)}\n` +
      `⏱ Время обработки: ${processingTime} сек\n`;

    // Type indicator
    if (analysis.has_vocals && analysis.has_instrumental) {
      resultText += `\n🎤 *Тип:* Вокал \\+ Инструментал\n`;
    } else if (analysis.has_vocals) {
      resultText += `\n🎤 *Тип:* Вокал\n`;
    } else {
      resultText += `\n🎸 *Тип:* Инструментал\n`;
    }

    // Analysis results as quote block
    let analysisQuote = '';
    if (analysis.genre) {
      analysisQuote += `🎵 Жанр: ${analysis.genre}\n`;
    }
    if (analysis.mood) {
      analysisQuote += `💫 Настроение: ${analysis.mood}\n`;
    }
    if (analysis.bpm_estimate) {
      analysisQuote += `🥁 BPM: ${analysis.bpm_estimate}\n`;
    }
    if (analysis.energy) {
      analysisQuote += `⚡ Энергия: ${analysis.energy}\n`;
    }
    if (analysis.vocal_style && analysis.has_vocals) {
      analysisQuote += `🎙 Вокал: ${analysis.vocal_style}\n`;
    }
    if (analysis.instruments && analysis.instruments.length > 0) {
      analysisQuote += `🎹 Инструменты: ${analysis.instruments.slice(0, 5).join(', ')}\n`;
    }

    // Format as blockquote (Telegram MarkdownV2)
    if (analysisQuote) {
      const quotedLines = analysisQuote.trim().split('\n').map(line => `>${escapeMarkdown(line)}`).join('\n');
      resultText += `\n${quotedLines}\n`;
    }

    // Style prompt as italic
    if (analysis.style_prompt) {
      resultText += `\n_${escapeMarkdown(analysis.style_prompt.substring(0, 200))}_\n`;
    }

    // Lyrics preview
    if (pipelineResult?.lyrics) {
      const lyricsPreview = pipelineResult.lyrics.substring(0, 100);
      resultText += `\n📝 *Текст:*\n_${escapeMarkdown(lyricsPreview)}${pipelineResult.lyrics.length > 100 ? '\\.\\.\\.' : ''}_\n`;
    }

    // Stem info
    if (pipelineResult?.stem_separation_started || pipelineResult?.stems?.status === 'completed') {
      resultText += `\n🎛 Стемы: ${pipelineResult?.stems?.status === 'completed' ? 'Готовы' : 'Обрабатываются'}\n`;
    }

    // Build action keyboard
    const hasLyrics = pipelineResult?.lyrics && pipelineResult.lyrics.length > 0;
    const keyboardRows = [
      [
        { text: '🎤 Создать кавер', callback_data: 'audio_action_cover' },
        { text: '➕ Расширить трек', callback_data: 'audio_action_extend' }
      ],
      [
        { text: '🎛️ Разделить на стемы', callback_data: 'audio_action_stems' },
        { text: '🎹 MIDI', callback_data: 'audio_action_midi' }
      ],
      hasLyrics 
        ? [{ text: '📝 Полный текст', callback_data: 'audio_action_show_lyrics' }]
        : [],
      [
        { text: '✏️ Изменить стиль', callback_data: 'audio_action_edit_style' },
        { text: '📂 Мои загрузки', callback_data: 'my_uploads' }
      ],
      [
        { text: '📱 Открыть в приложении', web_app: { url: `${BOT_CONFIG.miniAppUrl}?startapp=cloud` } }
      ]
    ].filter(row => row.length > 0);

    // Send final result as new message
    const resultMsg = await sendMessage(chatId, resultText, { inline_keyboard: keyboardRows });
    if (resultMsg?.result?.message_id) {
      await setActiveMenuMessageId(userId, chatId, resultMsg.result.message_id, 'audio_result');
    }

    trackMetric({
      eventType: 'upload_completed',
      success: true,
      telegramChatId: chatId,
      responseTimeMs: Date.now() - startTime,
      metadata: { 
        referenceId: pipelineResult?.reference_id,
        hasLyrics: !!pipelineResult?.lyrics,
        hasVocals: analysis.has_vocals,
        hasInstrumental: analysis.has_instrumental,
        stemsSeparated: pipelineResult?.stem_separation_started,
      },
    });

  } catch (error) {
    logger.error('Error in handleAutoUploadWithPipeline', error);
    
    // Clean up progress message
    if (progressMessageId) {
      try {
        await deleteMessage(chatId, progressMessageId);
      } catch (e) { /* ignore */ }
    }
    
    await sendMessage(chatId, `❌ Ошибка обработки аудио\\.\n\n${escapeMarkdown(error instanceof Error ? error.message : 'Попробуйте ещё раз')}`);
    
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
 * Store temporary audio file_id for later processing
 */
async function storeTemporaryAudio(
  userId: number,
  fileId: string,
  type: 'audio' | 'voice' | 'document',
  analysisResult?: { style?: string; genre?: string; mood?: string; lyrics?: string; hasVocals?: boolean }
): Promise<void> {
  try {
    await setPendingAudio(userId, fileId, type, analysisResult);
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
 * Handle cloud upload with full analysis - save audio to storage with style analysis and lyrics extraction
 */
async function handleCloudUploadWithAnalysis(
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

    await sendMessage(chatId, '⬇️ Загружаю файл в облако и анализирую\\.\\.\\.');

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

    // Run full analysis with transcribe-lyrics
    await sendMessage(chatId, '🔍 Анализирую стиль и извлекаю текст\\.\\.\\.');
    
    let analysisResult: {
      genre?: string;
      mood?: string;
      vocalStyle?: string;
      lyrics?: string;
      hasVocals?: boolean;
      language?: string;
    } = {};
    
    try {
      const { data: transcribeData, error: transcribeError } = await supabase.functions.invoke(
        'transcribe-lyrics',
        {
          body: {
            audio_url: publicUrl,
            analyze_style: true,
          },
        }
      );
      
      if (!transcribeError && transcribeData) {
        analysisResult = {
          genre: transcribeData.analysis?.genre,
          mood: transcribeData.analysis?.mood,
          vocalStyle: transcribeData.analysis?.vocal_style,
          lyrics: transcribeData.lyrics,
          hasVocals: transcribeData.has_vocals,
          language: transcribeData.language,
        };
      }
    } catch (analysisError) {
      logger.error('Analysis failed during upload', analysisError);
      // Continue without analysis
    }

    // Save to reference_audio table with analysis results
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
        genre: analysisResult.genre,
        mood: analysisResult.mood,
        vocal_style: analysisResult.vocalStyle,
        transcription: analysisResult.lyrics,
        has_vocals: analysisResult.hasVocals,
        detected_language: analysisResult.language,
        analysis_status: 'completed',
        analyzed_at: new Date().toISOString(),
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

    // Build result message
    let resultText = `✅ *Аудио загружено в облако\\!*

📁 Файл: _${escapeMarkdown(displayName)}_`;

    if (duration) {
      resultText += `\n⏱️ Длительность: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;
    }
    
    if (analysisResult.genre) {
      resultText += `\n🎵 Жанр: ${escapeMarkdown(analysisResult.genre)}`;
    }
    if (analysisResult.mood) {
      resultText += `\n💫 Настроение: ${escapeMarkdown(analysisResult.mood)}`;
    }
    if (analysisResult.hasVocals !== undefined) {
      resultText += analysisResult.hasVocals 
        ? `\n🎤 Вокал: Обнаружен` 
        : `\n🎸 Тип: Инструментал`;
    }
    if (analysisResult.lyrics) {
      const lyricsPreview = analysisResult.lyrics.substring(0, 150);
      resultText += `\n\n📝 *Текст:*\n_${escapeMarkdown(lyricsPreview)}${analysisResult.lyrics.length > 150 ? '\\.\\.\\.' : ''}_`;
    }

    resultText += `\n\nТеперь вы можете использовать этот файл для:
• 🎤 Создания каверов
• 🔄 Расширения треков
• 🎛️ Работы в Studio`;

    // Build keyboard with actions
    const keyboard = {
      inline_keyboard: [
        [
          { text: '🎤 Создать кавер', callback_data: `use_ref_cover_${savedRef?.id}` },
          { text: '🔄 Расширить', callback_data: `use_ref_extend_${savedRef?.id}` }
        ],
        analysisResult.lyrics ? [
          { text: '📝 Полный текст', callback_data: `show_lyrics_${savedRef?.id}` }
        ] : [],
        [
          { text: '📂 Мои загрузки', callback_data: 'my_uploads' },
          { text: '📱 Открыть в приложении', web_app: { url: `${BOT_CONFIG.miniAppUrl}?startapp=cloud` } }
        ]
      ].filter(row => row.length > 0)
    };

    await sendMessage(chatId, resultText, keyboard);

    trackMetric({
      eventType: 'upload_completed_with_analysis',
      success: true,
      telegramChatId: chatId,
      responseTimeMs: Date.now() - startTime,
      metadata: { 
        referenceId: savedRef?.id,
        hasLyrics: !!analysisResult.lyrics,
        hasVocals: analysisResult.hasVocals,
      },
    });

  } catch (error) {
    logger.error('Error in handleCloudUploadWithAnalysis', error);
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
    // Security: Check user quota before processing
    const { checkAndDeductQuota } = await import('../utils/quota-checker.ts');
    const operationType = pendingUpload.mode === 'cover' ? 'upload_cover' : 'upload_extend';

    const quotaCheck = await checkAndDeductQuota(userId, operationType, {
      telegramChatId,
      mode: pendingUpload.mode,
    });

    if (!quotaCheck.allowed) {
      logger.warn('Quota check failed', {
        userId,
        reason: quotaCheck.reason,
        balance: quotaCheck.creditsBalance,
      });
      return {
        success: false,
        error: quotaCheck.reason || 'Недостаточно кредитов для выполнения операции',
      };
    }

    logger.info('Quota check passed', {
      userId,
      balance: quotaCheck.creditsBalance,
      subscription: quotaCheck.subscriptionTier,
    });

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
    
    // For Bot: Auto-select appropriate model based on duration
    // If audio > 60 seconds, use V5, V4_5PLUS, or V4_5 (NOT V4_5ALL)
    // Prioritize V5 for long audio
    let selectedModel = apiModel;
    if (!pendingUpload.model) {
      // Only auto-select if user didn't specify
      selectedModel = 'V5'; // Default to V5 for bot (best quality, 480s limit)
      logger.info('Auto-selected V5 model for bot upload');
    } else if (apiModel === 'V4_5' && model === 'V4_5ALL') {
      // If user somehow selected V4_5ALL, map to V4_5 which supports longer audio
      selectedModel = 'V4_5';
    }

    // Fixed: Determine if we have custom parameters
    const hasCustomParams = Boolean(
      pendingUpload.style ||
      pendingUpload.prompt ||
      pendingUpload.title
    );

    const requestBody: Record<string, unknown> = {
      uploadUrl: publicUrl,
      model: selectedModel, // Use auto-selected or user-specified model
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
    
    logger.apiCall('SunoAPI', isExtend ? 'upload-extend' : 'upload-cover', { model: selectedModel });
    
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
