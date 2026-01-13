/**
 * /analyze command - Audio analysis using Klangio API
 * Transcription, chord recognition, beat tracking, MIDI/PDF export
 */

import { getSupabaseClient } from '../core/supabase-client.ts';
import { BOT_CONFIG } from '../config.ts';
import { sendMessage, editMessageText, answerCallbackQuery, escapeMarkdownV2 } from '../telegram-api.ts';
import { trackMetric, formatDuration } from '../utils/index.ts';
import { createLogger } from '../../_shared/logger.ts';

const logger = createLogger('telegram-analyze-cmd');

const supabase = getSupabaseClient();

interface AnalysisSession {
  referenceId: string;
  audioUrl: string;
  fileName: string;
  userId: string;
}

// Simple in-memory session storage
const analysisSessions = new Map<number, AnalysisSession>();

export function setAnalysisSession(telegramUserId: number, session: AnalysisSession): void {
  analysisSessions.set(telegramUserId, session);
}

export function getAnalysisSession(telegramUserId: number): AnalysisSession | undefined {
  return analysisSessions.get(telegramUserId);
}

export function clearAnalysisSession(telegramUserId: number): void {
  analysisSessions.delete(telegramUserId);
}

/**
 * /analyze command - show analysis menu for uploaded audio
 */
export async function handleAnalyzeCommand(
  chatId: number,
  userId: number,
  args: string
): Promise<void> {
  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', userId)
      .single();

    if (!profile) {
      await sendMessage(chatId, '❌ Профиль не найден. Откройте Mini App для регистрации.', undefined, null);
      return;
    }

    // Get user's uploaded reference audio
    const { data: uploads, error } = await supabase
      .from('reference_audio')
      .select('id, file_name, file_url, duration_seconds')
      .eq('user_id', profile.user_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error || !uploads || uploads.length === 0) {
      await sendMessage(chatId, `🔍 Анализ аудио

У вас нет загруженных файлов для анализа.

Сначала загрузите аудио командой /upload или отправьте аудиофайл в чат.`, {
        inline_keyboard: [[
          { text: '☁️ Загрузить аудио', callback_data: 'start_upload' }
        ]]
      }, null);
      return;
    }

    // Build keyboard with uploaded files
    const fileButtons = uploads.map(upload => [{
      text: `🎵 ${upload.file_name.substring(0, 25)}${upload.file_name.length > 25 ? '...' : ''} (${formatDuration(upload.duration_seconds || 0)})`,
      callback_data: `analyze_select_${upload.id.substring(0, 20)}`
    }]);

    await sendMessage(chatId, `🔍 Анализ аудио

Выберите файл для анализа:

Доступные функции:
• 🎼 Транскрипция (MIDI, PDF, Guitar Pro)
• 🎸 Распознавание аккордов
• 🥁 Определение темпа (BPM)`, {
      inline_keyboard: [
        ...fileButtons,
        [{ text: '☁️ Загрузить новый', callback_data: 'start_upload' }]
      ]
    }, null);

    trackMetric({
      eventType: 'analyze_command',
      success: true,
      telegramChatId: chatId,
    });

  } catch (error) {
    logger.error('Error in handleAnalyzeCommand', error);
    await sendMessage(chatId, '❌ Произошла ошибка. Попробуйте позже.', undefined, null);
  }
}

/**
 * Handle file selection for analysis
 */
export async function handleAnalyzeSelect(
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

    // Get reference audio
    const { data: reference } = await supabase
      .from('reference_audio')
      .select('id, file_name, file_url, duration_seconds')
      .eq('id', referenceId)
      .single();

    if (!reference) {
      await answerCallbackQuery(callbackId, '❌ Файл не найден');
      return;
    }

    // Save session
    setAnalysisSession(userId, {
      referenceId,
      audioUrl: reference.file_url,
      fileName: reference.file_name,
      userId: profile.user_id,
    });

    const fileName = reference.file_name.length > 30 
      ? reference.file_name.substring(0, 27) + '...' 
      : reference.file_name;

    await editMessageText(chatId, messageId, `🔍 *Анализ:* ${escapeMarkdownV2(fileName)}

Выберите тип анализа:`, {
      inline_keyboard: [
        [
          { text: '🎼 Транскрипция', callback_data: `analyze_transcribe_${referenceId.substring(0, 20)}` },
        ],
        [
          { text: '🎸 Аккорды', callback_data: `analyze_chords_${referenceId.substring(0, 20)}` },
          { text: '🥁 Темп/BPM', callback_data: `analyze_beats_${referenceId.substring(0, 20)}` },
        ],
        [
          { text: '📊 Полный анализ', callback_data: `analyze_full_${referenceId.substring(0, 20)}` },
        ],
        [
          { text: '🔙 К списку', callback_data: 'analyze_list' }
        ]
      ]
    }, 'MarkdownV2');
    await answerCallbackQuery(callbackId);

  } catch (error) {
    logger.error('Error in handleAnalyzeSelect', error);
    await answerCallbackQuery(callbackId, '❌ Ошибка');
  }
}

/**
 * Handle transcription model selection
 */
export async function handleTranscribeMenu(
  chatId: number,
  userId: number,
  referenceId: string,
  messageId: number,
  callbackId: string
): Promise<void> {
  await editMessageText(chatId, messageId, `🎼 *Транскрипция*

Выберите модель для анализа:

🎸 *Guitar* \\- для гитарных партий
🎹 *Piano* \\- для фортепиано  
🎤 *Vocal* \\- для мелодии голоса
🎵 *Universal* \\- автоопределение`, {
    inline_keyboard: [
      [
        { text: '🎸 Guitar', callback_data: `analyze_tr_guitar_${referenceId.substring(0, 16)}` },
        { text: '🎹 Piano', callback_data: `analyze_tr_piano_${referenceId.substring(0, 16)}` },
      ],
      [
        { text: '🎤 Vocal', callback_data: `analyze_tr_vocal_${referenceId.substring(0, 16)}` },
        { text: '🎵 Universal', callback_data: `analyze_tr_universal_${referenceId.substring(0, 16)}` },
      ],
      [
        { text: '🔙 Назад', callback_data: `analyze_select_${referenceId.substring(0, 20)}` }
      ]
    ]
  }, 'MarkdownV2');
  await answerCallbackQuery(callbackId);
}

/**
 * Run transcription analysis
 */
export async function handleTranscription(
  chatId: number,
  userId: number,
  referenceId: string,
  model: string,
  messageId: number,
  callbackId: string
): Promise<void> {
  const session = getAnalysisSession(userId);
  
  if (!session) {
    await answerCallbackQuery(callbackId, '❌ Сессия истекла');
    return;
  }

  await answerCallbackQuery(callbackId, '🔄 Запускаем транскрипцию...');

  await editMessageText(chatId, messageId, `🎼 *Транскрипция*

📁 ${escapeMarkdownV2(session.fileName)}
🎛️ Модель: ${model}

⏳ Анализ может занять 1\\-3 минуты\\.\\.\\.`, undefined, 'MarkdownV2');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    
    const response = await fetch(`${supabaseUrl}/functions/v1/klangio-analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BOT_CONFIG.supabaseServiceKey}`,
      },
      body: JSON.stringify({
        audio_url: session.audioUrl,
        mode: 'transcription',
        model: model,
        outputs: ['midi', 'midi_quant', 'gp5', 'pdf', 'mxml'],
        user_id: session.userId,
        title: session.fileName,
      }),
    });

    const result = await response.json();

    if (result.error) {
      await editMessageText(chatId, messageId, `❌ *Ошибка транскрипции*

${escapeMarkdownV2(result.message || result.error)}`, {
        inline_keyboard: [[
          { text: '🔄 Попробовать снова', callback_data: `analyze_transcribe_${referenceId.substring(0, 20)}` }
        ]]
      }, 'MarkdownV2');
      return;
    }

    // Build result message
    const files = result.files || {};
    const notesCount = result.notes?.length || 0;

    const message = `✅ *Транскрипция завершена\\!*

📁 ${escapeMarkdownV2(session.fileName)}
🎛️ Модель: ${model}
🎵 Нот распознано: ${notesCount}`;

    const downloadButtons: Array<{ text: string; url: string }> = [];

    if (files.midi) {
      downloadButtons.push({ text: '📥 MIDI', url: files.midi });
    }
    if (files.pdf) {
      downloadButtons.push({ text: '📄 PDF', url: files.pdf });
    }
    if (files.gp5) {
      downloadButtons.push({ text: '🎸 Guitar Pro', url: files.gp5 });
    }
    if (files.mxml) {
      downloadButtons.push({ text: '📋 MusicXML', url: files.mxml });
    }

    const keyboard: Array<Array<{ text: string; url?: string; callback_data?: string }>> = [];
    
    // Add download buttons in rows of 2
    for (let i = 0; i < downloadButtons.length; i += 2) {
      const row = downloadButtons.slice(i, i + 2);
      keyboard.push(row);
    }

    keyboard.push([
      { text: '🔍 Новый анализ', callback_data: `analyze_select_${referenceId.substring(0, 20)}` },
      { text: '📂 Мои загрузки', callback_data: 'my_uploads' }
    ]);

    await editMessageText(chatId, messageId, message, { inline_keyboard: keyboard }, 'MarkdownV2');

    trackMetric({
      eventType: 'analyze_transcription',
      success: true,
      telegramChatId: chatId,
      metadata: { model, notesCount },
    });

  } catch (error) {
    logger.error('Error in handleTranscription', error);
    await editMessageText(chatId, messageId, `❌ Ошибка при транскрипции\\. Попробуйте позже\\.`, {
      inline_keyboard: [[
        { text: '🔄 Попробовать снова', callback_data: `analyze_transcribe_${referenceId.substring(0, 20)}` }
      ]]
    }, 'MarkdownV2');
  }
}

/**
 * Run chord recognition
 */
export async function handleChordAnalysis(
  chatId: number,
  userId: number,
  referenceId: string,
  messageId: number,
  callbackId: string
): Promise<void> {
  const session = getAnalysisSession(userId);
  
  if (!session) {
    await answerCallbackQuery(callbackId, '❌ Сессия истекла');
    return;
  }

  await answerCallbackQuery(callbackId, '🔄 Анализируем аккорды...');

  await editMessageText(chatId, messageId, `🎸 *Распознавание аккордов*

📁 ${escapeMarkdownV2(session.fileName)}

⏳ Анализ занимает около минуты\\.\\.\\.`, undefined, 'MarkdownV2');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    
    const response = await fetch(`${supabaseUrl}/functions/v1/klangio-analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BOT_CONFIG.supabaseServiceKey}`,
      },
      body: JSON.stringify({
        audio_url: session.audioUrl,
        mode: 'chord-recognition-extended',
        vocabulary: 'full',
        user_id: session.userId,
      }),
    });

    const result = await response.json();

    if (result.error) {
      await editMessageText(chatId, messageId, `❌ *Ошибка*

${escapeMarkdownV2(result.message || result.error)}`, {
        inline_keyboard: [[
          { text: '🔄 Попробовать снова', callback_data: `analyze_chords_${referenceId.substring(0, 20)}` }
        ]]
      }, 'MarkdownV2');
      return;
    }

    const chords = result.chords || [];
    const key = result.key || 'Не определена';
    const strumming = result.strumming || [];

    // Format chords for display
    const uniqueChords = [...new Set(chords.map((c: any) => c.chord))].slice(0, 12);
    const chordsText = uniqueChords.length > 0 ? uniqueChords.join(' \\- ') : 'Не распознаны';

    // Format strumming pattern
    let strumPattern = '';
    if (strumming.length > 0) {
      strumPattern = strumming.slice(0, 8).map((s: any) => s.direction === 'U' ? '↑' : '↓').join(' ');
    }

    let message = `✅ *Аккорды распознаны\\!*

📁 ${escapeMarkdownV2(session.fileName)}

🎵 *Тональность:* ${escapeMarkdownV2(key)}
🎸 *Аккорды:* ${chordsText}`;

    if (strumPattern) {
      message += `\n🎶 *Ритм:* ${strumPattern}`;
    }

    message += `\n\n📊 Найдено ${chords.length} аккордовых смен`;

    await editMessageText(chatId, messageId, message, {
      inline_keyboard: [
        [
          { text: '🎼 Транскрибировать', callback_data: `analyze_transcribe_${referenceId.substring(0, 20)}` },
          { text: '🥁 Темп', callback_data: `analyze_beats_${referenceId.substring(0, 20)}` },
        ],
        [
          { text: '🔙 К меню', callback_data: `analyze_select_${referenceId.substring(0, 20)}` }
        ]
      ]
    }, 'MarkdownV2');

    trackMetric({
      eventType: 'analyze_chords',
      success: true,
      telegramChatId: chatId,
      metadata: { chordsCount: chords.length, key },
    });

  } catch (error) {
    logger.error('Error in handleChordAnalysis', error);
    await editMessageText(chatId, messageId, `❌ Ошибка анализа\\. Попробуйте позже\\.`, {
      inline_keyboard: [[
        { text: '🔄 Попробовать снова', callback_data: `analyze_chords_${referenceId.substring(0, 20)}` }
      ]]
    }, 'MarkdownV2');
  }
}

/**
 * Run beat tracking
 */
export async function handleBeatAnalysis(
  chatId: number,
  userId: number,
  referenceId: string,
  messageId: number,
  callbackId: string
): Promise<void> {
  const session = getAnalysisSession(userId);
  
  if (!session) {
    await answerCallbackQuery(callbackId, '❌ Сессия истекла');
    return;
  }

  await answerCallbackQuery(callbackId, '🔄 Анализируем темп...');

  await editMessageText(chatId, messageId, `🥁 *Определение темпа*

📁 ${escapeMarkdownV2(session.fileName)}

⏳ Анализ занимает около минуты\\.\\.\\.`, undefined, 'MarkdownV2');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    
    const response = await fetch(`${supabaseUrl}/functions/v1/klangio-analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BOT_CONFIG.supabaseServiceKey}`,
      },
      body: JSON.stringify({
        audio_url: session.audioUrl,
        mode: 'beat-tracking',
        user_id: session.userId,
      }),
    });

    const result = await response.json();

    if (result.error) {
      await editMessageText(chatId, messageId, `❌ *Ошибка*

${escapeMarkdownV2(result.message || result.error)}`, {
        inline_keyboard: [[
          { text: '🔄 Попробовать снова', callback_data: `analyze_beats_${referenceId.substring(0, 20)}` }
        ]]
      }, 'MarkdownV2');
      return;
    }

    const bpm = result.bpm || 0;
    const beats = result.beats || [];
    const downbeats = result.downbeats || [];

    // Estimate time signature from downbeats
    let timeSignature = '4/4';
    if (beats.length > 4 && downbeats.length > 1) {
      const beatsPerMeasure = Math.round(beats.filter((b: number) => b < downbeats[1]).length);
      if (beatsPerMeasure === 3) timeSignature = '3/4';
      else if (beatsPerMeasure === 6) timeSignature = '6/8';
    }

    const message = `✅ *Темп определён\\!*

📁 ${escapeMarkdownV2(session.fileName)}

🥁 *BPM:* ${bpm}
🎵 *Размер:* ${timeSignature}
📊 *Битов:* ${beats.length}
📊 *Тактов:* ${downbeats.length}`;

    await editMessageText(chatId, messageId, message, {
      inline_keyboard: [
        [
          { text: '🎼 Транскрибировать', callback_data: `analyze_transcribe_${referenceId.substring(0, 20)}` },
          { text: '🎸 Аккорды', callback_data: `analyze_chords_${referenceId.substring(0, 20)}` },
        ],
        [
          { text: '🔙 К меню', callback_data: `analyze_select_${referenceId.substring(0, 20)}` }
        ]
      ]
    }, 'MarkdownV2');

    trackMetric({
      eventType: 'analyze_beats',
      success: true,
      telegramChatId: chatId,
      metadata: { bpm, beatsCount: beats.length },
    });

  } catch (error) {
    logger.error('Error in handleBeatAnalysis', error);
    await editMessageText(chatId, messageId, `❌ Ошибка анализа\\. Попробуйте позже\\.`, {
      inline_keyboard: [[
        { text: '🔄 Попробовать снова', callback_data: `analyze_beats_${referenceId.substring(0, 20)}` }
      ]]
    }, 'MarkdownV2');
  }
}

/**
 * Run full analysis (all modes)
 */
export async function handleFullAnalysis(
  chatId: number,
  userId: number,
  referenceId: string,
  messageId: number,
  callbackId: string
): Promise<void> {
  const session = getAnalysisSession(userId);
  
  if (!session) {
    await answerCallbackQuery(callbackId, '❌ Сессия истекла');
    return;
  }

  await answerCallbackQuery(callbackId, '🔄 Запускаем полный анализ...');

  await editMessageText(chatId, messageId, `📊 *Полный анализ*

📁 ${escapeMarkdownV2(session.fileName)}

⏳ Выполняем:
• Транскрипция \\(MIDI, PDF\\)
• Распознавание аккордов
• Определение темпа

Это займёт 2\\-5 минут\\.\\.\\.`, undefined, 'MarkdownV2');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    
    // Run all analyses in parallel
    const [transcriptionResult, chordsResult, beatsResult] = await Promise.allSettled([
      fetch(`${supabaseUrl}/functions/v1/klangio-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BOT_CONFIG.supabaseServiceKey}`,
        },
        body: JSON.stringify({
          audio_url: session.audioUrl,
          mode: 'transcription',
          model: 'universal',
          outputs: ['midi', 'midi_quant', 'gp5', 'pdf', 'mxml'],
          user_id: session.userId,
          title: session.fileName,
        }),
      }).then(r => r.json()),
      
      fetch(`${supabaseUrl}/functions/v1/klangio-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BOT_CONFIG.supabaseServiceKey}`,
        },
        body: JSON.stringify({
          audio_url: session.audioUrl,
          mode: 'chord-recognition-extended',
          vocabulary: 'full',
          user_id: session.userId,
        }),
      }).then(r => r.json()),
      
      fetch(`${supabaseUrl}/functions/v1/klangio-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BOT_CONFIG.supabaseServiceKey}`,
        },
        body: JSON.stringify({
          audio_url: session.audioUrl,
          mode: 'beat-tracking',
          user_id: session.userId,
        }),
      }).then(r => r.json()),
    ]);

    // Extract results
    const transcription = transcriptionResult.status === 'fulfilled' ? transcriptionResult.value : null;
    const chords = chordsResult.status === 'fulfilled' ? chordsResult.value : null;
    const beats = beatsResult.status === 'fulfilled' ? beatsResult.value : null;

    // Build comprehensive result message
    let message = `✅ *Полный анализ завершён\\!*

📁 ${escapeMarkdownV2(session.fileName)}\n`;

    // Beat info
    if (beats && !beats.error) {
      message += `\n🥁 *Темп:* ${beats.bpm || '?'} BPM`;
    }

    // Chord info
    if (chords && !chords.error && chords.chords?.length > 0) {
      const key = chords.key || 'N/A';
      const uniqueChords = [...new Set(chords.chords.map((c: any) => c.chord))].slice(0, 8);
      message += `\n🎵 *Тональность:* ${escapeMarkdownV2(key)}`;
      message += `\n🎸 *Аккорды:* ${uniqueChords.join(' \\- ')}`;
    }

    // Transcription info
    if (transcription && !transcription.error) {
      const notesCount = transcription.notes?.length || 0;
      message += `\n🎼 *Нот:* ${notesCount}`;
    }

    // Build download buttons
    const downloadButtons: Array<{ text: string; url: string }> = [];
    if (transcription?.files?.midi) {
      downloadButtons.push({ text: '📥 MIDI', url: transcription.files.midi });
    }
    if (transcription?.files?.pdf) {
      downloadButtons.push({ text: '📄 PDF', url: transcription.files.pdf });
    }
    if (transcription?.files?.gp5) {
      downloadButtons.push({ text: '🎸 GP5', url: transcription.files.gp5 });
    }

    const keyboard: Array<Array<{ text: string; url?: string; callback_data?: string }>> = [];
    
    // Add download buttons
    if (downloadButtons.length > 0) {
      for (let i = 0; i < downloadButtons.length; i += 3) {
        keyboard.push(downloadButtons.slice(i, i + 3));
      }
    }

    keyboard.push([
      { text: '🔍 Другой файл', callback_data: 'analyze_list' },
      { text: '📂 Мои загрузки', callback_data: 'my_uploads' }
    ]);

    await editMessageText(chatId, messageId, message, { inline_keyboard: keyboard }, 'MarkdownV2');

    trackMetric({
      eventType: 'analyze_full',
      success: true,
      telegramChatId: chatId,
      metadata: { 
        bpm: beats?.bpm,
        chordsCount: chords?.chords?.length,
        notesCount: transcription?.notes?.length,
      },
    });

  } catch (error) {
    logger.error('Error in handleFullAnalysis', error);
    await editMessageText(chatId, messageId, `❌ Ошибка при анализе\\. Попробуйте позже\\.`, {
      inline_keyboard: [[
        { text: '🔄 Попробовать снова', callback_data: `analyze_full_${referenceId.substring(0, 20)}` }
      ]]
    }, 'MarkdownV2');
  }
}

/**
 * Show analysis list (same as /analyze command)
 */
export async function handleAnalyzeList(
  chatId: number,
  userId: number,
  messageId: number,
  callbackId: string
): Promise<void> {
  await answerCallbackQuery(callbackId);
  
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', userId)
      .single();

    if (!profile) {
      return;
    }

    const { data: uploads } = await supabase
      .from('reference_audio')
      .select('id, file_name, duration_seconds')
      .eq('user_id', profile.user_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!uploads || uploads.length === 0) {
      await editMessageText(chatId, messageId, `🔍 *Анализ аудио*

У вас нет загруженных файлов\\.

Используйте /upload чтобы загрузить аудио\\.`, {
        inline_keyboard: [[
          { text: '☁️ Загрузить аудио', callback_data: 'start_upload' }
        ]]
      }, 'MarkdownV2');
      return;
    }

    const fileButtons = uploads.map(upload => [{
      text: `🎵 ${upload.file_name.substring(0, 25)}${upload.file_name.length > 25 ? '...' : ''} (${formatDuration(upload.duration_seconds || 0)})`,
      callback_data: `analyze_select_${upload.id.substring(0, 20)}`
    }]);

    await editMessageText(chatId, messageId, `🔍 *Анализ аудио*

Выберите файл для анализа:`, {
      inline_keyboard: [
        ...fileButtons,
        [{ text: '☁️ Загрузить новый', callback_data: 'start_upload' }]
      ]
    }, 'MarkdownV2');

  } catch (error) {
    logger.error('Error in handleAnalyzeList', error);
  }
}
