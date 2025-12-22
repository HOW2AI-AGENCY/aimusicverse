/**
 * Tariff handlers for subscription and credit purchases
 */

import { editMessageText, answerCallbackQuery } from '../telegram-api.ts';
import { getSupabaseClient } from '../core/supabase-client.ts';
import { logger } from '../utils/index.ts';
import { logBotAction } from '../utils/bot-logger.ts';
import { escapeMarkdownV2 } from '../utils/text-processor.ts';
import { BOT_CONFIG } from '../config.ts';

// Tariff pricing in Telegram Stars
const TARIFF_PRICING = {
  pro: {
    stars: 499,
    credits: 100,
    days: 30,
    title: 'Pro подписка',
    description: '100 кредитов, приоритетная генерация, HD качество'
  },
  premium: {
    stars: 1499,
    credits: 500,
    days: 30,
    title: 'Premium подписка',
    description: '500 кредитов, максимальный приоритет, Ultra HD, мастеринг'
  }
};

export async function handleTariffCallback(
  data: string,
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string
): Promise<boolean> {
  if (!data.startsWith('tariff_')) return false;
  
  try {
    const action = data.replace('tariff_', '');
    
    if (action === 'info_free') {
      await showFreeTariffInfo(chatId, messageId);
    } else if (action === 'buy_pro') {
      await initiateTariffPurchase(chatId, userId, 'pro', queryId);
    } else if (action === 'buy_premium') {
      await initiateTariffPurchase(chatId, userId, 'premium', queryId);
    } else if (action === 'contact_enterprise') {
      await showEnterpriseContact(chatId, messageId);
    } else if (action === 'compare') {
      await showTariffComparison(chatId, messageId);
    } else {
      return false;
    }
    
    await answerCallbackQuery(queryId);
    await logBotAction(userId, chatId, 'tariff_action', { action });
    return true;
  } catch (error) {
    logger.error('Failed to handle tariff callback', error);
    await answerCallbackQuery(queryId, '❌ Ошибка');
    return true;
  }
}

async function showFreeTariffInfo(chatId: number, messageId: number): Promise<void> {
  const text = `🆓 *БЕСПЛАТНЫЙ ТАРИФ*\n\n` +
    `Идеально для знакомства с платформой\\!\n\n` +
    `✅ *Что включено:*\n` +
    `• 5 кредитов в день\n` +
    `• Базовая генерация музыки\n` +
    `• 2 трека одновременно\n` +
    `• Стандартное качество\n` +
    `• Публичный профиль\n\n` +
    `❌ *Ограничения:*\n` +
    `• Водяной знак на треках\n` +
    `• Очередь генерации\n` +
    `• Базовый анализ\n\n` +
    `_Хотите больше возможностей\\? Попробуйте Pro\\!_`;

  await editMessageText(chatId, messageId, text, {
    parse_mode: 'MarkdownV2',
    reply_markup: {
      inline_keyboard: [
        [{ text: '⭐ Попробовать Pro', callback_data: 'tariff_buy_pro' }],
        [{ text: '📊 Сравнить тарифы', callback_data: 'tariff_compare' }],
        [{ text: '◀️ Назад', callback_data: 'menu_tariffs' }],
      ],
    },
  } as Record<string, unknown>);
}

async function initiateTariffPurchase(chatId: number, userId: number, tier: 'pro' | 'premium', queryId: string): Promise<void> {
  const pricing = TARIFF_PRICING[tier];
  const supabase = getSupabaseClient();
  
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('telegram_id', userId)
    .single();
  
  if (!profile) {
    await answerCallbackQuery(queryId, '❌ Профиль не найден');
    return;
  }
  
  // Create pending transaction
  const productCode = tier === 'pro' ? 'subscription_pro_monthly' : 'subscription_premium_monthly';
  
  const { data: transaction, error } = await supabase
    .from('stars_transactions')
    .insert({
      user_id: profile.user_id,
      telegram_user_id: userId,
      product_code: productCode,
      stars_amount: pricing.stars,
      status: 'pending'
    })
    .select()
    .single();
  
  if (error) {
    logger.error('Failed to create transaction', error);
    await answerCallbackQuery(queryId, '❌ Ошибка создания платежа');
    return;
  }
  
  // Redirect to webapp for payment
  const paymentUrl = `${BOT_CONFIG.miniAppUrl}/shop?product=${productCode}&tx=${transaction.id}`;
  
  await editMessageText(chatId, 0, 
    `⭐ *ОПЛАТА ${tier.toUpperCase()}*\n\n` +
    `💰 Стоимость: ${pricing.stars} Stars\n\n` +
    `Нажмите кнопку ниже для оплаты:`,
    {
      inline_keyboard: [
        [{ text: `⭐ Оплатить ${pricing.stars} Stars`, url: paymentUrl }],
        [{ text: '◀️ Назад', callback_data: 'menu_tariffs' }]
      ]
    }
  );
  
  logger.info('Payment initiated', { userId, tier, transactionId: transaction.id });
}

async function showEnterpriseContact(chatId: number, messageId: number): Promise<void> {
  const text = `👑 *ENTERPRISE ТАРИФ*\n\n` +
    `Индивидуальные решения для бизнеса\\!\n\n` +
    `✅ *Включает:*\n` +
    `• Безлимитные кредиты\n` +
    `• Полный API доступ\n` +
    `• White\\-label решение\n` +
    `• Выделенные ресурсы\n` +
    `• SLA гарантии 99\\.9%\n` +
    `• Персональная поддержка 24/7\n` +
    `• Кастомные AI модели\n` +
    `• Интеграция с вашими системами\n\n` +
    `📧 *Свяжитесь с нами:*\n` +
    `enterprise@musicverse\\.ai\n\n` +
    `_Мы подберём оптимальное решение для вашего бизнеса\\!_`;

  await editMessageText(chatId, messageId, text, {
    parse_mode: 'MarkdownV2',
    reply_markup: {
      inline_keyboard: [
        [{ text: '📧 Написать нам', url: 'https://t.me/MusicVerseSupport' }],
        [{ text: '📊 Сравнить тарифы', callback_data: 'tariff_compare' }],
        [{ text: '◀️ Назад', callback_data: 'menu_tariffs' }],
      ],
    },
  } as Record<string, unknown>);
}

async function showTariffComparison(chatId: number, messageId: number): Promise<void> {
  const text = `📊 *СРАВНЕНИЕ ТАРИФОВ*\n\n` +
    `                    Free   Pro    Premium\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Кредиты/мес     5/день  100    500\n` +
    `Треки              2       5      10\n` +
    `Качество       SD      HD     Ultra\n` +
    `Приоритет      —       ⭐      ⭐⭐\n` +
    `Анализ         Base    Full   Full\\+\n` +
    `Стемы          —       ✅      ✅\n` +
    `Мастеринг      —       —       ✅\n` +
    `API            —       —       ✅\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Цена           0⭐     499⭐   1499⭐`;

  await editMessageText(chatId, messageId, text, {
    parse_mode: 'MarkdownV2',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '⭐ Pro 499⭐', callback_data: 'tariff_buy_pro' },
          { text: '💎 Premium 1499⭐', callback_data: 'tariff_buy_premium' }
        ],
        [{ text: '👑 Enterprise', callback_data: 'tariff_contact_enterprise' }],
        [{ text: '◀️ Назад', callback_data: 'menu_tariffs' }],
      ],
    },
  } as Record<string, unknown>);
}
