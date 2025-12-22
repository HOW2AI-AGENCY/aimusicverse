/**
 * Cloud handlers for the ОБЛАКО menu section
 */

import { editMessageText, answerCallbackQuery } from '../telegram-api.ts';
import { getUserByTelegramId } from '../db-helpers.ts';
import { createSupabaseClient } from '../supabase-client.ts';
import { logger } from '../utils/index.ts';
import { logBotAction } from '../utils/bot-logger.ts';

export async function handleCloudCallback(
  data: string,
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string
): Promise<boolean> {
  if (!data.startsWith('cloud_')) return false;
  
  try {
    const user = await getUserByTelegramId(userId);
    if (!user) {
      await answerCallbackQuery(queryId, '❌ Пользователь не найден');
      return true;
    }
    
    const action = data.replace('cloud_', '');
    
    if (action === 'list_files') {
      await showCloudFiles(chatId, user.id, messageId);
    } else if (action === 'list_stems') {
      await showStemFiles(chatId, user.id, messageId);
    } else if (action === 'list_midi') {
      await showMidiFiles(chatId, user.id, messageId);
    } else if (action === 'storage_info') {
      await showStorageInfo(chatId, user.id, messageId);
    } else {
      return false;
    }
    
    await answerCallbackQuery(queryId);
    await logBotAction(userId, chatId, 'cloud_action', { action });
    return true;
  } catch (error) {
    logger.error('Failed to handle cloud callback', error);
    await answerCallbackQuery(queryId, '❌ Ошибка');
    return true;
  }
}

async function showCloudFiles(chatId: number, supabaseUserId: string, messageId: number): Promise<void> {
  const supabase = createSupabaseClient();
  const { count } = await supabase.from('reference_audio').select('id', { count: 'exact' }).eq('user_id', supabaseUserId);
  
  const text = `📂 *МОИ ФАЙЛЫ*\n\n📊 *Всего файлов:* ${count || 0}\n\n_Загрузите аудио через меню "Загрузка"_`;

  await editMessageText(chatId, messageId, text, {
    parse_mode: 'MarkdownV2',
    reply_markup: {
      inline_keyboard: [
        [{ text: '📤 Загрузить', callback_data: 'menu_upload' }],
        [{ text: '◀️ Назад', callback_data: 'menu_cloud' }],
      ],
    },
  } as Record<string, unknown>);
}

async function showStemFiles(chatId: number, _supabaseUserId: string, messageId: number): Promise<void> {
  const text = `🎛️ *СТЕМЫ*\n\n_Стемов пока нет\\._\n\n🎵 Разделите трек на стемы через меню трека`;

  await editMessageText(chatId, messageId, text, {
    parse_mode: 'MarkdownV2',
    reply_markup: { inline_keyboard: [[{ text: '◀️ Назад', callback_data: 'menu_cloud' }]] },
  } as Record<string, unknown>);
}

async function showMidiFiles(chatId: number, _supabaseUserId: string, messageId: number): Promise<void> {
  const text = `🎹 *MIDI ФАЙЛЫ*\n\n_MIDI файлов пока нет\\._\n\n🎵 Экспортируйте трек в MIDI через меню трека`;

  await editMessageText(chatId, messageId, text, {
    parse_mode: 'MarkdownV2',
    reply_markup: { inline_keyboard: [[{ text: '◀️ Назад', callback_data: 'menu_cloud' }]] },
  } as Record<string, unknown>);
}

async function showStorageInfo(chatId: number, supabaseUserId: string, messageId: number): Promise<void> {
  const supabase = createSupabaseClient();
  const { count } = await supabase.from('reference_audio').select('id', { count: 'exact' }).eq('user_id', supabaseUserId);
  
  const text = `📊 *ХРАНИЛИЩЕ*\n\n📂 *Файлов:* ${count || 0}\n💾 *Лимит:* 500 MB\n\n_Увеличьте лимит с подпиской Pro\\!_`;

  await editMessageText(chatId, messageId, text, {
    parse_mode: 'MarkdownV2',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🚀 Увеличить лимит', callback_data: 'menu_tariffs' }],
        [{ text: '◀️ Назад', callback_data: 'menu_cloud' }],
      ],
    },
  } as Record<string, unknown>);
}
