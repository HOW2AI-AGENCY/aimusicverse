import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from '../_shared/supabase-client.ts';
import { 
  verifyTinkoffToken, 
  mapTinkoffStatus,
  type TinkoffNotification,
  type TinkoffPaymentStatus
} from "../_shared/tinkoff.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const secretKey = Deno.env.get('TINKOFF_SECRET_KEY');

    if (!secretKey) {
      console.error('Tinkoff secret key not configured');
      return new Response('OK', { status: 200 }); // Always return OK to Tinkoff
    }

    // Parse notification
    const notification: TinkoffNotification = await req.json();
    
    console.log('Tinkoff webhook received:', {
      orderId: notification.OrderId,
      status: notification.Status,
      amount: notification.Amount,
      success: notification.Success,
    });

    // Verify token
    const isValid = await verifyTinkoffToken(notification, secretKey);
    if (!isValid) {
      console.error('Invalid Tinkoff token for order:', notification.OrderId);
      return new Response('OK', { status: 200 }); // Still return OK
    }

    // Use shared Supabase client
    const supabase = getSupabaseClient();

    // Find transaction by order ID
    const { data: transaction, error: txError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('gateway_order_id', notification.OrderId)
      .single();

    if (txError || !transaction) {
      console.error('Transaction not found for order:', notification.OrderId, txError);
      return new Response('OK', { status: 200 });
    }

    // Check if already processed (idempotency)
    if (transaction.status === 'completed') {
      console.log('Transaction already completed:', transaction.id);
      return new Response('OK', { status: 200 });
    }

    // Map status
    const newStatus = mapTinkoffStatus(notification.Status as TinkoffPaymentStatus);
    
    console.log('Processing status change:', {
      transactionId: transaction.id,
      oldStatus: transaction.status,
      newStatus,
      tinkoffStatus: notification.Status,
    });

    // Handle CONFIRMED status - grant credits/subscription
    if (notification.Status === 'CONFIRMED' && notification.Success) {
      console.log('Payment confirmed, processing credits...');
      
      // Use the database function to process payment
      const { data: result, error: processError } = await supabase
        .rpc('process_gateway_payment', {
          p_transaction_id: transaction.id,
          p_gateway_transaction_id: String(notification.PaymentId),
          p_metadata: {
            tinkoff_status: notification.Status,
            pan: notification.Pan,
            card_id: notification.CardId,
          }
        });

      if (processError) {
        console.error('Failed to process payment:', processError);
        
        // Update transaction with error
        await supabase
          .from('payment_transactions')
          .update({
            status: 'failed',
            error_message: processError.message,
          })
          .eq('id', transaction.id);
      } else {
        console.log('Payment processed successfully:', result);
        
        // Send Telegram notification if payment was from bot
        const metadata = transaction.metadata as Record<string, unknown> | null;
        if (metadata?.source === 'telegram_bot' && metadata?.telegram_id) {
          try {
            // Get user's chat_id from profiles
            const telegramId = Number(metadata.telegram_id);
            const { data: profile } = await supabase
              .from('profiles')
              .select('telegram_chat_id')
              .eq('telegram_id', telegramId)
              .single();
            
            const chatId = metadata.chat_id || profile?.telegram_chat_id;
            
            if (chatId) {
              // Send notification via telegram-bot
              await supabase.functions.invoke('send-telegram-notification', {
                body: {
                  chatId: Number(chatId),
                  message: `✅ *Оплата успешна!*\n\n` +
                    `📦 ${metadata.product_name || 'Пакет кредитов'}\n` +
                    `💎 Начислено: *${metadata.credits_amount || transaction.credits_granted} кредитов*\n\n` +
                    `Теперь вы можете создавать музыку!`,
                  parseMode: 'Markdown',
                }
              });
              console.log('Telegram notification sent to chat:', chatId);
            }
          } catch (notifyError) {
            console.error('Failed to send Telegram notification:', notifyError);
            // Don't fail the webhook for notification errors
          }
        }
      }
    }
    // Handle other statuses
    else if (['REJECTED', 'DEADLINE_EXPIRED'].includes(notification.Status)) {
      await supabase
        .from('payment_transactions')
        .update({
          status: 'failed',
          error_message: `Tinkoff: ${notification.Status}`,
          gateway_transaction_id: String(notification.PaymentId),
        })
        .eq('id', transaction.id);
      
      console.log('Payment failed:', notification.Status);
    }
    else if (['CANCELED', 'REVERSED', 'PARTIAL_REVERSED'].includes(notification.Status)) {
      await supabase
        .from('payment_transactions')
        .update({
          status: 'cancelled',
          gateway_transaction_id: String(notification.PaymentId),
        })
        .eq('id', transaction.id);
      
      console.log('Payment cancelled:', notification.Status);
    }
    else if (['REFUNDED', 'PARTIAL_REFUNDED'].includes(notification.Status)) {
      await supabase
        .from('payment_transactions')
        .update({
          status: 'refunded',
          gateway_transaction_id: String(notification.PaymentId),
        })
        .eq('id', transaction.id);
      
      console.log('Payment refunded:', notification.Status);
    }
    else {
      // Update status for intermediate states
      await supabase
        .from('payment_transactions')
        .update({
          status: newStatus,
          gateway_transaction_id: String(notification.PaymentId),
        })
        .eq('id', transaction.id);
      
      console.log('Payment status updated:', newStatus);
    }

    // Always return OK to Tinkoff
    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Tinkoff webhook error:', error);
    // Always return OK to prevent retries
    return new Response('OK', { status: 200 });
  }
});
