/**
 * Inline Generation Handler
 * Handles music generation initiated from inline mode
 */

import { getSupabaseClient } from '../core/supabase-client.ts';
import { BOT_CONFIG } from '../config.ts';
import { logger, escapeMarkdown } from '../utils/index.ts';
import { editInlineMessage } from './inline-chosen.ts';

const supabase = getSupabaseClient();

// Generation presets for quick inline generation
export const GENERATION_PRESETS = [
  { id: 'rock', name: 'Рок', emoji: '🎸', tags: 'rock, electric guitar, energetic' },
  { id: 'pop', name: 'Поп', emoji: '🎤', tags: 'pop, catchy, upbeat' },
  { id: 'jazz', name: 'Джаз', emoji: '🎷', tags: 'jazz, saxophone, smooth' },
  { id: 'electronic', name: 'Электроника', emoji: '🎹', tags: 'electronic, synth, bass' },
  { id: 'hiphop', name: 'Хип-хоп', emoji: '🎧', tags: 'hip-hop, beats, urban' },
  { id: 'classical', name: 'Классика', emoji: '🎻', tags: 'classical, orchestra, piano' },
  { id: 'chill', name: 'Чилл', emoji: '🌙', tags: 'chill, relaxing, ambient' },
  { id: 'dance', name: 'Танцевальная', emoji: '💃', tags: 'dance, edm, club' },
];

export interface InlineGenerationTask {
  id: string;
  telegramUserId: number;
  style: string;
  inlineMessageId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  trackId?: string;
  createdAt: string;
}

/**
 * Create inline generation result articles
 */
export function createGenerationResults(): Array<{
  type: 'article';
  id: string;
  title: string;
  description: string;
  input_message_content: { message_text: string; parse_mode: string };
  reply_markup?: { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> };
  thumbnail_url?: string;
}> {
  return GENERATION_PRESETS.map((preset) => ({
    type: 'article' as const,
    id: `gen_${preset.id}`,
    title: `${preset.emoji} Создать ${preset.name}`,
    description: `Быстрая генерация трека в стиле ${preset.name.toLowerCase()}`,
    input_message_content: {
      message_text: formatGenerationStartMessage(preset.name, preset.emoji),
      parse_mode: 'MarkdownV2',
    },
    reply_markup: {
      inline_keyboard: [
        [{ text: '⏳ Ожидание...', callback_data: 'noop' }],
      ],
    },
  }));
}

/**
 * Format generation start message
 */
function formatGenerationStartMessage(styleName: string, emoji: string): string {
  const escapedStyle = escapeMarkdown(styleName);
  return `${emoji} *Генерация трека*\n\n🎼 Стиль: ${escapedStyle}\n⏳ Запуск генерации\\.\\.\\.\n\n_Трек будет готов через 1\\-2 минуты_`;
}

/**
 * Start inline generation process
 */
export async function startInlineGeneration(
  telegramUserId: number,
  style: string,
  inlineMessageId: string
): Promise<void> {
  logger.info('start_inline_generation', {
    telegramUserId,
    style,
    inlineMessageId,
  });

  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', telegramUserId)
      .single();

    if (!profile) {
      await updateGenerationMessage(inlineMessageId, 'error', 'Пользователь не найден');
      return;
    }

    // Find preset
    const preset = GENERATION_PRESETS.find((p) => p.id === style);
    if (!preset) {
      await updateGenerationMessage(inlineMessageId, 'error', 'Неизвестный стиль');
      return;
    }

    // Create generation task
    const { data: task, error } = await supabase
      .from('generation_tasks')
      .insert({
        user_id: profile.user_id,
        telegram_chat_id: null, // Inline mode has no chat
        prompt: preset.tags,
        status: 'pending',
        source: 'inline',
        generation_mode: 'instrumental',
      })
      .select()
      .single();

    if (error || !task) {
      logger.error('create_inline_generation_task_error', error);
      await updateGenerationMessage(inlineMessageId, 'error', 'Ошибка создания задачи');
      return;
    }

    // Update message with progress
    await updateGenerationMessage(
      inlineMessageId,
      'processing',
      preset.name,
      preset.emoji,
      10
    );

    // Note: Actual generation would be triggered here
    // Progress updates would come via webhooks

  } catch (error) {
    logger.error('start_inline_generation_error', error);
    await updateGenerationMessage(inlineMessageId, 'error', 'Ошибка генерации');
  }
}

/**
 * Update generation progress message
 */
export async function updateGenerationMessage(
  inlineMessageId: string,
  status: 'processing' | 'completed' | 'error',
  styleName: string,
  emoji = '🎵',
  progress = 0,
  trackUrl?: string
): Promise<void> {
  let text: string;
  let replyMarkup: { inline_keyboard: Array<Array<{ text: string; callback_data?: string; url?: string }>> } | undefined;

  const escapedStyle = escapeMarkdown(styleName);

  switch (status) {
    case 'processing':
      const progressBar = createProgressBar(progress);
      text = `${emoji} *Генерация трека*\n\n🎼 Стиль: ${escapedStyle}\n${progressBar} ${progress}%\n\n_Пожалуйста, подождите\\.\\.\\._`;
      replyMarkup = {
        inline_keyboard: [[{ text: `⏳ ${progress}%`, callback_data: 'noop' }]],
      };
      break;

    case 'completed':
      text = `${emoji} *Трек создан\\!*\n\n🎼 Стиль: ${escapedStyle}\n✅ Генерация завершена`;
      replyMarkup = trackUrl
        ? {
            inline_keyboard: [
              [{ text: '🎵 Слушать', url: trackUrl }],
              [{ text: '📤 Поделиться', callback_data: 'noop' }],
            ],
          }
        : undefined;
      break;

    case 'error':
      text = `❌ *Ошибка генерации*\n\n${escapedStyle}`;
      replyMarkup = {
        inline_keyboard: [[{ text: '🔄 Попробовать снова', callback_data: 'noop' }]],
      };
      break;
  }

  await editInlineMessage(inlineMessageId, text, replyMarkup);
}

/**
 * Create text progress bar
 */
function createProgressBar(progress: number): string {
  const filled = Math.floor(progress / 10);
  const empty = 10 - filled;
  return '▓'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Get generation hints for empty query
 */
export function getGenerationHints(): Array<{
  type: 'article';
  id: string;
  title: string;
  description: string;
  input_message_content: { message_text: string };
}> {
  return [
    {
      type: 'article',
      id: 'hint_generate',
      title: '🎵 Быстрая генерация',
      description: 'Введите "gen:" для создания музыки',
      input_message_content: {
        message_text: '💡 Введите @AIMusicVerseBot gen: для генерации музыки',
      },
    },
  ];
}
