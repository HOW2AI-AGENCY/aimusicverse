import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendMessage } from '../telegram-api.ts';
import { logger } from '../utils/index.ts';
import { getTelegramConfig } from '../../_shared/telegram-config.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

/**
 * Handle /buy command - show pricing with card payment
 */
export async function handleBuyCommand(chatId: number) {
  logger.info('Buy command received', { chatId });

  try {
    // Get active products
    const { data: products, error } = await supabase
      .from('stars_products')
      .select('*')
      .eq('status', 'active')
      .order('sort_order', { ascending: true });

    if (error || !products || products.length === 0) {
      await sendMessage(chatId, 
        '😕 К сожалению, в данный момент нет доступных продуктов.\n\n' +
        'Пожалуйста, попробуйте позже.'
      );
      return;
    }

    // Group products by type
    const creditPackages = products.filter(p => p.product_type === 'credit_package');
    const subscriptions = products.filter(p => p.product_type === 'subscription');

    // Create keyboard
    const keyboard: any[][] = [];

    // Add credit packages
    if (creditPackages.length > 0) {
      keyboard.push([{ 
        text: '💳 Купить кредиты', 
        callback_data: 'buy_menu_credits' 
      }]);
    }

    // Add subscriptions
    if (subscriptions.length > 0) {
      keyboard.push([{ 
        text: '👑 Подписки', 
        callback_data: 'buy_menu_subscriptions' 
      }]);
    }

    // Add link to Mini App
    const telegramConfig = getTelegramConfig();
    keyboard.push([{ 
      text: '🚀 Открыть в приложении', 
      web_app: { url: `${telegramConfig.deepLinkBase}?startapp=pricing` } 
    }]);

    await sendMessage(
      chatId,
      `💎 *MusicVerse - Магазин*\n\n` +
      `💳 Оплата банковской картой (Visa, Mastercard, МИР)\n\n` +
      `Выберите категорию:`,
      { inline_keyboard: keyboard }
    );

  } catch (error) {
    logger.error('Error in buy command', error);
    await sendMessage(chatId, 
      '❌ Произошла ошибка при загрузке продуктов.\n\n' +
      'Пожалуйста, попробуйте позже.'
    );
  }
}

/**
 * Format price in rubles
 */
function formatRubles(kopecks: number): string {
  const rubles = kopecks / 100;
  return `${rubles} ₽`;
}

/**
 * Show credit packages menu
 */
export async function handleBuyCreditPackages(chatId: number, messageId?: number) {
  try {
    const { data: products, error } = await supabase
      .from('stars_products')
      .select('*')
      .eq('status', 'active')
      .eq('product_type', 'credit_package')
      .order('sort_order', { ascending: true });

    if (error || !products || products.length === 0) {
      await sendMessage(chatId, '😕 Нет доступных пакетов кредитов.');
      return;
    }

    let message = '💳 *Пакеты кредитов*\n\n';
    const keyboard: any[][] = [];

    products.forEach((product, index) => {
      const name = product.name['ru'] || product.name['en'];
      const priceRub = product.price_rub_cents;
      
      message += `${index + 1}\\. *${name}*\n`;
      if (priceRub) {
        message += `   💳 ${formatRubles(priceRub)}\n`;
      }
      message += `   💎 ${product.credits_amount} кредитов\n`;
      
      if (product.is_popular) {
        message += `   🔥 Популярный\n`;
      }
      
      message += `\n`;

      if (priceRub) {
        keyboard.push([{ 
          text: `${name} - ${formatRubles(priceRub)}`, 
          callback_data: `buy_tinkoff_${product.product_code}` 
        }]);
      }
    });

    keyboard.push([{ text: '⬅️ Назад', callback_data: 'buy_menu_main' }]);

    await sendMessage(chatId, message, { inline_keyboard: keyboard });

  } catch (error) {
    logger.error('Error showing credit packages', error);
  }
}

/**
 * Show subscriptions menu
 */
export async function handleBuySubscriptions(chatId: number, messageId?: number) {
  try {
    const { data: products, error } = await supabase
      .from('stars_products')
      .select('*')
      .eq('status', 'active')
      .eq('product_type', 'subscription')
      .order('sort_order', { ascending: true });

    if (error || !products || products.length === 0) {
      await sendMessage(chatId, '😕 Нет доступных подписок.');
      return;
    }

    let message = '👑 *Подписки MusicVerse*\n\n';
    const keyboard: any[][] = [];

    products.forEach((product, index) => {
      const name = product.name['ru'] || product.name['en'];
      const features = product.features || [];
      const priceRub = product.price_rub_cents;
      
      message += `${index + 1}\\. *${name}*\n`;
      if (priceRub) {
        message += `   💳 ${formatRubles(priceRub)}/месяц\n`;
      }
      
      if (features.length > 0) {
        message += `   ✨ Возможности:\n`;
        features.forEach((feature: string) => {
          message += `      • ${feature}\n`;
        });
      }
      
      message += `\n`;

      if (priceRub) {
        keyboard.push([{ 
          text: `${name} - ${formatRubles(priceRub)}`, 
          callback_data: `buy_tinkoff_${product.product_code}` 
        }]);
      }
    });

    keyboard.push([{ text: '⬅️ Назад', callback_data: 'buy_menu_main' }]);

    await sendMessage(chatId, message, { inline_keyboard: keyboard });

  } catch (error) {
    logger.error('Error showing subscriptions', error);
  }
}

/**
 * Initiate Tinkoff payment for a product
 */
export async function handleBuyProduct(
  chatId: number,
  userId: number,
  productCode: string
) {
  logger.info('Tinkoff product purchase initiated', { chatId, userId, productCode });

  await sendMessage(
    chatId,
    '🔄 Создаём ссылку для оплаты...\n\nПожалуйста, подождите.'
  );

  try {
    // Call tinkoff-create-bot-payment function
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const response = await fetch(`${supabaseUrl}/functions/v1/tinkoff-create-bot-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        productCode,
        telegramId: userId,
        chatId,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      logger.error('Tinkoff payment creation failed', { error: result.error });
      await sendMessage(
        chatId,
        `❌ *Ошибка создания платежа*\n\n${result.error || 'Попробуйте позже.'}`
      );
      return;
    }

    // Send payment link
    const telegramConfig = getTelegramConfig();
    await sendMessage(
      chatId,
      `💳 *Оплата банковской картой*\n\n` +
      `📦 ${result.productName}\n` +
      `💰 ${formatRubles(result.amount)}\n` +
      `💎 ${result.creditsAmount} кредитов\n\n` +
      `Нажмите кнопку ниже для перехода к оплате:`,
      {
        inline_keyboard: [
          [{ text: '💳 Оплатить картой', url: result.paymentUrl }],
          [{ 
            text: '🚀 Открыть приложение', 
            web_app: { url: `${telegramConfig.deepLinkBase}?startapp=buy_${productCode}` } 
          }],
        ],
      }
    );

    logger.info('Payment link sent', { 
      chatId, 
      transactionId: result.transactionId,
      paymentUrl: result.paymentUrl 
    });

  } catch (error) {
    logger.error('Error creating Tinkoff payment', error);
    await sendMessage(
      chatId,
      '❌ *Ошибка создания платежа*\n\nПожалуйста, попробуйте позже или используйте приложение.'
    );
  }
}

/**
 * Handle payment callback from Tinkoff (called by webhook)
 */
export async function handleTinkoffPaymentSuccess(
  chatId: number,
  transactionId: string,
  creditsAmount: number,
  productName: string
) {
  const telegramConfig = getTelegramConfig();
  
  await sendMessage(
    chatId,
    `✅ *Оплата успешна!*\n\n` +
    `📦 ${productName}\n` +
    `💎 Начислено: *${creditsAmount} кредитов*\n\n` +
    `Теперь вы можете создавать музыку!`,
    {
      inline_keyboard: [
        [{ 
          text: '🎵 Создать музыку', 
          web_app: { url: `${telegramConfig.deepLinkBase}?startapp=generate` } 
        }],
        [{ 
          text: '💳 Купить ещё кредитов', 
          callback_data: 'buy_credits' 
        }],
      ],
    }
  );
}

/**
 * Handle payment failure notification
 */
export async function handleTinkoffPaymentFailed(
  chatId: number,
  errorMessage?: string
) {
  await sendMessage(
    chatId,
    `❌ *Оплата не прошла*\n\n` +
    (errorMessage ? `Причина: ${errorMessage}\n\n` : '') +
    `Попробуйте снова или используйте другую карту.`,
    {
      inline_keyboard: [
        [{ text: '💳 Попробовать снова', callback_data: 'buy_menu_credits' }],
      ],
    }
  );
}