/**
 * Guitar analysis command for Telegram bot
 * Handles voice/audio recording and analyzes guitar playing
 */

import { sendMessage, editMessageText, sendDocument } from '../telegram-api.ts';
import { BOT_CONFIG } from '../config.ts';
import { logger, escapeMarkdown, trackMetric } from '../utils/index.ts';
import { getSupabaseClient } from '../core/supabase-client.ts';

const supabase = getSupabaseClient();

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

    await sendMessage(chatId, '🔍 Анализирую ритм, ноты и аккорды\\.\\.\\.');

    // Run parallel analysis with Klangio
    const [beatResult, midiResult, styleResult, klangioChords, klangioTranscription] = await Promise.allSettled([
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
Strumming Pattern: [D D U D U pattern if applicable]
Notable Features: [bends, slides, hammer-ons, etc.]

Be precise with chord names including extensions.`
        })
      }).then(r => r.json()),

      // Klangio chord recognition with strumming detection
      fetch(`${supabaseUrl}/functions/v1/klangio-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ 
          audio_url: publicUrl,
          mode: 'chord-recognition-extended',
          vocabulary: 'full',
          user_id: session?.supabaseUserId
        })
      }).then(r => r.json()).catch(() => null),

      // Klangio transcription for Guitar Pro export
      fetch(`${supabaseUrl}/functions/v1/klangio-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ 
          audio_url: publicUrl,
          mode: 'transcription',
          model: 'guitar',
          outputs: ['midi', 'gp5'],
          user_id: session?.supabaseUserId
        })
      }).then(r => r.json()).catch(() => null),
    ]);

    await sendMessage(chatId, '🎹 Формирую результаты анализа\\.\\.\\.');

    // Parse results
    const beats = beatResult.status === 'fulfilled' ? beatResult.value : null;
    const midi = midiResult.status === 'fulfilled' ? midiResult.value : null;
    const style = styleResult.status === 'fulfilled' ? styleResult.value : null;
    const klangioC = klangioChords.status === 'fulfilled' ? klangioChords.value : null;
    const klangioT = klangioTranscription.status === 'fulfilled' ? klangioTranscription.value : null;

    // Build response message
    let message = '🎸 *Анализ гитарной партии завершён\\!*\n\n';

    // Beat info
    if (beats && !beats.error) {
      message += `🥁 *Ритм:*\n`;
      message += `• BPM: ${beats.bpm || 'N/A'}\n`;
      message += `• Размер: ${escapeMarkdown(beats.timeSignature || '4/4')}\n\n`;
    }

    // Key from Klangio or style analysis
    let detectedKey = '';
    if (klangioC?.key) {
      detectedKey = klangioC.key;
    } else if (style?.analysis) {
      const keyMatch = style.analysis.match(/Key:?\s*([^\n]+)/i);
      if (keyMatch) detectedKey = keyMatch[1].trim();
    }
    
    if (detectedKey) {
      message += `🎵 *Тональность:* ${escapeMarkdown(detectedKey)}\n\n`;
    }

    // Chords from Klangio or style analysis
    let chordsText = '';
    if (klangioC?.chords && klangioC.chords.length > 0) {
      chordsText = klangioC.chords.map((c: any) => c.chord || c.name).join(' - ');
    } else if (style?.analysis) {
      const progressionMatch = style.analysis.match(/Chord Progression:?\s*([^\n]+)/i);
      const chordsMatch = style.analysis.match(/Chords?:?\s*([^\n]+)/i);
      if (progressionMatch) chordsText = progressionMatch[1].trim();
      else if (chordsMatch) chordsText = chordsMatch[1].trim();
    }

    if (chordsText) {
      message += `🎼 *Аккорды:*\n\`${escapeMarkdown(chordsText)}\`\n\n`;
    }

    // Strumming pattern from Klangio
    if (klangioC?.strumming && klangioC.strumming.length > 0) {
      const strumPattern = klangioC.strumming
        .slice(0, 8)
        .map((s: any) => s.direction === 'up' || s.direction === 'U' ? '↑' : '↓')
        .join(' ');
      message += `✋ *Бой:* ${strumPattern}\n\n`;
    } else if (style?.analysis) {
      const strumMatch = style.analysis.match(/Strumming Pattern:?\s*([^\n]+)/i);
      if (strumMatch) {
        message += `✋ *Бой:* ${escapeMarkdown(strumMatch[1].trim())}\n\n`;
      }
    }

    // Technique
    if (style?.analysis) {
      const techniqueMatch = style.analysis.match(/(?:Playing )?Technique:?\s*([^\n]+)/i);
      if (techniqueMatch) {
        message += `🖐️ *Техника:* ${escapeMarkdown(techniqueMatch[1].trim())}\n\n`;
      }
    }

    // MIDI info
    const midiUrl = klangioT?.files?.midi || midi?.midi_url;
    if (midiUrl) {
      message += `✅ MIDI\\-файл создан\n`;
      if (midi?.notes_count) {
        message += `• Нот извлечено: ${midi.notes_count}\n`;
      }
    }

    // Generate TAB visualization if we have MIDI data
    if (midi && midi.notes && midi.notes.length > 0) {
      const tabText = generateGuitarTab(midi.notes, beats?.bpm || 120);
      
      if (tabText) {
        message += `\n📝 *TAB\\-транскрипция:*\n\`\`\`\n${tabText}\n\`\`\``;
      }
    }

    // Send main message first
    await sendMessage(chatId, message, { 
      inline_keyboard: [
        [
          { text: '🔄 Записать ещё', callback_data: 'guitar_again' },
          { text: '📱 Открыть в приложении', web_app: { url: `${BOT_CONFIG.miniAppUrl}?startapp=guitar` } }
        ]
      ] 
    });

    // Send files directly to chat (not just as URL buttons)
    const filesToSend: Array<{ url: string; filename: string; caption: string }> = [];
    
    if (midiUrl) {
      filesToSend.push({ 
        url: midiUrl, 
        filename: 'guitar_transcription.mid',
        caption: '🎹 MIDI\\-файл для импорта в DAW'
      });
    }
    
    if (klangioT?.files?.gp5) {
      filesToSend.push({ 
        url: klangioT.files.gp5, 
        filename: 'guitar_tabs.gp5',
        caption: '🎸 Guitar Pro файл с табулатурой'
      });
    }
    
    if (klangioT?.files?.pdf) {
      filesToSend.push({ 
        url: klangioT.files.pdf, 
        filename: 'guitar_sheet_music.pdf',
        caption: '📄 Ноты в формате PDF'
      });
    }
    
    if (klangioT?.files?.mxml) {
      filesToSend.push({ 
        url: klangioT.files.mxml, 
        filename: 'guitar_score.musicxml',
        caption: '🎼 MusicXML для нотных редакторов'
      });
    }

    // Send each file
    for (const file of filesToSend) {
      try {
        await sendDocument(chatId, file.url, {
          filename: file.filename,
          caption: file.caption,
        });
      } catch (docError) {
        logger.warn('Failed to send document', { filename: file.filename, error: docError });
        // Continue with other files even if one fails
      }
    }

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
