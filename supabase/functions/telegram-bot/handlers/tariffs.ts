/**
 * Tariff handlers for subscription and credit purchases
 * Loads pricing from subscription_tiers table
 */

import { editMessageText, editMessageMedia, answerCallbackQuery, sendMessage, sendPhoto } from '../telegram-api.ts';
import { getSupabaseClient } from '../core/supabase-client.ts';
import { logger } from '../utils/index.ts';
import { logBotAction } from '../utils/bot-logger.ts';
import { escapeMarkdownV2 } from '../utils/text-processor.ts';
import { BOT_CONFIG, SUPPORT_URL } from '../config.ts';
import { 
  sendAutoDeleteMessage, 
  sendSuccessNotification, 
  sendErrorNotification,
  AUTO_DELETE_TIMINGS 
} from '../utils/auto-delete.ts';
import { createProgressMessage } from '../utils/progress-bar.ts';

interface SubscriptionTier {
  id: string;
  code: string;
  name: Record<string, string>;
  description: Record<string, string>;
  detailed_description: Record<string, string>;
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
  cover_url: string | null;
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

/**
 * Get quality badge
 */
function getQualityBadge(quality: string): string {
  switch (quality) {
    case 'ultra': return '🎧 Ultra HD';
    case 'hd': return '🎵 HD';
    default: return '🎼 Стандарт';
  }
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
    await sendErrorNotification(chatId, 'Произошла ошибка. Попробуйте позже.');
    return true;
  }
}

/**
 * Show tariffs menu with all available tiers - beautifully formatted
 */
async function showTariffsMenu(chatId: number, messageId: number): Promise<void> {
  const tiers = await loadTiers();
  
  let text = `💎 *ТАРИФНЫЕ ПЛАНЫ*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `🎯 Выберите подходящий тариф для ваших задач:\n\n`;
  
  for (const tier of tiers) {
    const name = tier.name.ru || tier.name.en || tier.code.toUpperCase();
    const period = formatPeriod(tier.credits_period);
    
    if (tier.code === 'free') {
      text += `${tier.icon_emoji} *${name}*\n`;
      text += `   └ ${tier.credits_amount} кредитов/${period} • Бесплатно\n\n`;
    } else if (tier.custom_pricing) {
      text += `${tier.icon_emoji} *${name}*\n`;
      text += `   └ Безлимит • от $${tier.min_purchase_amount}/мес\n\n`;
    } else {
      const badge = tier.badge_text ? ` 🏷️` : '';
      text += `${tier.icon_emoji} *${name}*${badge}\n`;
      text += `   └ ${tier.credits_amount} кред/${period} • $${tier.price_usd} (${tier.price_stars}⭐)\n\n`;
    }
  }
  
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📌 _Нажмите на тариф для подробностей_`;
  
  // Build keyboard with prices in $ and ⭐ (no duplicate emoji)
  const keyboard = tiers.map(tier => {
    const name = tier.name.ru || tier.code;
    let buttonText: string;
    
    if (tier.code === 'free') {
      buttonText = `${tier.icon_emoji} ${name} — Бесплатно`;
    } else if (tier.custom_pricing) {
      buttonText = `${tier.icon_emoji} ${name} — от $${tier.min_purchase_amount}/мес`;
    } else {
      buttonText = `${tier.icon_emoji} ${name} — $${tier.price_usd} / ${tier.price_stars}⭐`;
    }
    
    return [{
      text: buttonText,
      callback_data: tier.code === 'enterprise' ? 'tariff_contact_enterprise' : `tariff_info_${tier.code}`
    }];
  });
  
  keyboard.push([{ text: '◀️ Главное меню', callback_data: 'menu_main' }]);
  
  await editMessageText(chatId, messageId, escapeMarkdownV2(text), {
    inline_keyboard: keyboard,
  });
}

/**
 * Show detailed tier information with cover image and rich formatting
 */
async function showTierInfo(chatId: number, messageId: number, tierCode: string): Promise<void> {
  const tier = await getTier(tierCode);
  const allTiers = await loadTiers();
  
  if (!tier) {
    logger.error('Tier not found', { tierCode });
    await sendErrorNotification(chatId, 'Тариф не найден');
    return;
  }
  
  const name = tier.name.ru || tier.name.en || tier.code;
  const period = formatPeriod(tier.credits_period);
  
  // Use detailed description if available, otherwise build from features
  let text = `${tier.icon_emoji} *${name.toUpperCase()}*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  // Use detailed_description from database if available
  const detailedDesc = tier.detailed_description?.ru || tier.detailed_description?.en;
  
  if (detailedDesc) {
    text += `${detailedDesc}\n\n`;
  } else {
    // Fallback to generated description
    // Pricing section
    if (tier.price_robokassa > 0) {
      text += `💰 *СТОИМОСТЬ*\n`;
      text += `└ RUB: *${tier.price_robokassa}₽*/месяц\n`;
      text += `\n`;
    } else {
      text += `💰 *БЕСПЛАТНО!* 🎉\n\n`;
    }
    
    // Credits section
    text += `📦 *КРЕДИТЫ*\n`;
    text += `├ Количество: *${tier.credits_amount}*/${period}\n`;
    text += `└ Одновременно: *${tier.max_concurrent_generations}* треков\n\n`;
    
    // Features section
    text += `✨ *ВОЗМОЖНОСТИ*\n`;
    text += `├ ${getQualityBadge(tier.audio_quality)}\n`;
    
    const features: string[] = [];
    if (tier.has_priority) features.push('⚡ Приоритет');
    if (tier.has_stem_separation) features.push('🎛️ Стемы');
    if (tier.has_mastering) features.push('🎚️ Мастеринг');
    if (tier.has_midi_export) features.push('🎹 MIDI');
    if (tier.has_api_access) features.push('🔌 API');
    if (tier.has_dedicated_support) features.push('👨‍💻 Поддержка 24/7');
    
    if (features.length > 0) {
      features.forEach((f, i) => {
        text += `${i === features.length - 1 ? '└' : '├'} ${f}\n`;
      });
    } else {
      text += `└ Базовый набор функций\n`;
    }
  }
  
  // Pricing summary (RUB only)
  if (tier.price_robokassa > 0 && !tier.custom_pricing) {
    text += `\n💳 *Цена:* ${tier.price_robokassa}₽`;
  }
  
  // Badge
  if (tier.badge_text) {
    text += `\n🏷️ _${tier.badge_text}_`;
  }
  
  text += `\n\n━━━━━━━━━━━━━━━━━━━━━`;
  
  // Build keyboard with navigation
  const keyboard: Array<Array<{ text: string; callback_data?: string; url?: string; web_app?: { url: string } }>> = [];
  
  // Purchase button (Tinkoff/RUB only)
  if (tier.price_robokassa > 0 && !tier.custom_pricing) {
    keyboard.push([{ 
      text: `💳 Оформить за ${tier.price_robokassa}₽`, 
      callback_data: `tariff_buy_${tier.code}` 
    }]);
  }
  
  // Navigation between tiers
  const currentIndex = allTiers.findIndex(t => t.code === tierCode);
  const navRow: Array<{ text: string; callback_data: string }> = [];
  
  if (currentIndex > 0) {
    const prevTier = allTiers[currentIndex - 1];
    navRow.push({ 
      text: `⬅️ ${prevTier.icon_emoji} ${prevTier.name.ru || prevTier.code}`, 
      callback_data: prevTier.code === 'enterprise' ? 'tariff_contact_enterprise' : `tariff_info_${prevTier.code}` 
    });
  }
  
  if (currentIndex < allTiers.length - 1) {
    const nextTier = allTiers[currentIndex + 1];
    navRow.push({ 
      text: `${nextTier.icon_emoji} ${nextTier.name.ru || nextTier.code} ➡️`, 
      callback_data: nextTier.code === 'enterprise' ? 'tariff_contact_enterprise' : `tariff_info_${nextTier.code}` 
    });
  }
  
  if (navRow.length > 0) {
    keyboard.push(navRow);
  }
  
  keyboard.push([{ text: '◀️ Все тарифы', callback_data: 'tariff_menu' }]);
  
  // Try to send with cover image if available
  if (tier.cover_url) {
    try {
      await editMessageMedia(chatId, messageId, {
        type: 'photo',
        media: tier.cover_url,
        caption: escapeMarkdownV2(text),
        parse_mode: 'MarkdownV2',
      }, {
        inline_keyboard: keyboard,
      });
      return;
    } catch (error) {
      logger.warn('Failed to edit with media, falling back to text', { error });
    }
  }
  
  // Fallback to text only
  await editMessageText(chatId, messageId, escapeMarkdownV2(text), {
    inline_keyboard: keyboard,
  });
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
  
  // Show loading notification
  const loadingMsgId = await sendAutoDeleteMessage(
    chatId,
    createProgressMessage('Подготовка платежа', 50, 'Создаём счёт...', {
      icon: '💳',
      showBar: true,
      barStyle: 'modern',
    }),
    AUTO_DELETE_TIMINGS.MEDIUM
  );
  
  const supabase = getSupabaseClient();
  
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('telegram_id', userId)
    .single();
  
  if (!profile) {
    await sendErrorNotification(chatId, 'Профиль не найден. Начните с /start');
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
    await sendErrorNotification(chatId, 'Не удалось создать платёж. Попробуйте позже.');
    return;
  }
  
  const name = tier.name.ru || tier.name.en || tier.code;
  
  // Success notification
  await sendSuccessNotification(chatId, 'Счёт создан! Выберите способ оплаты', AUTO_DELETE_TIMINGS.SHORT);
  
  // Payment options message
  const paymentUrl = `${BOT_CONFIG.miniAppUrl}/shop?product=${productCode}&tx=${transaction.id}`;
  const robokassaUrl = `${BOT_CONFIG.miniAppUrl}/shop?product=${productCode}&method=robokassa&tx=${transaction.id}`;
  
  let text = `${tier.icon_emoji} *ОФОРМЛЕНИЕ ${name.toUpperCase()}*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `📦 *Что вы получите:*\n`;
  text += `├ ${tier.credits_amount} кредитов/${formatPeriod(tier.credits_period)}\n`;
  text += `├ ${tier.max_concurrent_generations} треков одновременно\n`;
  text += `└ ${getQualityBadge(tier.audio_quality)}\n\n`;
  text += `💳 *Выберите способ оплаты:*\n\n`;
  text += `💳 Tinkoff — карты, СБП, Tinkoff Pay\n\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `💰 Итого: *${tier.price_robokassa}₽*`;
  
  // Build Tinkoff payment URL
  const tinkoffUrl = `${BOT_CONFIG.miniAppUrl}/shop?product=${productCode}&method=tinkoff&tx=${transaction.id}`;
  
  await editMessageText(chatId, 0, escapeMarkdownV2(text), {
    inline_keyboard: [
      [{ text: `💳 Оплатить ${tier.price_robokassa}₽`, url: tinkoffUrl }],
      [{ text: '◀️ Отмена', callback_data: 'tariff_menu' }]
    ]
  });
  
  logger.info('Payment initiated', { userId, tierCode, transactionId: transaction.id });
}

async function showEnterpriseContact(chatId: number, messageId: number): Promise<void> {
  const tier = await getTier('enterprise');
  
  let text = `🏆 *ENTERPRISE ТАРИФ*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `🎯 *Индивидуальные решения для бизнеса*\n\n`;
  
  text += `✨ *ВСЁ ВКЛЮЧЕНО:*\n`;
  text += `├ ♾️ Безлимитные кредиты\n`;
  text += `├ 🔌 Полный API доступ\n`;
  text += `├ 🏷️ White-label решение\n`;
  text += `├ 🖥️ Выделенные ресурсы\n`;
  text += `├ 📋 SLA гарантии 99.9%\n`;
  text += `├ 👨‍💻 Поддержка 24/7\n`;
  text += `└ 🤖 Кастомные AI модели\n\n`;
  
  text += `💰 *СТОИМОСТЬ*\n`;
  text += `├ От *$${tier?.min_purchase_amount || 50}*/месяц\n`;
  text += `└ Цена за кредит — _договорная_\n\n`;
  
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📧 _Свяжитесь с нами для обсуждения!_`;

  const keyboard = [
    [{ text: '📧 Написать менеджеру', url: SUPPORT_URL }],
    [{ text: '📞 Заказать звонок', callback_data: 'enterprise_callback' }],
    [{ text: '◀️ Все тарифы', callback_data: 'tariff_menu' }],
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
