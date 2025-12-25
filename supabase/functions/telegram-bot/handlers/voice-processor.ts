/**
 * Voice Message Processor for Telegram Bot
 * 
 * Full pipeline:
 * 1. Download voice from Telegram
 * 2. Save to cloud storage
 * 3. Transcribe speech to text
 * 4. Detect melody (if hummed/sung) via MIDI transcription
 * 5. Format for Suno API compatibility
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BOT_CONFIG } from '../config.ts';
import { sendMessage, editMessageText, deleteMessage } from '../telegram-api.ts';
import { escapeMarkdown, trackMetric } from '../utils/index.ts';
import { createLogger } from '../../_shared/logger.ts';
import { setActiveMenuMessageId, deleteActiveMenu } from '../core/active-menu-manager.ts';

const logger = createLogger('voice-processor');

const supabase = createClient(
  BOT_CONFIG.supabaseUrl,
  BOT_CONFIG.supabaseServiceKey
);

interface TelegramVoice {
  file_id: string;
  file_unique_id: string;
  duration: number;
  mime_type?: string;
  file_size?: number;
}

interface VoiceProcessingResult {
  success: boolean;
  referenceId?: string;
  fileUrl?: string;
  transcription?: string;
  hasMelody?: boolean;
  midiUrl?: string;
  notes?: Array<{ pitch: number; startTime: number; endTime: number }>;
  error?: string;
}

/**
 * Process voice message with full pipeline:
 * - Cloud storage
 * - Speech transcription
 * - Melody detection
 * - Suno format preparation
 */
export async function processVoiceMessage(
  chatId: number,
  userId: number,
  voice: TelegramVoice
): Promise<VoiceProcessingResult> {
  const startTime = Date.now();
  let progressMessageId: number | undefined;

  try {
    // Delete any active menu
    await deleteActiveMenu(userId, chatId);

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, language_code')
      .eq('telegram_id', userId)
      .single();

    if (!profile) {
      await sendMessage(chatId, '❌ Профиль не найден\\. Откройте приложение для регистрации\\.');
      return { success: false, error: 'Profile not found' };
    }

    // Check voice duration (max 5 min for melody, max 60s for transcription)
    if (voice.duration > 300) {
      await sendMessage(chatId, '⚠️ Голосовое сообщение слишком длинное\\. Максимум 5 минут\\.');
      return { success: false, error: 'Duration too long' };
    }

    // Send initial progress
    const progressMsg = await sendMessage(
      chatId,
      '🎤 *Обрабатываю голосовое сообщение\\.\\.\\.*\n\n' +
        '▓░░░░░░░░░ 5%\n' +
        '⏳ Загружаю в облако\\.\\.\\.'
    );
    progressMessageId = progressMsg?.result?.message_id;

    // Get file URL from Telegram
    const fileUrl = await getFileUrl(voice.file_id);
    if (!fileUrl) {
      if (progressMessageId) {
        await editMessageText(chatId, progressMessageId, '❌ Не удалось получить файл\\.');
      }
      return { success: false, error: 'Failed to get file' };
    }

    // Download voice file
    const audioResponse = await fetch(fileUrl);
    if (!audioResponse.ok) {
      throw new Error('Failed to download voice from Telegram');
    }

    // IMPORTANT: Response body can only be consumed once, so use arrayBuffer first
    // and create Blob from it if needed
    const audioBuffer = await audioResponse.arrayBuffer();

    // Update progress
    if (progressMessageId) {
      await editMessageText(
        chatId,
        progressMessageId,
        '🎤 *Загружаю в облако\\.\\.\\.*\n\n' +
          '▓▓░░░░░░░░ 20%\n' +
          '☁️ Сохраняю аудио\\.\\.\\.'
      );
    }

    // Upload to cloud storage (OGG format from Telegram)
    const timestamp = Date.now();
    const storagePath = `${profile.user_id}/voice-messages/voice_${timestamp}.ogg`;

    const { error: uploadError } = await supabase.storage
      .from('reference-audio')
      .upload(storagePath, new Uint8Array(audioBuffer), {
        contentType: 'audio/ogg',
        upsert: false,
      });

    if (uploadError) {
      logger.error('Cloud upload error', uploadError);
      throw new Error('Failed to upload to cloud');
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('reference-audio').getPublicUrl(storagePath);

    logger.info('Voice uploaded to storage', { storagePath, publicUrl });

    // Update progress
    if (progressMessageId) {
      await editMessageText(
        chatId,
        progressMessageId,
        '🎤 *Распознаю речь\\.\\.\\.*\n\n' +
          '▓▓▓▓░░░░░░ 40%\n' +
          '🗣️ Транскрибирую аудио\\.\\.\\.'
      );
    }

    // Transcribe speech (for short voice messages)
    let transcription: string | undefined;
    if (voice.duration <= 60) {
      try {
        const base64Audio = arrayBufferToBase64(audioBuffer);
        
        const { data: transcriptData, error: transcriptError } = await supabase.functions.invoke(
          'speech-to-text',
          {
            body: {
              audio: base64Audio,
              language: profile.language_code || 'ru',
            },
          }
        );

        if (!transcriptError && transcriptData?.text) {
          transcription = transcriptData.text.trim();
          logger.info('Transcription successful', { length: transcription?.length || 0 });
        }
      } catch (e) {
        logger.error('Transcription failed', e);
        // Continue without transcription
      }
    }

    // Update progress
    if (progressMessageId) {
      await editMessageText(
        chatId,
        progressMessageId,
        '🎤 *Анализирую мелодию\\.\\.\\.*\n\n' +
          '▓▓▓▓▓▓░░░░ 60%\n' +
          '🎵 Ищу ноты и мелодию\\.\\.\\.'
      );
    }

    // Detect melody via MIDI transcription (for longer recordings or humming)
    let hasMelody = false;
    let midiUrl: string | undefined;
    let notes: Array<{ pitch: number; startTime: number; endTime: number }> | undefined;

    try {
      const { data: midiData, error: midiError } = await supabase.functions.invoke(
        'replicate-midi-transcription',
        {
          body: {
            audioUrl: publicUrl,
            model: 'basic-pitch',
          },
        }
      );

      if (!midiError && midiData?.success) {
        hasMelody = midiData.notes_count > 10; // Consider melody if >10 notes
        midiUrl = midiData.midiUrl;
        notes = midiData.notes;
        logger.info('Melody detection result', { 
          notesCount: midiData.notes_count, 
          hasMelody 
        });
      }
    } catch (e) {
      logger.error('Melody detection failed', e);
      // Continue without melody
    }

    // Update progress
    if (progressMessageId) {
      await editMessageText(
        chatId,
        progressMessageId,
        '🎤 *Сохраняю результаты\\.\\.\\.*\n\n' +
          '▓▓▓▓▓▓▓▓░░ 80%\n' +
          '💾 Записываю в базу\\.\\.\\.'
      );
    }

    // Save to reference_audio table
    const { data: savedRef, error: dbError } = await supabase
      .from('reference_audio')
      .insert({
        user_id: profile.user_id,
        file_name: `Голосовое ${new Date().toLocaleDateString('ru-RU')}`,
        file_url: publicUrl,
        file_size: voice.file_size,
        mime_type: 'audio/ogg',
        duration_seconds: voice.duration,
        source: 'telegram_voice',
        transcription: transcription,
        has_vocals: !!transcription,
        has_instrumentals: hasMelody,
        analysis_status: 'completed',
        analyzed_at: new Date().toISOString(),
        metadata: {
          telegram_file_id: voice.file_id,
          midi_url: midiUrl,
          notes_count: notes?.length || 0,
          has_melody: hasMelody,
        },
      })
      .select('id')
      .single();

    if (dbError) {
      logger.error('Error saving voice reference', dbError);
    }

    // Delete progress message
    if (progressMessageId) {
      try {
        await deleteMessage(chatId, progressMessageId);
      } catch (e) {
        /* ignore */
      }
    }

    // Build result message
    let resultText = `✅ *Голосовое сообщение обработано\\!*\n\n`;
    resultText += `⏱ Длительность: ${formatDuration(voice.duration)}\n`;

    if (transcription) {
      const preview = transcription.substring(0, 150);
      resultText += `\n📝 *Распознанный текст:*\n`;
      resultText += `>${escapeMarkdown(preview)}${transcription.length > 150 ? '\\.\\.\\.' : ''}\n`;
    }

    if (hasMelody && notes) {
      resultText += `\n🎵 *Обнаружена мелодия\\!*\n`;
      resultText += `>🎹 Нот: ${notes.length}\n`;
      
      // Calculate pitch range
      if (notes.length > 0) {
        const pitches = notes.map(n => n.pitch);
        const minPitch = Math.min(...pitches);
        const maxPitch = Math.max(...pitches);
        resultText += `>🎼 Диапазон: ${midiNoteToName(minPitch)} \\- ${midiNoteToName(maxPitch)}\n`;
      }
    }

    // Simplified action keyboard - Cover/Extend only available in app interface
    const keyboard: Array<Array<{ text: string; callback_data?: string; web_app?: { url: string } }>> = [];

    // Build deeplink with reference ID if available
    const deeplink = savedRef?.id 
      ? `${BOT_CONFIG.miniAppUrl}?startapp=ref_${savedRef.id}`
      : `${BOT_CONFIG.miniAppUrl}?startapp=cloud`;

    // Main action - open in app
    keyboard.push([
      { text: '📱 Открыть в приложении', web_app: { url: deeplink } },
    ]);

    // Menu button
    keyboard.push([
      { text: '📋 Меню', callback_data: 'main_menu' },
    ]);

    // Send result message
    const resultMsg = await sendMessage(chatId, resultText, { inline_keyboard: keyboard });
    if (resultMsg?.result?.message_id) {
      await setActiveMenuMessageId(userId, chatId, resultMsg.result.message_id, 'voice_result');
    }

    // Track metrics
    trackMetric({
      eventType: 'voice_transcribed',
      success: true,
      telegramChatId: chatId,
      responseTimeMs: Date.now() - startTime,
      metadata: {
        duration: voice.duration,
        hasTranscription: !!transcription,
        hasMelody,
        notesCount: notes?.length || 0,
        referenceId: savedRef?.id,
      },
    });

    return {
      success: true,
      referenceId: savedRef?.id,
      fileUrl: publicUrl,
      transcription,
      hasMelody,
      midiUrl,
      notes,
    };
  } catch (error) {
    logger.error('Error processing voice message', error);

    if (progressMessageId) {
      await editMessageText(chatId, progressMessageId, '❌ Ошибка обработки голосового сообщения\\.');
    } else {
      await sendMessage(chatId, '❌ Ошибка обработки голосового сообщения\\.');
    }

    trackMetric({
      eventType: 'voice_transcription_failed',
      success: false,
      telegramChatId: chatId,
      errorMessage: error instanceof Error ? error.message : String(error),
      responseTimeMs: Date.now() - startTime,
    });

    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Handle voice message callbacks
 */
export async function handleVoiceProcessorCallback(
  data: string,
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string
): Promise<boolean> {
  const { answerCallbackQuery } = await import('../telegram-api.ts');

  try {
    // Generate track from voice transcription
    if (data.startsWith('voice_to_track_')) {
      const refId = data.replace('voice_to_track_', '');
      await handleVoiceToTrack(chatId, userId, refId, messageId);
      await answerCallbackQuery(queryId, '🎵 Начинаю генерацию!');
      return true;
    }

    // Edit text
    if (data.startsWith('voice_edit_text_')) {
      await editMessageText(
        chatId,
        messageId,
        '✏️ *Редактирование текста*\n\n' +
          'Отправьте исправленный текст для генерации\\.\n\n' +
          'Или используйте /cancel для отмены\\.'
      );
      await answerCallbackQuery(queryId);
      return true;
    }

    // Download MIDI
    if (data.startsWith('voice_download_midi_')) {
      const refId = data.replace('voice_download_midi_', '');
      await handleDownloadMidi(chatId, refId);
      await answerCallbackQuery(queryId, '📥 Отправляю MIDI файл');
      return true;
    }

    // Create arrangement from melody
    if (data.startsWith('voice_to_arrangement_')) {
      const refId = data.replace('voice_to_arrangement_', '');
      await handleVoiceToArrangement(chatId, userId, refId, messageId);
      await answerCallbackQuery(queryId, '🎸 Создаю аранжировку!');
      return true;
    }

    // Create cover
    if (data.startsWith('voice_to_cover_')) {
      const refId = data.replace('voice_to_cover_', '');
      await handleVoiceToCover(chatId, userId, refId, messageId);
      await answerCallbackQuery(queryId, '🎤 Готовлю кавер!');
      return true;
    }

    // Separate stems
    if (data.startsWith('voice_to_stems_')) {
      const refId = data.replace('voice_to_stems_', '');
      await handleVoiceToStems(chatId, userId, refId, messageId);
      await answerCallbackQuery(queryId, '🎛️ Разделяю на стемы!');
      return true;
    }

    return false;
  } catch (error) {
    logger.error('Error handling voice callback', error);
    await answerCallbackQuery(queryId, 'Произошла ошибка');
    return false;
  }
}

// Handler implementations
async function handleVoiceToTrack(
  chatId: number,
  userId: number,
  refId: string,
  messageId: number
): Promise<void> {
  const { data: ref } = await supabase
    .from('reference_audio')
    .select('transcription, file_url')
    .eq('id', refId)
    .single();

  if (!ref?.transcription) {
    await editMessageText(chatId, messageId, '❌ Текст не найден\\.');
    return;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('telegram_id', userId)
    .single();

  if (!profile) {
    await editMessageText(chatId, messageId, '❌ Профиль не найден\\.');
    return;
  }

  await editMessageText(
    chatId,
    messageId,
    '🎵 *Генерация начата\\!*\n\n' +
      `📝 ${escapeMarkdown(ref.transcription.substring(0, 100))}${ref.transcription.length > 100 ? '\\.\\.\\.' : ''}\n\n` +
      '⏳ Обычно занимает 1\\-3 минуты\\.\n' +
      '🔔 Вы получите уведомление\\!'
  );

  // Start generation
  await supabase.functions.invoke('suno-generate', {
    body: {
      prompt: ref.transcription,
      userId: profile.user_id,
      instrumental: false,
      source: 'telegram_voice',
      chatId,
      messageId,
    },
  });
}

async function handleDownloadMidi(chatId: number, refId: string): Promise<void> {
  const { data: ref } = await supabase
    .from('reference_audio')
    .select('metadata, file_name')
    .eq('id', refId)
    .single();

  const midiUrl = (ref?.metadata as any)?.midi_url;
  if (!midiUrl) {
    await sendMessage(chatId, '❌ MIDI файл не найден\\.');
    return;
  }

  // Send MIDI file as document via URL
  await sendMessage(chatId, `🎹 *MIDI файл:*\n\n[Скачать MIDI](${escapeMarkdown(midiUrl)})`, {
    inline_keyboard: [[{ text: '📥 Скачать MIDI', url: midiUrl }]]
  });
}

async function handleVoiceToArrangement(
  chatId: number,
  userId: number,
  refId: string,
  messageId: number
): Promise<void> {
  const { data: ref } = await supabase
    .from('reference_audio')
    .select('metadata, file_url')
    .eq('id', refId)
    .single();

  if (!ref) {
    await editMessageText(chatId, messageId, '❌ Референс не найден\\.');
    return;
  }

  await editMessageText(
    chatId,
    messageId,
    '🎸 *Создаю аранжировку на основе мелодии\\.\\.\\.*\n\n' +
      '⏳ Это может занять несколько минут\\.'
  );

  // Trigger arrangement generation via cover with melody weight
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('telegram_id', userId)
    .single();

  if (profile) {
    await supabase.functions.invoke('suno-remix', {
      body: {
        audioUrl: ref.file_url,
        userId: profile.user_id,
        prompt: 'Create a full arrangement based on this melody',
        audioWeight: 0.8, // High weight to preserve melody
        source: 'telegram_voice_arrangement',
        chatId,
      },
    });
  }
}

async function handleVoiceToCover(
  chatId: number,
  userId: number,
  refId: string,
  messageId: number
): Promise<void> {
  const { data: ref } = await supabase
    .from('reference_audio')
    .select('file_url')
    .eq('id', refId)
    .single();

  if (!ref) {
    await editMessageText(chatId, messageId, '❌ Референс не найден\\.');
    return;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('telegram_id', userId)
    .single();

  if (!profile) {
    await editMessageText(chatId, messageId, '❌ Профиль не найден\\.');
    return;
  }

  await editMessageText(
    chatId,
    messageId,
    '🎤 *Создаю кавер\\.\\.\\.*\n\n' +
      '⏳ Обычно занимает 2\\-4 минуты\\.'
  );

  await supabase.functions.invoke('suno-remix', {
    body: {
      audioUrl: ref.file_url,
      userId: profile.user_id,
      prompt: 'Create a cover version',
      audioWeight: 0.5,
      source: 'telegram_voice_cover',
      chatId,
    },
  });
}

async function handleVoiceToStems(
  chatId: number,
  userId: number,
  refId: string,
  messageId: number
): Promise<void> {
  const { data: ref } = await supabase
    .from('reference_audio')
    .select('file_url')
    .eq('id', refId)
    .single();

  if (!ref) {
    await editMessageText(chatId, messageId, '❌ Референс не найден\\.');
    return;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('telegram_id', userId)
    .single();

  if (!profile) {
    await editMessageText(chatId, messageId, '❌ Профиль не найден\\.');
    return;
  }

  await editMessageText(
    chatId,
    messageId,
    '🎛️ *Разделяю на стемы\\.\\.\\.*\n\n' +
      '⏳ Обычно занимает 1\\-2 минуты\\.'
  );

  await supabase.functions.invoke('suno-separate-vocals', {
    body: {
      audioUrl: ref.file_url,
      userId: profile.user_id,
      source: 'telegram_voice_stems',
      chatId,
    },
  });
}

// Utility functions
async function getFileUrl(fileId: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_CONFIG.botToken}/getFile?file_id=${fileId}`
    );

    const data = await response.json();

    if (!data.ok || !data.result?.file_path) {
      return null;
    }

    return `https://api.telegram.org/file/bot${BOT_CONFIG.botToken}/${data.result.file_path}`;
  } catch (error) {
    logger.error('Error getting file URL', error);
    return null;
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}с`;
}

function midiNoteToName(note: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(note / 12) - 1;
  const noteName = noteNames[note % 12];
  return `${noteName}${octave}`;
}
