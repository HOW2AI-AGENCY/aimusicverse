import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BOT_CONFIG } from '../config.ts';
import { sendMessage, editMessageText, setUserEmojiStatus } from '../telegram-api.ts';
import { 
  createSettingsKeyboard, 
  createNotificationSettingsKeyboard,
  createEmojiStatusKeyboard 
} from '../keyboards/share-menu.ts';

const supabase = createClient(
  BOT_CONFIG.supabaseUrl,
  BOT_CONFIG.supabaseServiceKey
);

export async function handleSettings(chatId: number, messageId?: number) {
  const msg = '⚙️ *Настройки*\n\nВыберите раздел:';
  
  if (messageId) {
    await editMessageText(chatId, messageId, msg, createSettingsKeyboard());
  } else {
    await sendMessage(chatId, msg, createSettingsKeyboard());
  }
}

export async function handleNotificationSettings(chatId: number, userId: number, messageId?: number) {
  const msg = '🔔 *Настройки уведомлений*\n\nВыберите тип уведомлений:';
  
  if (messageId) {
    await editMessageText(chatId, messageId, msg, createNotificationSettingsKeyboard());
  } else {
    await sendMessage(chatId, msg, createNotificationSettingsKeyboard());
  }
}

export async function handleEmojiStatusSettings(chatId: number, userId: number, messageId?: number) {
  const msg = '🎨 *Эмодзи статус*\n\nВыберите статус для отображения в профиле Telegram:\n\n_Статус будет виден вашим контактам в течение 12 часов_';
  
  if (messageId) {
    await editMessageText(chatId, messageId, msg, createEmojiStatusKeyboard());
  } else {
    await sendMessage(chatId, msg, createEmojiStatusKeyboard());
  }
}

/**
 * Predefined custom emoji IDs for MusicVerse statuses
 * These are Telegram custom emoji IDs that work with setUserEmojiStatus
 */
const EMOJI_STATUS_MAP: Record<string, { emojiId: string; text: string; emoji: string }> = {
  // Music-related custom emojis (using popular Telegram Premium emoji IDs)
  listening: { emojiId: '5368324170671202286', text: 'Слушаю музыку', emoji: '🎵' },
  creating: { emojiId: '5368324170671202286', text: 'Создаю треки', emoji: '🎼' },
  headphones: { emojiId: '5368324170671202286', text: 'В наушниках', emoji: '🎧' },
  rockstar: { emojiId: '5368324170671202286', text: 'Рок-звезда', emoji: '🎸' },
  composer: { emojiId: '5368324170671202286', text: 'Композитор', emoji: '🎹' },
  singer: { emojiId: '5368324170671202286', text: 'Певец', emoji: '🎤' },
};

export async function handleSetEmojiStatus(chatId: number, userId: number, emojiType: string, messageId?: number) {
  const status = EMOJI_STATUS_MAP[emojiType];
  
  if (!status) {
    const msg = '❌ Неизвестный статус';
    if (messageId) {
      await editMessageText(chatId, messageId, msg, createEmojiStatusKeyboard());
    }
    return;
  }

  try {
    // Set emoji status via Telegram API using custom emoji ID
    await setUserEmojiStatus(userId, status.emojiId);
    
    const msg = `✅ *Статус установлен\\!*\n\n${status.emoji} *${status.text}*\n\n_Статус будет отображаться 12 часов_`;
    
    if (messageId) {
      await editMessageText(chatId, messageId, msg, createEmojiStatusKeyboard());
    } else {
      await sendMessage(chatId, msg, createEmojiStatusKeyboard());
    }
  } catch (error) {
    console.error('Error setting emoji status:', error);
    
    // Check if user has Telegram Premium
    const errorMessage = error instanceof Error ? error.message : String(error);
    let msg = '❌ *Не удалось установить статус*\n\n';
    
    if (errorMessage.includes('USER_NOT_PREMIUM') || errorMessage.includes('premium')) {
      msg += '_Эта функция доступна только для пользователей Telegram Premium\\._';
    } else if (errorMessage.includes('EMOJI_STATUS_ACCESS_REQUIRED')) {
      msg += '_Необходимо разрешить боту изменять ваш emoji статус\\.\n\nОткройте настройки бота → Конфиденциальность → Разрешить изменять emoji статус\\._';
    } else {
      msg += '_Убедитесь, что у вас Telegram Premium и бот имеет необходимые разрешения\\._';
    }
    
    if (messageId) {
      await editMessageText(chatId, messageId, msg, createEmojiStatusKeyboard());
    } else {
      await sendMessage(chatId, msg, createEmojiStatusKeyboard());
    }
  }
}

export async function handleRemoveEmojiStatus(chatId: number, userId: number, messageId?: number) {
  try {
    // Remove emoji status by passing null
    await setUserEmojiStatus(userId, null);
    
    const msg = '✅ *Статус удален*';
    
    if (messageId) {
      await editMessageText(chatId, messageId, msg, createEmojiStatusKeyboard());
    } else {
      await sendMessage(chatId, msg, createEmojiStatusKeyboard());
    }
  } catch (error) {
    console.error('Error removing emoji status:', error);
    const msg = '❌ Не удалось удалить статус';
    
    if (messageId) {
      await editMessageText(chatId, messageId, msg, createEmojiStatusKeyboard());
    } else {
      await sendMessage(chatId, msg, createEmojiStatusKeyboard());
    }
  }
}