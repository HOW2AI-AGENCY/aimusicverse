/**
 * Feedback command handler - allows users to send feedback to the team
 */

import { sendMessage } from '../telegram-api.ts';
import { escapeMarkdownV2 } from '../utils/text-processor.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { BOT_CONFIG } from '../config.ts';
import { logger } from '../utils/index.ts';

// Store pending feedback sessions
const pendingFeedback = new Map<number, { 
  userId: number; 
  stage: 'awaiting_type' | 'awaiting_message' | 'awaiting_rating'; 
  type?: string;
  feedbackId?: string; // Store feedback ID for rating update
}>();

/**
 * Handle /feedback command
 */
export async function handleFeedback(chatId: number, userId: number) {
  const message = escapeMarkdownV2(
    `📝 Обратная связь

Мы ценим ваше мнение! Отправьте нам:
• 🐛 Сообщение об ошибке
• 💡 Предложение функции
• 💬 Общий отзыв
• 👏 Похвалу

Выберите тип отзыва:`
  );

  const keyboard = {
    inline_keyboard: [
      [
        { text: '🐛 Ошибка', callback_data: 'feedback_type_bug' },
        { text: '💡 Функция', callback_data: 'feedback_type_feature' }
      ],
      [
        { text: '💬 Общий отзыв', callback_data: 'feedback_type_general' },
        { text: '👏 Похвала', callback_data: 'feedback_type_praise' }
      ],
      [{ text: '❌ Отмена', callback_data: 'feedback_cancel' }]
    ]
  };

  await sendMessage(chatId, message, keyboard, 'MarkdownV2');
  
  // Store session
  pendingFeedback.set(chatId, { userId, stage: 'awaiting_type' });
  
  // Auto-expire after 10 minutes
  setTimeout(() => {
    pendingFeedback.delete(chatId);
  }, 10 * 60 * 1000);
}

/**
 * Handle feedback type selection
 */
export async function handleFeedbackTypeCallback(chatId: number, userId: number, type: string, messageId: number) {
  const typeLabels: Record<string, string> = {
    bug: '🐛 Сообщение об ошибке',
    feature: '💡 Предложение функции',
    general: '💬 Общий отзыв',
    praise: '👏 Похвала'
  };

  const message = escapeMarkdownV2(
    `${typeLabels[type] || 'Отзыв'}

Пожалуйста, опишите ваш отзыв подробно. Напишите сообщение в чат.

Для отмены используйте /cancel`
  );

  await sendMessage(chatId, message, undefined, 'MarkdownV2');
  
  // Update session
  pendingFeedback.set(chatId, { userId, stage: 'awaiting_message', type });
}

/**
 * Handle feedback message from user
 */
export async function handleFeedbackMessage(chatId: number, userId: number, message: string): Promise<boolean> {
  const session = pendingFeedback.get(chatId);
  
  if (!session || session.userId !== userId) {
    return false; // Not in feedback session
  }

  if (session.stage === 'awaiting_message') {
    // Store message and ask for rating
    pendingFeedback.set(chatId, { 
      ...session, 
      stage: 'awaiting_rating',
      type: session.type || 'general'
    });

    try {
      const supabase = createClient(BOT_CONFIG.supabaseUrl, BOT_CONFIG.supabaseServiceKey);
      
      // Get user's UUID and telegram username from profiles using telegram_id
      let userUuid = '';
      let telegramUsername = '';
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id, username')
          .eq('telegram_id', userId)
          .single();
        
        if (profile) {
          userUuid = profile.user_id;
          telegramUsername = profile.username || '';
        } else {
          logger.warn('Profile not found for telegram_id', { telegram_id: userId });
          await sendMessage(
            chatId,
            escapeMarkdownV2('❌ Профиль не найден. Убедитесь, что вы используете бота через приложение.'),
            undefined,
            'MarkdownV2'
          );
          pendingFeedback.delete(chatId);
          return true;
        }
      } catch (e) {
        logger.error('Failed to fetch profile', e);
        await sendMessage(
          chatId,
          escapeMarkdownV2('❌ Произошла ошибка при получении профиля. Попробуйте позже.'),
          undefined,
          'MarkdownV2'
        );
        pendingFeedback.delete(chatId);
        return true;
      }

      // Store feedback
      const { data: feedbackData, error } = await supabase
        .from('user_feedback')
        .insert({
          user_id: userUuid,
          telegram_chat_id: chatId,
          telegram_username: telegramUsername,
          feedback_type: session.type || 'general',
          message: message,
          status: 'new',
          metadata: {
            source: 'telegram_bot',
            timestamp: new Date().toISOString()
          }
        })
        .select('id')
        .single();

      if (error) {
        logger.error('Failed to store feedback', error);
        await sendMessage(
          chatId,
          escapeMarkdownV2('❌ Произошла ошибка при сохранении отзыва. Попробуйте позже.'),
          undefined,
          'MarkdownV2'
        );
        pendingFeedback.delete(chatId);
        return true;
      }

      // Store feedback ID in session for rating update
      pendingFeedback.set(chatId, { 
        ...session, 
        stage: 'awaiting_rating',
        type: session.type || 'general',
        feedbackId: feedbackData?.id
      });

      // Thank user and offer rating
      const thankYouMessage = escapeMarkdownV2(
        `✅ Спасибо за ваш отзыв!

Ваше сообщение получено и будет рассмотрено нашей командой.

Хотите оценить ваш опыт использования MusicVerse AI?`
      );

      const keyboard = {
        inline_keyboard: [
          [
            { text: '⭐', callback_data: 'feedback_rate_1' },
            { text: '⭐⭐', callback_data: 'feedback_rate_2' },
            { text: '⭐⭐⭐', callback_data: 'feedback_rate_3' }
          ],
          [
            { text: '⭐⭐⭐⭐', callback_data: 'feedback_rate_4' },
            { text: '⭐⭐⭐⭐⭐', callback_data: 'feedback_rate_5' }
          ],
          [{ text: 'Пропустить', callback_data: 'feedback_skip_rating' }]
        ]
      };

      await sendMessage(chatId, thankYouMessage, keyboard, 'MarkdownV2');
      
      return true;
    } catch (error) {
      logger.error('Error handling feedback', error);
      await sendMessage(
        chatId,
        escapeMarkdownV2('❌ Произошла ошибка. Попробуйте позже.'),
        undefined,
        'MarkdownV2'
      );
      pendingFeedback.delete(chatId);
      return true;
    }
  }

  return false;
}

/**
 * Handle rating selection
 */
export async function handleFeedbackRating(chatId: number, userId: number, rating: number) {
  const session = pendingFeedback.get(chatId);
  
  if (!session || session.userId !== userId || session.stage !== 'awaiting_rating') {
    return;
  }

  try {
    const supabase = createClient(BOT_CONFIG.supabaseUrl, BOT_CONFIG.supabaseServiceKey);
    
    // Update feedback with rating using stored feedback ID
    if (session.feedbackId) {
      const { error } = await supabase
        .from('user_feedback')
        .update({ rating })
        .eq('id', session.feedbackId);

      if (error) {
        logger.error('Failed to update rating', error);
      }
    } else {
      logger.warn('No feedback ID in session for rating update');
    }

    const stars = '⭐'.repeat(rating);
    const message = escapeMarkdownV2(
      `${stars}

Спасибо за вашу оценку! Мы всегда стремимся улучшать MusicVerse AI.

📢 Следите за новостями и советами в нашем канале:
@AIMusicVerse

Оставляйте комментарии и делитесь мнением!`
    );

    await sendMessage(chatId, message, undefined, 'MarkdownV2');
    
  } catch (error) {
    logger.error('Error handling rating', error);
  } finally {
    pendingFeedback.delete(chatId);
  }
}

/**
 * Handle skip rating
 */
export async function handleFeedbackSkipRating(chatId: number) {
  pendingFeedback.delete(chatId);
  
  const message = escapeMarkdownV2(
    `✅ Ваш отзыв сохранён!

📢 Следите за новостями и советами в нашем канале:
@AIMusicVerse

Оставляйте комментарии и делитесь мнением!`
  );

  await sendMessage(chatId, message, undefined, 'MarkdownV2');
}

/**
 * Cancel feedback session
 */
export async function handleFeedbackCancel(chatId: number) {
  pendingFeedback.delete(chatId);
  
  const message = escapeMarkdownV2('✅ Отменено. Возвращайтесь, если захотите оставить отзыв!');
  await sendMessage(chatId, message, undefined, 'MarkdownV2');
}

/**
 * Check if user is in feedback session
 */
export function isInFeedbackSession(chatId: number): boolean {
  return pendingFeedback.has(chatId);
}

/**
 * Get feedback session
 */
export function getFeedbackSession(chatId: number) {
  return pendingFeedback.get(chatId);
}
