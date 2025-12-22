/**
 * Feedback handlers for the ОБРАТНАЯ СВЯЗЬ menu section
 */

import { editMessageText, answerCallbackQuery, sendMessage } from '../telegram-api.ts';
import { getSupabaseClient } from '../core/supabase-client.ts';
import { sendAutoDeleteMessage, AUTO_DELETE_TIMINGS } from '../utils/auto-delete.ts';
import { logger } from '../utils/index.ts';
import { logBotAction } from '../utils/bot-logger.ts';

// Helper to get user by telegram ID
async function getUserByTelegramId(telegramId: number): Promise<{ id: string; user_id: string } | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, user_id')
    .eq('telegram_id', telegramId)
    .single();
  
  if (error) return null;
  return data;
}

// Session state for feedback inputs
const feedbackSessions = new Map<number, { type: string; chatId: number; messageId: number }>();

async function setWaitingForInput(telegramUserId: number, type: string | null, data?: { chatId: number; messageId: number; type?: string }): Promise<void> {
  if (type === null) {
    feedbackSessions.delete(telegramUserId);
  } else if (data) {
    feedbackSessions.set(telegramUserId, { type, chatId: data.chatId, messageId: data.messageId });
  }
}

export async function handleFeedbackCallback(
  data: string,
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string
): Promise<boolean> {
  if (!data.startsWith('feedback_')) return false;
  
  try {
    const action = data.replace('feedback_', '');
    
    if (action === 'support_prompt') {
      await promptFeedback(chatId, userId, messageId, 'support', '🛠 *ТЕХПОДДЕРЖКА*\n\nОпишите проблему или вопрос\\.');
    } else if (action === 'bug_prompt') {
      await promptFeedback(chatId, userId, messageId, 'bug', '🐛 *СООБЩИТЬ ОБ ОШИБКЕ*\n\nОпишите ошибку подробно\\.');
    } else if (action === 'idea_prompt') {
      await promptFeedback(chatId, userId, messageId, 'idea', '💡 *ПРЕДЛОЖИТЬ ИДЕЮ*\n\nРасскажите вашу идею\\.');
    } else if (action === 'rate_prompt') {
      await showRatingOptions(chatId, messageId);
    } else if (action.startsWith('rate_')) {
      const rating = parseInt(action.replace('rate_', ''), 10);
      await handleRating(chatId, userId, messageId, rating);
    } else if (action === 'cancel') {
      await cancelFeedback(chatId, userId, queryId);
    } else {
      return false;
    }
    
    await answerCallbackQuery(queryId);
    await logBotAction(userId, chatId, 'feedback_action', { action });
    return true;
  } catch (error) {
    logger.error('Failed to handle feedback callback', error);
    await answerCallbackQuery(queryId, '❌ Ошибка');
    return true;
  }
}

async function promptFeedback(chatId: number, telegramUserId: number, messageId: number, type: string, text: string): Promise<void> {
  await setWaitingForInput(telegramUserId, `feedback_${type}`, { chatId, messageId, type });
  
  await editMessageText(chatId, messageId, text + '\n\n_Напишите ваше сообщение\\.\\.\\._', {
    parse_mode: 'MarkdownV2',
    reply_markup: { inline_keyboard: [[{ text: '❌ Отмена', callback_data: 'feedback_cancel' }]] },
  } as Record<string, unknown>);
}

async function showRatingOptions(chatId: number, messageId: number): Promise<void> {
  const text = `⭐ *ОЦЕНИТЬ БОТА*\n\nКак вам MusicVerse AI?`;

  await editMessageText(chatId, messageId, text, {
    parse_mode: 'MarkdownV2',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '1️⃣', callback_data: 'feedback_rate_1' },
          { text: '2️⃣', callback_data: 'feedback_rate_2' },
          { text: '3️⃣', callback_data: 'feedback_rate_3' },
          { text: '4️⃣', callback_data: 'feedback_rate_4' },
          { text: '5️⃣', callback_data: 'feedback_rate_5' },
        ],
        [{ text: '◀️ Назад', callback_data: 'menu_feedback' }],
      ],
    },
  } as Record<string, unknown>);
}

async function handleRating(chatId: number, telegramUserId: number, messageId: number, rating: number): Promise<void> {
  const supabase = getSupabaseClient();
  const user = await getUserByTelegramId(telegramUserId);
  
  if (user) {
    await supabase.from('user_analytics_events').insert({
      user_id: user.id,
      event_type: 'feedback',
      event_name: 'bot_rating',
      metadata: { rating, telegram_user_id: telegramUserId },
    });
  }
  
  const ratingEmojis = ['', '😞', '😕', '😐', '🙂', '😍'];
  const text = `${ratingEmojis[rating]} *Спасибо за оценку ${rating}/5\\!*`;

  await editMessageText(chatId, messageId, text, {
    parse_mode: 'MarkdownV2',
    reply_markup: { inline_keyboard: [[{ text: '◀️ Назад', callback_data: 'menu_feedback' }]] },
  } as Record<string, unknown>);
}

async function cancelFeedback(chatId: number, telegramUserId: number, queryId: string): Promise<void> {
  await setWaitingForInput(telegramUserId, null);
  await sendAutoDeleteMessage(chatId, '❌ Отменено', AUTO_DELETE_TIMINGS.SHORT);
  await answerCallbackQuery(queryId, 'Отменено');
}

export async function processFeedbackMessage(chatId: number, telegramUserId: number, messageText: string, feedbackType: string): Promise<void> {
  const supabase = getSupabaseClient();
  const user = await getUserByTelegramId(telegramUserId);
  
  if (user) {
    await supabase.from('user_analytics_events').insert({
      user_id: user.id,
      event_type: 'feedback',
      event_name: feedbackType,
      metadata: { message: messageText, telegram_user_id: telegramUserId },
    });
  }
  
  await setWaitingForInput(telegramUserId, null);
  
  await sendMessage(chatId, '✅ *Сообщение отправлено\\!*\n\nСпасибо за обратную связь\\!', {
    parse_mode: 'MarkdownV2',
    reply_markup: { inline_keyboard: [[{ text: '◀️ Главное меню', callback_data: 'main_menu' }]] },
  } as Record<string, unknown>);
  
  logger.info('Feedback received', { telegramUserId, type: feedbackType });
}
