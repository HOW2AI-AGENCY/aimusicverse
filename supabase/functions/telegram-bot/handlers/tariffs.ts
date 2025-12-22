/**
 * Tariff handlers for subscription and credit purchases
 * Loads pricing from subscription_tiers table
 */

import { editMessageText, answerCallbackQuery, sendMessage } from '../telegram-api.ts';
import { getSupabaseClient } from '../core/supabase-client.ts';
import { logger } from '../utils/index.ts';
import { logBotAction } from '../utils/bot-logger.ts';
import { escapeMarkdownV2 } from '../utils/text-processor.ts';
import { BOT_CONFIG } from '../config.ts';

interface SubscriptionTier {
  id: string;
  code: string;
  name: Record<string, string>;
  description: Record<string, string>;
  icon_emoji: string;
  price_usd: number;
  price_stars: number;
  price_robokassa: number;
  credits_amount: number;
  credits_period: string;
  max_concurrent_generations: number;
  audio_quality: string;
  has_priority: boolean;
  has_stem_separation: boolean;
  has_mastering: boolean;
  has_midi_export: boolean;
  has_api_access: boolean;
  has_dedicated_support: boolean;
  display_order: number;
  is_featured: boolean;
  is_active: boolean;
  badge_text: string | null;
  features: string[];
  custom_pricing: boolean;
  min_purchase_amount: number;
}

// Cache for tiers
let tiersCache: SubscriptionTier[] | null = null;
let tiersCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Load subscription tiers from database
 */
async function loadTiers(): Promise<SubscriptionTier[]> {
  const now = Date.now();
  
  if (tiersCache && now - tiersCacheTime < CACHE_TTL) {
    return tiersCache;
  }
  
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('subscription_tiers')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  
  if (error) {
    logger.error('Failed to load tiers', error);
    return tiersCache || [];
  }
  
  tiersCache = data as SubscriptionTier[];
  tiersCacheTime = now;
  
  return tiersCache;
}

/**
 * Get tier by code
 */
async function getTier(code: string): Promise<SubscriptionTier | undefined> {
  const tiers = await loadTiers();
  return tiers.find(t => t.code === code);
}

/**
 * Format credits period for display
 */
function formatPeriod(period: string, lang = 'ru'): string {
  const periods: Record<string, Record<string, string>> = {
    day: { ru: 'сутки', en: 'day' },
    week: { ru: 'неделю', en: 'week' },
    month: { ru: 'месяц', en: 'month' },
    year: { ru: 'год', en: 'year' },
  };
  return periods[period]?.[lang] || period;
}

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
      await showTierInfo(chatId, messageId, 'free');
    } else if (action === 'info_basic') {
      await showTierInfo(chatId, messageId, 'basic');
    } else if (action === 'info_pro') {
      await showTierInfo(chatId, messageId, 'pro');
    } else if (action === 'info_premium') {
      await showTierInfo(chatId, messageId, 'premium');
    } else if (action === 'info_enterprise') {
      await showEnterpriseContact(chatId, messageId);
    } else if (action.startsWith('buy_')) {
      const tierCode = action.replace('buy_', '');
      await initiateTariffPurchase(chatId, userId, tierCode, queryId);
    } else if (action === 'contact_enterprise') {
      await showEnterpriseContact(chatId, messageId);
    } else if (action === 'compare') {
      await showTariffComparison(chatId, messageId);
    } else if (action === 'menu' || action === 'back') {
      await showTariffsMenu(chatId, messageId);
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

/**
 * Show tariffs menu with all available tiers
 */
async function showTariffsMenu(chatId: number, messageId: number): Promise<void> {
  const tiers = await loadTiers();
  
  let text = `💎 *ТАРИФЫ*\n\nВыберите подходящий тариф:\n\n`;
  
  for (const tier of tiers) {
    const name = tier.name.ru || tier.name.en || tier.code;
    const period = formatPeriod(tier.credits_period);
    
    if (tier.code === 'free') {
      text += `${tier.icon_emoji} *${name}* — ${tier.credits_amount} кредитов/${period}\n`;
    } else if (tier.custom_pricing) {
      text += `${tier.icon_emoji} *${name}* — от $${tier.min_purchase_amount}/мес\n`;
    } else {
      text += `${tier.icon_emoji} *${name}* $${tier.price_usd} — ${tier.credits_amount} кредитов/${period}\n`;
    }
  }
  
  text += `\n_Выберите тариф для подробной информации:_`;
  
  const keyboard = tiers.map(tier => [{
    text: `${tier.icon_emoji} ${tier.name.ru || tier.code}`,
    callback_data: tier.code === 'enterprise' ? 'tariff_contact_enterprise' : `tariff_info_${tier.code}`
  }]);
  
  keyboard.push([{ text: '📊 Сравнить тарифы', callback_data: 'tariff_compare' }]);
  keyboard.push([{ text: '◀️ Назад', callback_data: 'menu_main' }]);
  
  await editMessageText(chatId, messageId, escapeMarkdownV2(text), {
    parse_mode: 'MarkdownV2',
    reply_markup: { inline_keyboard: keyboard },
  } as Record<string, unknown>);
}

/**
 * Show detailed tier information
 */
async function showTierInfo(chatId: number, messageId: number, tierCode: string): Promise<void> {
  const tier = await getTier(tierCode);
  
  if (!tier) {
    logger.error('Tier not found', { tierCode });
    return;
  }
  
  const name = tier.name.ru || tier.name.en || tier.code;
  const period = formatPeriod(tier.credits_period);
  const features = tier.features || [];
  
  let text = `${tier.icon_emoji} *${name.toUpperCase()}*\n\n`;
  
  if (tier.price_usd > 0) {
    text += `💰 *Цена:* $${tier.price_usd}/мес`;
    if (tier.price_stars > 0) {
      text += ` или ${tier.price_stars} ⭐`;
    }
    text += `\n\n`;
  } else {
    text += `💰 *Бесплатно!*\n\n`;
  }
  
  text += `✅ *Что включено:*\n`;
  text += `• ${tier.credits_amount} кредитов/${period}\n`;
  text += `• ${tier.max_concurrent_generations} треков одновременно\n`;
  text += `• ${tier.audio_quality === 'ultra' ? 'Ultra HD' : tier.audio_quality === 'hd' ? 'HD' : 'Стандартное'} качество\n`;
  
  if (tier.has_priority) text += `• Приоритетная генерация\n`;
  if (tier.has_stem_separation) text += `• Stem-сепарация\n`;
  if (tier.has_mastering) text += `• Мастеринг\n`;
  if (tier.has_midi_export) text += `• MIDI экспорт\n`;
  if (tier.has_api_access) text += `• API доступ\n`;
  if (tier.has_dedicated_support) text += `• Персональная поддержка\n`;
  
  if (tier.badge_text) {
    text += `\n🏷️ _${tier.badge_text}_`;
  }
  
  const keyboard: Array<Array<{ text: string; callback_data?: string; url?: string }>> = [];
  
  if (tier.price_usd > 0 && !tier.custom_pricing) {
    keyboard.push([{ text: `⭐ Оплатить ${tier.price_stars} Stars`, callback_data: `tariff_buy_${tier.code}` }]);
  }
  
  keyboard.push([{ text: '📊 Сравнить тарифы', callback_data: 'tariff_compare' }]);
  keyboard.push([{ text: '◀️ Назад к тарифам', callback_data: 'tariff_menu' }]);
  
  await editMessageText(chatId, messageId, escapeMarkdownV2(text), {
    parse_mode: 'MarkdownV2',
    reply_markup: { inline_keyboard: keyboard },
  } as Record<string, unknown>);
}

async function initiateTariffPurchase(chatId: number, userId: number, tierCode: string, queryId: string): Promise<void> {
  const tier = await getTier(tierCode);
  
  if (!tier) {
    await answerCallbackQuery(queryId, '❌ Тариф не найден');
    return;
  }
  
  if (tier.custom_pricing) {
    await showEnterpriseContact(chatId, 0);
    return;
  }
  
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
  const productCode = `subscription_${tierCode}_monthly`;
  
  const { data: transaction, error } = await supabase
    .from('stars_transactions')
    .insert({
      user_id: profile.user_id,
      telegram_user_id: userId,
      product_code: productCode,
      stars_amount: tier.price_stars,
      status: 'pending',
      metadata: {
        tier_code: tierCode,
        credits_amount: tier.credits_amount,
        price_usd: tier.price_usd
      }
    })
    .select()
    .single();
  
  if (error) {
    logger.error('Failed to create transaction', error);
    await answerCallbackQuery(queryId, '❌ Ошибка создания платежа');
    return;
  }
  
  const name = tier.name.ru || tier.name.en || tier.code;
  
  // Redirect to webapp for payment
  const paymentUrl = `${BOT_CONFIG.miniAppUrl}/shop?product=${productCode}&tx=${transaction.id}`;
  
  const text = `${tier.icon_emoji} *ОПЛАТА ${name.toUpperCase()}*\n\n` +
    `💰 Стоимость: ${tier.price_stars} Stars (~$${tier.price_usd})\n` +
    `📦 Кредитов: ${tier.credits_amount}/${formatPeriod(tier.credits_period)}\n\n` +
    `Выберите способ оплаты:`;
  
  await editMessageText(chatId, 0, escapeMarkdownV2(text), {
    parse_mode: 'MarkdownV2',
    reply_markup: {
      inline_keyboard: [
        [{ text: `⭐ Telegram Stars (${tier.price_stars})`, url: paymentUrl }],
        [{ text: `💳 Robokassa (${tier.price_robokassa}₽)`, url: `${BOT_CONFIG.miniAppUrl}/shop?product=${productCode}&method=robokassa` }],
        [{ text: '◀️ Назад', callback_data: 'tariff_menu' }]
      ]
    }
  } as Record<string, unknown>);
  
  logger.info('Payment initiated', { userId, tierCode, transactionId: transaction.id });
}

async function showEnterpriseContact(chatId: number, messageId: number): Promise<void> {
  const tier = await getTier('enterprise');
  
  const text = `🏆 *ENTERPRISE ТАРИФ*\n\n` +
    `Индивидуальные решения для бизнеса!\n\n` +
    `✅ *Включает:*\n` +
    `• Безлимитные кредиты\n` +
    `• Полный API доступ\n` +
    `• White-label решение\n` +
    `• Выделенные ресурсы\n` +
    `• SLA гарантии 99.9%\n` +
    `• Персональная поддержка 24/7\n` +
    `• Кастомные AI модели\n\n` +
    `💰 *Цена:* от $${tier?.min_purchase_amount || 50}/мес\n` +
    `_Цена за 1 кредит договорная_\n\n` +
    `📧 Свяжитесь с нами для обсуждения!`;

  const keyboard = [
    [{ text: '📧 Написать нам', url: 'https://t.me/MusicVerseSupport' }],
    [{ text: '📊 Сравнить тарифы', callback_data: 'tariff_compare' }],
    [{ text: '◀️ Назад', callback_data: 'tariff_menu' }],
  ];

  if (messageId > 0) {
    await editMessageText(chatId, messageId, escapeMarkdownV2(text), {
      inline_keyboard: keyboard,
    });
  } else {
    await sendMessage(chatId, escapeMarkdownV2(text), {
      inline_keyboard: keyboard,
    });
  }
}

async function showTariffComparison(chatId: number, messageId: number): Promise<void> {
  const tiers = await loadTiers();
  
  let text = `📊 *СРАВНЕНИЕ ТАРИФОВ*\n\n`;
  
  for (const tier of tiers) {
    const name = tier.name.ru || tier.code;
    const period = formatPeriod(tier.credits_period);
    
    text += `${tier.icon_emoji} *${name}*\n`;
    
    if (tier.price_usd > 0) {
      text += `   💰 $${tier.price_usd}/мес`;
      if (tier.price_stars > 0) text += ` (${tier.price_stars}⭐)`;
      text += `\n`;
    } else {
      text += `   💰 Бесплатно\n`;
    }
    
    text += `   📦 ${tier.credits_amount} кред/${period}\n`;
    text += `   🎵 ${tier.max_concurrent_generations} треков\n\n`;
  }
  
  const keyboard = tiers
    .filter(t => t.price_usd > 0 && !t.custom_pricing)
    .map(t => [{
      text: `${t.icon_emoji} ${t.name.ru || t.code} ${t.price_stars}⭐`,
      callback_data: `tariff_buy_${t.code}`
    }]);
  
  keyboard.push([{ text: '🏆 Enterprise', callback_data: 'tariff_contact_enterprise' }]);
  keyboard.push([{ text: '◀️ Назад', callback_data: 'tariff_menu' }]);

  await editMessageText(chatId, messageId, escapeMarkdownV2(text), {
    inline_keyboard: keyboard,
  });
}