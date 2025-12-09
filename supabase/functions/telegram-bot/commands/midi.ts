import { sendMessage, editMessageText, answerCallbackQuery } from '../telegram-api.ts';
import { BOT_CONFIG } from '../config.ts';
import { logger } from '../utils/index.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// MIDI conversion sessions
const MIDI_SESSIONS: Record<string, { 
  chatId: number; 
  userId: number; 
  modelType: 'mt3' | 'basic-pitch' | 'pop2piano';
  createdAt: number;
}> = {};

export function getMidiHelp(): string {
  return `🎹 *MIDI Конвертация*

Конвертируйте треки в MIDI для редактирования в DAW.

*Модели:*
• *Basic Pitch* \\- вокал, гитара, бас, мелодия
• *MT3* \\- ударные, сложные композиции
• *Pop2Piano* \\- фортепианная аранжировка

*Использование:*
/midi \\- конвертировать трек из библиотеки
/midi <название> \\- найти и конвертировать
/piano \\- создать фортепианную версию

Или отправьте аудио файл после /midi`;
}

export async function handleMidiCommand(
  chatId: number,
  userId: number,
  args?: string
): Promise<void> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get user from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', userId)
      .single();

    if (!profile) {
      await sendMessage(chatId, '❌ Профиль не найден. Используйте /start для регистрации.');
      return;
    }

    // If track name provided, search and offer selection
    if (args && args.trim()) {
      const searchQuery = args.trim();
      const { data: tracks } = await supabase
        .from('tracks')
        .select('id, title, style, audio_url')
        .eq('user_id', profile.user_id)
        .ilike('title', `%${searchQuery}%`)
        .limit(5);

      if (!tracks || tracks.length === 0) {
        await sendMessage(chatId, `❌ Треки с названием "${escapeMarkdown(searchQuery)}" не найдены.`);
        return;
      }

      if (tracks.length === 1) {
        // Single track found - show model selection
        await showModelSelection(chatId, tracks[0].id, tracks[0].title);
        return;
      }

      // Multiple tracks - show selection
      const buttons = tracks.map(track => ([{
        text: `🎵 ${track.title?.substring(0, 30) || 'Без названия'}`,
        callback_data: `midi_track_${track.id}`
      }]));

      buttons.push([{ text: '❌ Отмена', callback_data: 'cancel_midi' }]);

      await sendMessage(chatId, `🎹 *Выберите трек для конвертации:*`, {
        inline_keyboard: buttons
      });
      return;
    }

    // No args - show recent tracks
    const { data: tracks } = await supabase
      .from('tracks')
      .select('id, title, style, audio_url')
      .eq('user_id', profile.user_id)
      .not('audio_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!tracks || tracks.length === 0) {
      await sendMessage(chatId, `❌ У вас пока нет треков.

Создайте трек командой /generate или в приложении.`);
      return;
    }

    const buttons = tracks.map(track => ([{
      text: `🎵 ${track.title?.substring(0, 30) || 'Без названия'}`,
      callback_data: `midi_track_${track.id}`
    }]));

    buttons.push([
      { text: '📤 Загрузить аудио', callback_data: 'midi_upload' },
      { text: '❌ Отмена', callback_data: 'cancel_midi' }
    ]);

    await sendMessage(chatId, `🎹 *MIDI Конвертация*

Выберите трек или загрузите аудио файл:`, {
      inline_keyboard: buttons
    });

    cleanupOldSessions();
  } catch (error) {
    logger.error('handleMidiCommand', error);
    await sendMessage(chatId, '❌ Ошибка загрузки треков');
  }
}

export async function handlePianoCommand(
  chatId: number,
  userId: number,
  args?: string
): Promise<void> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', userId)
      .single();

    if (!profile) {
      await sendMessage(chatId, '❌ Профиль не найден. Используйте /start для регистрации.');
      return;
    }

    // If track name provided, search
    if (args && args.trim()) {
      const searchQuery = args.trim();
      const { data: tracks } = await supabase
        .from('tracks')
        .select('id, title, audio_url')
        .eq('user_id', profile.user_id)
        .ilike('title', `%${searchQuery}%`)
        .limit(5);

      if (!tracks || tracks.length === 0) {
        await sendMessage(chatId, `❌ Треки с названием "${escapeMarkdown(searchQuery)}" не найдены.`);
        return;
      }

      if (tracks.length === 1 && tracks[0].audio_url) {
        // Start pop2piano conversion directly
        await startMidiConversion(chatId, userId, tracks[0].id, 'pop2piano');
        return;
      }

      const buttons = tracks.map(track => ([{
        text: `🎹 ${track.title?.substring(0, 30) || 'Без названия'}`,
        callback_data: `midi_p2p_${track.id}`
      }]));

      buttons.push([{ text: '❌ Отмена', callback_data: 'cancel_midi' }]);

      await sendMessage(chatId, `🎹 *Pop2Piano*

Выберите трек для создания фортепианной версии:`, {
        inline_keyboard: buttons
      });
      return;
    }

    // Show recent tracks for piano conversion
    const { data: tracks } = await supabase
      .from('tracks')
      .select('id, title, audio_url')
      .eq('user_id', profile.user_id)
      .not('audio_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!tracks || tracks.length === 0) {
      await sendMessage(chatId, `❌ У вас пока нет треков для конвертации.`);
      return;
    }

    const buttons = tracks.map(track => ([{
      text: `🎹 ${track.title?.substring(0, 30) || 'Без названия'}`,
      callback_data: `midi_p2p_${track.id}`
    }]));

    buttons.push([{ text: '❌ Отмена', callback_data: 'cancel_midi' }]);

    await sendMessage(chatId, `🎹 *Pop2Piano \\- Фортепианная аранжировка*

Выберите трек для создания фортепианной версии:`, {
      inline_keyboard: buttons
    });
  } catch (error) {
    logger.error('handlePianoCommand', error);
    await sendMessage(chatId, '❌ Ошибка при загрузке треков');
  }
}

async function showModelSelection(chatId: number, trackId: string, title?: string): Promise<void> {
  const trackTitle = title ? escapeMarkdown(title.substring(0, 20)) : 'трек';
  
  await sendMessage(chatId, `🎹 *Конвертация: ${trackTitle}*

Выберите модель:

🎸 *Basic Pitch* \\- для вокала, гитары, баса
🥁 *MT3* \\- для ударных и сложных композиций  
🎹 *Pop2Piano* \\- фортепианная аранжировка`, {
    inline_keyboard: [
      [
        { text: '🎸 Basic Pitch', callback_data: `midi_bp_${trackId}` },
        { text: '🥁 MT3', callback_data: `midi_mt3_${trackId}` }
      ],
      [{ text: '🎹 Pop2Piano', callback_data: `midi_p2p_${trackId}` }],
      [{ text: '❌ Отмена', callback_data: 'cancel_midi' }]
    ]
  });
}

export async function handleMidiTrackCallback(
  chatId: number,
  trackId: string,
  messageId: number,
  callbackId: string
): Promise<void> {
  await answerCallbackQuery(callbackId);
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: track } = await supabase
    .from('tracks')
    .select('title')
    .eq('id', trackId)
    .single();

  await editMessageText(chatId, messageId, `🎹 *Конвертация: ${escapeMarkdown(track?.title || 'трек')}*

Выберите модель:`, {
    inline_keyboard: [
      [
        { text: '🎸 Basic Pitch', callback_data: `midi_bp_${trackId}` },
        { text: '🥁 MT3', callback_data: `midi_mt3_${trackId}` }
      ],
      [{ text: '🎹 Pop2Piano', callback_data: `midi_p2p_${trackId}` }],
      [{ text: '❌ Отмена', callback_data: 'cancel_midi' }]
    ]
  });
}

export async function handleMidiModelCallback(
  chatId: number,
  userId: number,
  trackId: string,
  modelType: 'mt3' | 'basic-pitch' | 'pop2piano',
  messageId: number,
  callbackId: string
): Promise<void> {
  await answerCallbackQuery(callbackId, '🎹 Запуск конвертации...');
  await startMidiConversion(chatId, userId, trackId, modelType, messageId);
}

async function startMidiConversion(
  chatId: number,
  userId: number,
  trackId: string,
  modelType: 'mt3' | 'basic-pitch' | 'pop2piano',
  messageId?: number
): Promise<void> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get track
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('id, title, audio_url, user_id')
      .eq('id', trackId)
      .single();

    if (trackError || !track || !track.audio_url) {
      const msg = '❌ Трек не найден или не имеет аудио';
      if (messageId) {
        await editMessageText(chatId, messageId, msg);
      } else {
        await sendMessage(chatId, msg);
      }
      return;
    }

    const modelNames: Record<string, string> = {
      'mt3': 'MT3',
      'basic-pitch': 'Basic Pitch',
      'pop2piano': 'Pop2Piano'
    };

    const progressMsg = `🎹 *Конвертация в ${modelType === 'pop2piano' ? 'фортепиано' : 'MIDI'}*

🎵 Трек: ${escapeMarkdown(track.title || 'Без названия')}
🔧 Модель: ${modelNames[modelType]}

⏳ Обработка... Это может занять 1\\-3 минуты.`;

    if (messageId) {
      await editMessageText(chatId, messageId, progressMsg);
    } else {
      await sendMessage(chatId, progressMsg);
    }

    // Call transcribe-midi function
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const response = await fetch(`${supabaseUrl}/functions/v1/transcribe-midi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        track_id: trackId,
        audio_url: track.audio_url,
        model_type: modelType,
        auto_select: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('MIDI conversion failed', { status: response.status, error: errorText });
      throw new Error(`Conversion failed: ${errorText}`);
    }

    const result = await response.json();

    if (!result.success || !result.output_url) {
      throw new Error(result.error || 'Unknown error');
    }

    // Send success message with download button
    const outputType = modelType === 'pop2piano' ? 'фортепианная аранжировка' : 'MIDI файл';
    const successMsg = `✅ *${outputType === 'MIDI файл' ? 'MIDI готов!' : 'Фортепианная версия готова!'}*

🎵 ${escapeMarkdown(track.title || 'Трек')}
🔧 Модель: ${modelNames[modelType]}
${modelType !== 'pop2piano' ? '📁 Формат: MIDI' : '📁 Формат: MP3'}`;

    await sendMessage(chatId, successMsg, {
      inline_keyboard: [
        [
          { text: `📥 Скачать ${modelType === 'pop2piano' ? 'MP3' : 'MIDI'}`, url: result.output_url },
          { text: '📱 Открыть в студии', web_app: { url: `${BOT_CONFIG.miniAppUrl}?startapp=studio_${trackId}` } }
        ],
        [
          { text: '🔄 Конвертировать ещё', callback_data: 'midi_again' },
          { text: '🎹 Pop2Piano', callback_data: `midi_p2p_${trackId}` }
        ]
      ]
    });

  } catch (error) {
    logger.error('startMidiConversion', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    await sendMessage(chatId, `❌ Ошибка конвертации: ${escapeMarkdown(errorMsg)}

Попробуйте позже или выберите другую модель.`, {
      inline_keyboard: [[
        { text: '🔄 Попробовать снова', callback_data: `midi_track_${trackId}` }
      ]]
    });
  }
}

export async function handleMidiUploadCallback(
  chatId: number,
  userId: number,
  messageId: number,
  callbackId: string
): Promise<void> {
  await answerCallbackQuery(callbackId);

  // Set upload session
  MIDI_SESSIONS[`${userId}`] = {
    chatId,
    userId,
    modelType: 'basic-pitch',
    createdAt: Date.now()
  };

  await editMessageText(chatId, messageId, `📤 *Загрузка аудио для MIDI*

Отправьте аудио файл (MP3, WAV, M4A) для конвертации в MIDI.

После загрузки выберите модель конвертации.`, {
    inline_keyboard: [[
      { text: '❌ Отмена', callback_data: 'cancel_midi' }
    ]]
  });
}

export function hasMidiSession(userId: number): boolean {
  return !!MIDI_SESSIONS[`${userId}`];
}

export function clearMidiSession(userId: number): void {
  delete MIDI_SESSIONS[`${userId}`];
}

export async function handleCancelMidi(
  chatId: number,
  userId: number,
  messageId?: number,
  callbackId?: string
): Promise<void> {
  clearMidiSession(userId);

  if (callbackId) {
    await answerCallbackQuery(callbackId);
  }

  if (messageId) {
    await editMessageText(chatId, messageId, '❌ MIDI конвертация отменена');
  } else {
    await sendMessage(chatId, '❌ MIDI конвертация отменена');
  }
}

export async function handleMidiAgainCallback(
  chatId: number,
  userId: number,
  callbackId: string
): Promise<void> {
  await answerCallbackQuery(callbackId);
  await handleMidiCommand(chatId, userId);
}

function escapeMarkdown(text: string): string {
  if (!text) return '';
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

function cleanupOldSessions(): void {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes

  for (const key of Object.keys(MIDI_SESSIONS)) {
    if (now - MIDI_SESSIONS[key].createdAt > maxAge) {
      delete MIDI_SESSIONS[key];
    }
  }
}
