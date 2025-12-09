/**
 * Guitar analysis command for Telegram bot
 * Handles voice/audio recording and analyzes guitar playing
 */

import { sendMessage, editMessageText } from '../telegram-api.ts';
import { BOT_CONFIG } from '../config.ts';
import { logger, escapeMarkdown, trackMetric } from '../utils/index.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabase = createClient(
  BOT_CONFIG.supabaseUrl,
  BOT_CONFIG.supabaseServiceKey
);

// Session store for guitar analysis
const GUITAR_SESSIONS: Record<string, { 
  chatId: number; 
  userId: number; 
  createdAt: number;
  supabaseUserId?: string;
}> = {};

export function getGuitarHelp(): string {
  return `🎸 *Анализ гитарной партии*

Запишите голосовое сообщение с игрой на гитаре или отправьте аудиофайл\\.

Система проанализирует:
• 🎵 Ноты и аккорды
• 🥁 BPM и карту битов
• 🎹 Конвертация в MIDI
• 🎼 TAB\\-транскрипция

Как использовать:
1\\. Отправьте /guitar
2\\. Запишите игру на гитаре \\(10\\-60 сек\\)
3\\. Получите полный анализ с нотами и аккордами

Результаты можно экспортировать в MIDI для работы в DAW\\.`;
}

export async function handleGuitarCommand(
  chatId: number,
  userId: number
): Promise<void> {
  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', userId)
      .single();

    // Start guitar session
    GUITAR_SESSIONS[`${userId}`] = {
      chatId,
      userId,
      createdAt: Date.now(),
      supabaseUserId: profile?.user_id
    };

    await sendMessage(chatId, `🎸 *Анализ гитарной партии*

Отправьте:
• 🎤 Голосовое сообщение с игрой на гитаре
• 🎵 Аудио файл \\(MP3, WAV, M4A\\)

📌 *Рекомендации для лучшего анализа:*
• Записывайте 10\\-60 секунд
• Играйте чётко и ритмично
• Минимизируйте фоновый шум

Я определю ноты, аккорды, BPM и создам MIDI\\-файл\\!`, {
      inline_keyboard: [[
        { text: '❌ Отмена', callback_data: 'cancel_guitar' },
        { text: '📱 Открыть в приложении', web_app: { url: `${BOT_CONFIG.miniAppUrl}?startapp=guitar` } }
      ]]
    });

    // Clean up old sessions
    cleanupOldGuitarSessions();
  } catch (error) {
    logger.error('handleGuitarCommand', error);
    await sendMessage(chatId, '❌ Ошибка запуска анализа гитары');
  }
}

export function hasGuitarSession(userId: number): boolean {
  return !!GUITAR_SESSIONS[`${userId}`];
}

export function clearGuitarSession(userId: number): void {
  delete GUITAR_SESSIONS[`${userId}`];
}

export async function handleGuitarAudio(
  chatId: number,
  userId: number,
  fileId: string,
  fileType: 'audio' | 'voice' | 'document'
): Promise<void> {
  const startTime = Date.now();
  const session = GUITAR_SESSIONS[`${userId}`];
  
  try {
    // Clear session
    clearGuitarSession(userId);

    await sendMessage(chatId, '🎸 Загружаю аудио и начинаю анализ\\.\\.\\.');

    // Download file from Telegram
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!botToken || !supabaseUrl || !supabaseKey) {
      throw new Error('Missing configuration');
    }

    // Get file path from Telegram
    const fileInfoResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`
    );
    const fileInfo = await fileInfoResponse.json();

    if (!fileInfo.ok || !fileInfo.result.file_path) {
      throw new Error('Failed to get file info');
    }

    // Download file
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileInfo.result.file_path}`;
    const fileResponse = await fetch(fileUrl);
    const fileBuffer = await fileResponse.arrayBuffer();

    // Upload to Supabase Storage
    const fileName = `telegram-guitar/${userId}/${Date.now()}.ogg`;
    const { error: uploadError } = await supabase.storage
      .from('project-assets')
      .upload(fileName, fileBuffer, {
        contentType: fileType === 'voice' ? 'audio/ogg' : 'audio/mpeg',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('project-assets')
      .getPublicUrl(fileName);

    await sendMessage(chatId, '🔍 Анализирую ритм и биты\\.\\.\\.');

    // Run parallel analysis
    const [beatResult, midiResult, styleResult] = await Promise.allSettled([
      // Beat detection
      fetch(`${supabaseUrl}/functions/v1/detect-beats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ audio_url: publicUrl })
      }).then(r => r.json()),
      
      // MIDI transcription
      fetch(`${supabaseUrl}/functions/v1/transcribe-midi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ 
          audio_url: publicUrl,
          model: 'basic-pitch'
        })
      }).then(r => r.json()),

      // Style analysis with Audio Flamingo
      fetch(`${supabaseUrl}/functions/v1/analyze-audio-flamingo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ 
          audio_url: publicUrl,
          prompt: `Analyze this guitar recording and provide:
Chords: [List all chords with approximate timing]
Chord Progression: [e.g., "Am - G - F - C"]
Playing Technique: [fingerpicking/strumming/hybrid/arpeggios]
Key: [detected key]
Strumming Pattern: [if applicable]
Notable Features: [bends, slides, hammer-ons, etc.]

Be precise with chord names including extensions.`
        })
      }).then(r => r.json()),
    ]);

    await sendMessage(chatId, '🎹 Формирую результаты анализа\\.\\.\\.');

    // Parse results
    const beats = beatResult.status === 'fulfilled' ? beatResult.value : null;
    const midi = midiResult.status === 'fulfilled' ? midiResult.value : null;
    const style = styleResult.status === 'fulfilled' ? styleResult.value : null;

    // Build response message
    let message = '🎸 *Анализ гитарной партии завершён\\!*\n\n';

    // Beat info
    if (beats && !beats.error) {
      message += `🥁 *Ритм:*\n`;
      message += `• BPM: ${beats.bpm || 'N/A'}\n`;
      message += `• Размер: ${escapeMarkdown(beats.timeSignature || '4/4')}\n\n`;
    }

    // Style analysis with chords
    if (style && style.analysis) {
      const analysis = style.analysis;
      
      // Parse chords from analysis
      const chordsMatch = analysis.match(/Chords?:?\s*([^\n]+)/i);
      const progressionMatch = analysis.match(/Chord Progression:?\s*([^\n]+)/i);
      const keyMatch = analysis.match(/Key:?\s*([^\n]+)/i);
      const techniqueMatch = analysis.match(/(?:Playing )?Technique:?\s*([^\n]+)/i);

      if (keyMatch) {
        message += `🎵 *Тональность:* ${escapeMarkdown(keyMatch[1].trim())}\n\n`;
      }

      if (progressionMatch) {
        message += `🎼 *Аккорды:*\n`;
        message += `\`${escapeMarkdown(progressionMatch[1].trim())}\`\n\n`;
      } else if (chordsMatch) {
        message += `🎼 *Аккорды:*\n`;
        message += `\`${escapeMarkdown(chordsMatch[1].trim())}\`\n\n`;
      }

      if (techniqueMatch) {
        message += `✋ *Техника:* ${escapeMarkdown(techniqueMatch[1].trim())}\n\n`;
      }
    }

    // MIDI info
    if (midi && midi.midi_url) {
      message += `✅ MIDI\\-файл создан\n`;
      
      // Extract note count if available
      if (midi.notes_count) {
        message += `• Нот извлечено: ${midi.notes_count}\n`;
      }
    }

    // Add buttons
    const buttons: any[][] = [];

    if (midi && midi.midi_url) {
      buttons.push([
        { text: '📥 Скачать MIDI', url: midi.midi_url }
      ]);
    }

    buttons.push([
      { text: '🔄 Записать ещё', callback_data: 'guitar_again' },
      { text: '📱 Открыть в приложении', web_app: { url: `${BOT_CONFIG.miniAppUrl}?startapp=guitar` } }
    ]);

    // Generate TAB visualization if we have MIDI data
    if (midi && midi.notes && midi.notes.length > 0) {
      const tabText = generateGuitarTab(midi.notes, beats?.bpm || 120);
      
      if (tabText) {
        message += `\n📝 *TAB\\-транскрипция:*\n\`\`\`\n${tabText}\n\`\`\``;
      }
    }

    await sendMessage(chatId, message, { inline_keyboard: buttons });

    trackMetric({
      eventType: 'audio_sent',
      success: true,
      telegramChatId: chatId,
      responseTimeMs: Date.now() - startTime,
      metadata: { 
        type: 'guitar_analysis',
        hasMidi: !!midi?.midi_url,
        hasBeat: !!beats?.bpm,
        hasStyle: !!style?.analysis
      },
    });

  } catch (error) {
    logger.error('handleGuitarAudio', error);
    await sendMessage(chatId, '❌ Ошибка анализа\\. Попробуйте позже\\.');

    trackMetric({
      eventType: 'audio_processing_error',
      success: false,
      telegramChatId: chatId,
      errorMessage: error instanceof Error ? error.message : String(error),
      responseTimeMs: Date.now() - startTime,
      metadata: { type: 'guitar_analysis' },
    });
  }
}

/**
 * Generate simple guitar TAB from MIDI notes
 */
function generateGuitarTab(notes: any[], bpm: number): string {
  if (!notes || notes.length === 0) return '';

  // Guitar string tuning (standard): E2, A2, D3, G3, B3, E4
  const stringTuning = [40, 45, 50, 55, 59, 64]; // MIDI note numbers
  const stringNames = ['e', 'B', 'G', 'D', 'A', 'E'];

  // Initialize TAB lines
  const tabLines: string[][] = stringNames.map(() => []);
  
  // Sort notes by time
  const sortedNotes = [...notes].sort((a, b) => a.time - b.time);
  
  // Take first 16 notes for preview
  const previewNotes = sortedNotes.slice(0, 16);
  
  // Group notes by approximate time (for chords)
  const timeGroups: Map<number, any[]> = new Map();
  const timeResolution = 0.1; // 100ms groups
  
  for (const note of previewNotes) {
    const timeKey = Math.round(note.time / timeResolution);
    if (!timeGroups.has(timeKey)) {
      timeGroups.set(timeKey, []);
    }
    timeGroups.get(timeKey)!.push(note);
  }
  
  // Convert each time group to TAB
  const sortedTimeKeys = Array.from(timeGroups.keys()).sort((a, b) => a - b);
  
  for (const timeKey of sortedTimeKeys) {
    const notesAtTime = timeGroups.get(timeKey)!;
    const frets: (number | null)[] = [null, null, null, null, null, null];
    
    for (const note of notesAtTime) {
      const midi = note.pitch || note.midi || 0;
      
      // Find best string for this note
      let bestString = -1;
      let bestFret = -1;
      
      for (let s = 0; s < 6; s++) {
        const fret = midi - stringTuning[s];
        if (fret >= 0 && fret <= 24) {
          if (bestString === -1 || fret < bestFret) {
            bestString = s;
            bestFret = fret;
          }
        }
      }
      
      if (bestString >= 0 && frets[bestString] === null) {
        frets[bestString] = bestFret;
      }
    }
    
    // Add to TAB lines
    for (let s = 0; s < 6; s++) {
      const fret = frets[s];
      if (fret !== null) {
        tabLines[s].push(fret.toString().padStart(2, '-'));
      } else {
        tabLines[s].push('--');
      }
    }
  }
  
  // Build TAB string
  const maxLen = Math.max(...tabLines.map(l => l.length));
  let result = '';
  
  for (let s = 0; s < 6; s++) {
    result += `${stringNames[s]}|`;
    result += tabLines[s].join('-');
    // Pad if needed
    while (tabLines[s].length < maxLen) {
      result += '--';
    }
    result += '|\n';
  }
  
  return result.trim();
}

function cleanupOldGuitarSessions(): void {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes

  for (const key of Object.keys(GUITAR_SESSIONS)) {
    if (now - GUITAR_SESSIONS[key].createdAt > maxAge) {
      delete GUITAR_SESSIONS[key];
    }
  }
}

export async function handleCancelGuitar(
  chatId: number,
  userId: number,
  messageId?: number,
  callbackId?: string
): Promise<void> {
  clearGuitarSession(userId);

  if (messageId) {
    await editMessageText(chatId, messageId, '❌ Анализ гитары отменён');
  } else {
    await sendMessage(chatId, '❌ Анализ гитары отменён');
  }
}

export async function handleGuitarAgain(
  chatId: number,
  userId: number
): Promise<void> {
  await handleGuitarCommand(chatId, userId);
}
