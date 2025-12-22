/**
 * Feedback handlers for the ОБРАТНАЯ СВЯЗЬ menu section
 * Enhanced with database storage and admin notifications
 */

import { editMessageText, answerCallbackQuery, sendMessage, deleteMessage } from '../telegram-api.ts';
import { getSupabaseClient } from '../core/supabase-client.ts';
import { sendAutoDeleteMessage, AUTO_DELETE_TIMINGS } from '../utils/auto-delete.ts';
import { logger } from '../utils/index.ts';
import { logBotAction } from '../utils/bot-logger.ts';
import { escapeMarkdownV2 } from '../utils/text-processor.ts';

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

export function getFeedbackSession(telegramUserId: number): { type: string; chatId: number; messageId: number } | undefined {
  return feedbackSessions.get(telegramUserId);
}

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
      await promptFeedback(chatId, userId, messageId, 'support', 
        '🛠 *ТЕХПОДДЕРЖКА*\n\n' +
        'Опишите вашу проблему или вопрос\\.\n\n' +
        '💡 _Постарайтесь описать подробно:_\n' +
        '• Что произошло?\n' +
        '• Какие шаги привели к проблеме?\n' +
        '• Какое устройство используете?'
      );
    } else if (action === 'bug_prompt') {
      await promptFeedback(chatId, userId, messageId, 'bug', 
        '🐛 *СООБЩИТЬ ОБ ОШИБКЕ*\n\n' +
        'Опишите найденную ошибку\\.\n\n' +
        '📝 _Что указать:_\n' +
        '• Где возникла ошибка?\n' +
        '• Как её воспроизвести?\n' +
        '• Скриншот \\(если есть\\)'
      );
    } else if (action === 'idea_prompt') {
      await promptFeedback(chatId, userId, messageId, 'idea', 
        '💡 *ПРЕДЛОЖИТЬ ИДЕЮ*\n\n' +
        'Расскажите вашу идею\\!\n\n' +
        '✨ _Мы ценим обратную связь и_\n' +
        '_рассматриваем все предложения\\._'
      );
    } else if (action === 'rate_prompt') {
      await showRatingOptions(chatId, messageId);
    } else if (action.startsWith('rate_')) {
      const rating = parseInt(action.replace('rate_', ''), 10);
      await handleRating(chatId, userId, messageId, rating);
    } else if (action === 'cancel') {
      await cancelFeedback(chatId, userId, queryId);
    } else if (action === 'my_requests') {
      await showMyRequests(chatId, userId, messageId);
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
    reply_markup: { 
      inline_keyboard: [
        [{ text: '❌ Отмена', callback_data: 'feedback_cancel' }],
        [{ text: '◀️ Назад', callback_data: 'menu_feedback' }]
      ] 
    },
  } as Record<string, unknown>);
}

async function showRatingOptions(chatId: number, messageId: number): Promise<void> {
  const text = `⭐ *ОЦЕНИТЬ БОТА*\n\n` +
    `Как вам MusicVerse AI?\n\n` +
    `_Ваша оценка помогает нам становиться лучше\\!_`;

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
  
  // Save rating to user_feedback table
  await supabase.from('user_feedback').insert({
    user_id: user?.user_id || null,
    telegram_id: telegramUserId,
    telegram_chat_id: chatId,
    type: 'rating',
    message: `Оценка бота: ${rating}/5`,
    rating: rating,
    status: 'resolved'
  });
  
  const ratingEmojis = ['', '😞', '😕', '😐', '🙂', '😍'];
  const ratingMessages = [
    '',
    'Нам жаль\\. Расскажите, что не так\\?',
    'Спасибо\\! Будем работать над улучшениями\\.',
    'Спасибо за оценку\\!',
    'Рады, что вам нравится\\!',
    'Отлично\\! Мы очень рады\\!'
  ];
  
  const text = `${ratingEmojis[rating]} *Спасибо за оценку ${rating}/5\\!*\n\n` +
    `${ratingMessages[rating]}`;

  await editMessageText(chatId, messageId, text, {
    parse_mode: 'MarkdownV2',
    reply_markup: { 
      inline_keyboard: [
        rating <= 2 ? [{ text: '✍️ Оставить отзыв', callback_data: 'feedback_idea_prompt' }] : [],
        [{ text: '◀️ Назад', callback_data: 'menu_feedback' }]
      ].filter(row => row.length > 0)
    },
  } as Record<string, unknown>);
}

async function cancelFeedback(chatId: number, telegramUserId: number, queryId: string): Promise<void> {
  await setWaitingForInput(telegramUserId, null);
  await sendAutoDeleteMessage(chatId, '❌ Отменено', AUTO_DELETE_TIMINGS.SHORT);
}

async function showMyRequests(chatId: number, telegramUserId: number, messageId: number): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { data: requests, error } = await supabase
    .from('user_feedback')
    .select('*')
    .eq('telegram_id', telegramUserId)
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (error || !requests || requests.length === 0) {
    const text = `📋 *МОИ ОБРАЩЕНИЯ*\n\n_У вас пока нет обращений\\._`;
    
    await editMessageText(chatId, messageId, text, {
      parse_mode: 'MarkdownV2',
      reply_markup: { 
        inline_keyboard: [
          [{ text: '🛠 Техподдержка', callback_data: 'feedback_support_prompt' }],
          [{ text: '◀️ Назад', callback_data: 'menu_feedback' }]
        ] 
      },
    } as Record<string, unknown>);
    return;
  }
  
  const typeLabels: Record<string, string> = {
    support: '🛠',
    bug: '🐛',
    idea: '💡',
    rating: '⭐'
  };
  
  const statusLabels: Record<string, string> = {
    pending: '⏳ Ожидает',
    in_review: '🔍 На рассмотрении',
    resolved: '✅ Решено',
    closed: '📁 Закрыто'
  };
  
  let text = `📋 *МОИ ОБРАЩЕНИЯ*\n\n`;
  
  for (const req of requests) {
    const date = new Date(req.created_at).toLocaleDateString('ru-RU');
    const typeEmoji = typeLabels[req.type] || '📝';
    const status = statusLabels[req.status] || req.status;
    const shortMsg = req.message.slice(0, 30) + (req.message.length > 30 ? '...' : '');
    
    text += `${typeEmoji} *${escapeMarkdownV2(date)}*\n`;
    text += `${escapeMarkdownV2(shortMsg)}\n`;
    text += `${status}`;
    if (req.admin_reply) {
      text += ` • 💬 Есть ответ`;
    }
    text += `\n\n`;
  }
  
  await editMessageText(chatId, messageId, text, {
    parse_mode: 'MarkdownV2',
    reply_markup: { 
      inline_keyboard: [
        [{ text: '🛠 Новое обращение', callback_data: 'feedback_support_prompt' }],
        [{ text: '◀️ Назад', callback_data: 'menu_feedback' }]
      ] 
    },
  } as Record<string, unknown>);
}

export async function processFeedbackMessage(chatId: number, telegramUserId: number, messageText: string, feedbackType: string): Promise<void> {
  const supabase = getSupabaseClient();
  const user = await getUserByTelegramId(telegramUserId);
  
  // Map feedback type to proper type
  const typeMap: Record<string, string> = {
    'feedback_support': 'support',
    'feedback_bug': 'bug',
    'feedback_idea': 'idea'
  };
  
  const type = typeMap[feedbackType] || 'support';
  
  // Save to user_feedback table
  const { error } = await supabase.from('user_feedback').insert({
    user_id: user?.user_id || null,
    telegram_id: telegramUserId,
    telegram_chat_id: chatId,
    type: type,
    message: messageText,
    status: 'pending'
  });
  
  if (error) {
    logger.error('Failed to save feedback', error);
  }
  
  await setWaitingForInput(telegramUserId, null);
  
  const typeLabels: Record<string, string> = {
    support: '🛠 Техподдержка',
    bug: '🐛 Ошибка',
    idea: '💡 Идея'
  };
  
  await sendMessage(chatId, 
    `✅ *Сообщение отправлено\\!*\n\n` +
    `📝 *Тип:* ${escapeMarkdownV2(typeLabels[type] || type)}\n\n` +
    `Мы рассмотрим ваше обращение и ответим в ближайшее время\\.\n\n` +
    `_Спасибо за обратную связь\\!_`, 
  {
    parse_mode: 'MarkdownV2',
    reply_markup: { 
      inline_keyboard: [
        [{ text: '📋 Мои обращения', callback_data: 'feedback_my_requests' }],
        [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
      ] 
    },
  } as Record<string, unknown>);
  
  logger.info('Feedback saved', { telegramUserId, type, messageLength: messageText.length });
}

// Function to send admin reply back to user
export async function sendFeedbackReply(feedbackId: string, replyText: string, adminUserId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  // Get the feedback record
  const { data: feedback, error: fetchError } = await supabase
    .from('user_feedback')
    .select('*')
    .eq('id', feedbackId)
    .single();
  
  if (fetchError || !feedback) {
    logger.error('Feedback not found', { feedbackId });
    return false;
  }
  
  // Update feedback with admin reply
  const { error: updateError } = await supabase
    .from('user_feedback')
    .update({
      admin_reply: replyText,
      replied_by: adminUserId,
      replied_at: new Date().toISOString(),
      status: 'resolved',
      updated_at: new Date().toISOString()
    })
    .eq('id', feedbackId);
  
  if (updateError) {
    logger.error('Failed to update feedback', updateError);
    return false;
  }
  
  // Send message to user if we have their chat ID
  if (feedback.telegram_chat_id) {
    try {
      await sendMessage(feedback.telegram_chat_id, 
        `💬 *ОТВЕТ НА ВАШЕ ОБРАЩЕНИЕ*\n\n` +
        `${escapeMarkdownV2(replyText)}\n\n` +
        `_Если у вас есть вопросы, создайте новое обращение\\._`,
      {
        parse_mode: 'MarkdownV2',
        reply_markup: { 
          inline_keyboard: [
            [{ text: '📋 Мои обращения', callback_data: 'feedback_my_requests' }],
            [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
          ] 
        },
      } as Record<string, unknown>);
      
      logger.info('Reply sent to user', { feedbackId, telegramChatId: feedback.telegram_chat_id });
      return true;
    } catch (error) {
      logger.error('Failed to send reply to user', error);
      return false;
    }
  }
  
  return true;
}
