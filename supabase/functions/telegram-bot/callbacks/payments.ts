/**
 * Payment Callback Handlers
 */

import { answerCallbackQuery } from '../telegram-api.ts';

export async function handlePaymentCallbacks(
  data: string,
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string
): Promise<boolean> {
  // Buy credits main menu
  if (data === 'buy_credits' || data === 'buy_menu_main') {
    const { handleBuyCommand } = await import('../handlers/payment.ts');
    await handleBuyCommand(chatId);
    await answerCallbackQuery(queryId);
    return true;
  }

  // Credits packages
  if (data === 'buy_menu_credits') {
    const { handleBuyCreditPackages } = await import('../handlers/payment.ts');
    await handleBuyCreditPackages(chatId, messageId);
    await answerCallbackQuery(queryId);
    return true;
  }

  // Subscriptions
  if (data === 'buy_menu_subscriptions') {
    const { handleBuySubscriptions } = await import('../handlers/payment.ts');
    await handleBuySubscriptions(chatId, messageId);
    await answerCallbackQuery(queryId);
    return true;
  }

  // Buy specific product
  if (data.startsWith('buy_product_')) {
    const productCode = data.replace('buy_product_', '');
    const { handleBuyProduct } = await import('../handlers/payment.ts');
    await handleBuyProduct(chatId, userId, productCode);
    await answerCallbackQuery(queryId, '🔄 Создаём счёт...');
    return true;
  }

  return false;
}
