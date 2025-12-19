import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendMessage, answerPreCheckoutQuery } from '../telegram-api.ts';
import { logger } from '../utils/index.ts';
import { getTelegramConfig } from '../../_shared/telegram-config.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

interface PreCheckoutQuery {
  id: string;
  from: {
    id: number;
    first_name: string;
    username?: string;
  };
  currency: string;
  total_amount: number;
  invoice_payload: string;
}

interface SuccessfulPayment {
  currency: string;
  total_amount: number;
  invoice_payload: string;
  telegram_payment_charge_id: string;
  provider_payment_charge_id: string;
}

/**
 * Handle pre-checkout query (payment validation before payment)
 */
export async function handlePreCheckoutQuery(query: PreCheckoutQuery) {
  const { id, from, invoice_payload } = query;
  
  logger.info('Pre-checkout query received', { 
    queryId: id, 
    userId: from.id,
    payload: invoice_payload 
  });

  try {
    // Parse payload
    const payload = JSON.parse(invoice_payload);
    const { transactionId, userId, productId } = payload;

    // Validate transaction exists and is pending
    const { data: transaction, error: txError } = await supabase
      .from('stars_transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single();

    if (txError || !transaction) {
      logger.error('Transaction validation failed', { transactionId, error: txError });
      await answerPreCheckoutQuery(id, {
        ok: false,
        error_message: 'Транзакция не найдена или уже обработана',
      });
      return;
    }

    // Validate product exists and is active
    const { data: product, error: productError } = await supabase
      .from('stars_products')
      .select('*')
      .eq('id', productId)
      .eq('status', 'active')
      .single();

    if (productError || !product) {
      logger.error('Product validation failed', { productId, error: productError });
      await answerPreCheckoutQuery(id, {
        ok: false,
        error_message: 'Продукт не найден или недоступен',
      });
      return;
    }

    // Validate amount matches
    if (product.stars_price !== query.total_amount) {
      logger.error('Price mismatch', { 
        expected: product.stars_price, 
        received: query.total_amount 
      });
      await answerPreCheckoutQuery(id, {
        ok: false,
        error_message: 'Неверная сумма платежа',
      });
      return;
    }

    // Update transaction status to processing
    const { error: updateError } = await supabase
      .from('stars_transactions')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId);

    if (updateError) {
      logger.error('Failed to update transaction status', { error: updateError });
      await answerPreCheckoutQuery(id, {
        ok: false,
        error_message: 'Ошибка обработки платежа',
      });
      return;
    }

    // All validations passed
    logger.info('Pre-checkout validation passed', { transactionId });
    await answerPreCheckoutQuery(id, { ok: true });

  } catch (error) {
    logger.error('Error in pre-checkout handler', error);
    await answerPreCheckoutQuery(id, {
      ok: false,
      error_message: 'Внутренняя ошибка сервера',
    });
  }
}

/**
 * Handle successful payment
 */
export async function handleSuccessfulPayment(
  chatId: number,
  userId: number,
  payment: SuccessfulPayment
) {
  logger.info('Successful payment received', { 
    chatId, 
    userId,
    paymentId: payment.telegram_payment_charge_id,
    amount: payment.total_amount,
  });

  try {
    // Parse payload
    const payload = JSON.parse(payment.invoice_payload);
    const { transactionId, productId, productCode } = payload;

    // Check idempotency - if already processed, just send success message
    const { data: existingTx } = await supabase
      .from('stars_transactions')
      .select('status, processed_at')
      .eq('telegram_payment_charge_id', payment.telegram_payment_charge_id)
      .single();

    if (existingTx?.processed_at) {
      logger.info('Payment already processed (idempotent)', { 
        transactionId,
        paymentId: payment.telegram_payment_charge_id,
      });
      await sendSuccessMessage(chatId, existingTx, payment);
      return;
    }

    // Process payment using database function
    const { data: result, error: processError } = await supabase
      .rpc('process_stars_payment', {
        p_transaction_id: transactionId,
        p_telegram_payment_charge_id: payment.telegram_payment_charge_id,
        p_metadata: {
          provider_payment_charge_id: payment.provider_payment_charge_id,
          currency: payment.currency,
          total_amount: payment.total_amount,
        },
      });

    if (processError || !result?.success) {
      logger.error('Payment processing failed', { 
        error: processError,
        result,
      });
      await sendMessage(chatId, 
        '❌ *Ошибка обработки платежа*\n\n' +
        'Пожалуйста, свяжитесь с поддержкой.'
      );
      return;
    }

    logger.info('Payment processed successfully', { 
      transactionId,
      result,
    });

    // Get user's Supabase ID for reward processing
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', userId)
      .single();

    // Trigger reward processing (XP, achievements, referrals)
    if (profile?.user_id) {
      try {
        await supabase.functions.invoke('reward-purchase', {
          body: {
            userId: profile.user_id,
            transactionId,
            starsAmount: payment.total_amount,
            productType: result.type === 'credits' ? 'credit_package' : 'subscription',
            productCode,
          },
        });
      } catch (rewardError) {
        logger.error('Failed to process purchase rewards', rewardError);
        // Don't fail the payment, rewards can be retried
      }
    }

    // Send success message based on product type
    await sendSuccessMessage(chatId, result, payment);

    // Track metric
    logger.info('payment_completed', {
      userId,
      productCode,
      amount: payment.total_amount,
      type: result.type,
    });

  } catch (error) {
    logger.error('Error in successful payment handler', error);
    await sendMessage(chatId, 
      '❌ *Ошибка обработки платежа*\n\n' +
      'Пожалуйста, свяжитесь с поддержкой.'
    );
  }
}

/**
 * Send success message to user
 */
async function sendSuccessMessage(
  chatId: number,
  result: any,
  payment: SuccessfulPayment
) {
  const telegramConfig = getTelegramConfig();
  const deepLinkBase = telegramConfig.deepLinkBase;

  if (result.type === 'credits') {
    await sendMessage(
      chatId,
      `✅ *Спасибо за покупку!*\n\n` +
      `💰 Начислено: *${result.credits_granted} кредитов*\n` +
      `⭐️ Оплачено: ${payment.total_amount} Stars\n` +
      `📝 ID транзакции: \`${payment.telegram_payment_charge_id}\`\n\n` +
      `Теперь вы можете создавать музыку!`,
      {
        inline_keyboard: [
          [{ 
            text: '🎵 Создать музыку', 
            web_app: { url: `${deepLinkBase}?startapp=generate` } 
          }],
          [{ 
            text: '💳 Купить ещё кредитов', 
            callback_data: 'buy_credits' 
          }],
        ],
      }
    );
  } else if (result.type === 'subscription') {
    const expiresDate = new Date(result.expires_at);
    const expiresText = expiresDate.toLocaleDateString('ru-RU', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    await sendMessage(
      chatId,
      `✅ *Подписка активирована!*\n\n` +
      `👑 Уровень: *${result.subscription_tier.toUpperCase()}*\n` +
      `⭐️ Оплачено: ${payment.total_amount} Stars\n` +
      `📅 Действует до: ${expiresText}\n` +
      `📝 ID транзакции: \`${payment.telegram_payment_charge_id}\`\n\n` +
      `Наслаждайтесь премиальными возможностями!`,
      {
        inline_keyboard: [
          [{ 
            text: '🎵 Открыть студию', 
            web_app: { url: `${deepLinkBase}?startapp=studio` } 
          }],
          [{ 
            text: '⚙️ Настройки подписки', 
            callback_data: 'subscription_settings' 
          }],
        ],
      }
    );
  }
}

/**
 * Handle /buy command - show pricing
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
        text: '💰 Купить кредиты', 
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

    let message = '💰 *Пакеты кредитов*\n\n';
    const keyboard: any[][] = [];

    products.forEach((product, index) => {
      const name = product.name['ru'] || product.name['en'];
      const description = product.description['ru'] || product.description['en'];
      
      message += `${index + 1}\\. *${name}*\n`;
      message += `   ⭐️ ${product.stars_price} Stars\n`;
      message += `   💎 ${product.credits_amount} кредитов\n`;
      
      if (product.is_featured) {
        message += `   🔥 Популярный\n`;
      }
      
      message += `\n`;

      keyboard.push([{ 
        text: `${name} - ${product.stars_price} ⭐️`, 
        callback_data: `buy_product_${product.product_code}` 
      }]);
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
      
      message += `${index + 1}\\. *${name}*\n`;
      message += `   ⭐️ ${product.stars_price} Stars/месяц\n`;
      
      if (features.length > 0) {
        message += `   ✨ Возможности:\n`;
        features.forEach((feature: string) => {
          message += `      • ${feature}\n`;
        });
      }
      
      message += `\n`;

      keyboard.push([{ 
        text: `${name} - ${product.stars_price} ⭐️`, 
        callback_data: `buy_product_${product.product_code}` 
      }]);
    });

    keyboard.push([{ text: '⬅️ Назад', callback_data: 'buy_menu_main' }]);

    await sendMessage(chatId, message, { inline_keyboard: keyboard });

  } catch (error) {
    logger.error('Error showing subscriptions', error);
  }
}

/**
 * Initiate purchase for specific product
 */
export async function handleBuyProduct(
  chatId: number,
  userId: number,
  productCode: string
) {
  logger.info('Product purchase initiated', { chatId, userId, productCode });

  await sendMessage(
    chatId,
    '🔄 Создаём счёт для оплаты...\n\nПожалуйста, подождите.'
  );

  // Note: Invoice creation happens in Mini App via create-stars-invoice function
  // This is just a notification. The actual payment flow goes through Mini App.
  
  const telegramConfig = getTelegramConfig();
  await sendMessage(
    chatId,
    '💳 *Оплата через Telegram Stars*\n\n' +
    'Для совершения покупки, пожалуйста, откройте приложение:',
    {
      inline_keyboard: [
        [{ 
          text: '🚀 Открыть приложение', 
          web_app: { url: `${telegramConfig.deepLinkBase}?startapp=buy_${productCode}` } 
        }],
      ],
    }
  );
}
