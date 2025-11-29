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

export async function handleSetEmojiStatus(chatId: number, userId: number, emojiType: string, messageId?: number) {
  const emojiMap: Record<string, { emoji: string, text: string }> = {
    listening: { emoji: '🎵', text: 'Слушаю музыку' },
    creating: { emoji: '🎼', text: 'Создаю треки' },
    headphones: { emoji: '🎧', text: 'В наушниках' },
    rockstar: { emoji: '🎸', text: 'Рок-звезда' },
    composer: { emoji: '🎹', text: 'Композитор' },
    singer: { emoji: '🎤', text: 'Певец' }
  };

  const status = emojiMap[emojiType];
  
  if (!status) {
    const msg = '❌ Неизвестный статус';
    if (messageId) {
      await editMessageText(chatId, messageId, msg, createEmojiStatusKeyboard());
    }
    return;
  }

  try {
    // Set emoji status via Telegram API
    await setUserEmojiStatus(userId, status.emoji);
    
    const msg = `✅ Статус установлен!\n\n${status.emoji} *${status.text}*\n\n_Статус будет отображаться 12 часов_`;
    
    if (messageId) {
      await editMessageText(chatId, messageId, msg, createEmojiStatusKeyboard());
    } else {
      await sendMessage(chatId, msg, createEmojiStatusKeyboard());
    }
  } catch (error) {
    console.error('Error setting emoji status:', error);
    const msg = '❌ Не удалось установить статус\n\n_Убедитесь, что бот имеет необходимые разрешения_';
    
    if (messageId) {
      await editMessageText(chatId, messageId, msg, createEmojiStatusKeyboard());
    } else {
      await sendMessage(chatId, msg, createEmojiStatusKeyboard());
    }
  }
}

export async function handleRemoveEmojiStatus(chatId: number, userId: number, messageId?: number) {
  try {
    // Remove emoji status
    await setUserEmojiStatus(userId, null);
    
    const msg = '✅ Статус удален';
    
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