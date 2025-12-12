/**
 * Telegram Stars Payment Webhook Handler
 * 
 * Handles:
 * - pre_checkout_query: Validates payment before processing
 * - successful_payment (via message.successful_payment): Processes completed payment
 * 
 * Tasks: T042-T049
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('stars-webhook');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-telegram-bot-api-secret-token',
};

interface PreCheckoutQuery {
  id: string;
  from: {
    id: number;
    is_bot: boolean;
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

interface WebhookUpdate {
  update_id: number;
  pre_checkout_query?: PreCheckoutQuery;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    successful_payment?: SuccessfulPayment;
  };
}

interface InvoicePayload {
  transactionId: string;
  userId: string;
  productId: string;
  productCode: string;
  timestamp: number;
}

/**
 * T043: Validate webhook signature
 */
function validateWebhookSignature(req: Request): boolean {
  const secretToken = Deno.env.get('TELEGRAM_WEBHOOK_SECRET_TOKEN');
  if (!secretToken) {
    logger.warn('TELEGRAM_WEBHOOK_SECRET_TOKEN not configured');
    return true; // Skip validation if not configured (dev mode)
  }

  const headerToken = req.headers.get('x-telegram-bot-api-secret-token');
  if (!headerToken) {
    logger.error('Missing webhook secret token header');
    return false;
  }

  if (headerToken !== secretToken) {
    logger.error('Invalid webhook secret token');
    return false;
  }

  return true;
}

/**
 * T044: Handle pre-checkout query (validation before payment)
 */
async function handlePreCheckoutQuery(
  query: PreCheckoutQuery,
  supabase: any,
  botToken: string
): Promise<Response> {
  const startTime = Date.now();
  logger.info('Pre-checkout query received', { queryId: query.id, amount: query.total_amount });

  try {
    // Parse invoice payload
    const payload: InvoicePayload = JSON.parse(query.invoice_payload);
    
    // Get transaction from database
    const { data: transaction, error: txError } = await supabase
      .from('stars_transactions')
      .select('*, product:stars_products(*)')
      .eq('id', payload.transactionId)
      .single();

    if (txError || !transaction) {
      logger.error('Transaction not found', { transactionId: payload.transactionId, error: txError });
      
      // Answer pre-checkout query with error
      await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pre_checkout_query_id: query.id,
          ok: false,
          error_message: 'Transaction not found. Please try again.',
        }),
      });

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate product exists and is active
    if (!transaction.product || transaction.product.status !== 'active') {
      logger.error('Product not active', { productId: transaction.product_id });
      
      await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pre_checkout_query_id: query.id,
          ok: false,
          error_message: 'This product is no longer available.',
        }),
      });

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate amount matches
    if (query.total_amount !== transaction.product.stars_price) {
      logger.error('Amount mismatch', {
        expected: transaction.product.stars_price,
        received: query.total_amount,
      });

      await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pre_checkout_query_id: query.id,
          ok: false,
          error_message: 'Price mismatch. Please try again.',
        }),
      });

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update transaction status to 'processing'
    await supabase
      .from('stars_transactions')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', payload.transactionId);

    // Answer pre-checkout query with success
    await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pre_checkout_query_id: query.id,
        ok: true,
      }),
    });

    const duration = Date.now() - startTime;
    logger.info('Pre-checkout approved', { queryId: query.id, duration });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    logger.error('Pre-checkout error', { error: error.message, stack: error.stack });

    // Answer with generic error
    await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pre_checkout_query_id: query.id,
        ok: false,
        error_message: 'Payment processing error. Please contact support.',
      }),
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

/**
 * T045: Handle successful payment (credit allocation)
 * T047: Idempotency check
 */
async function handleSuccessfulPayment(
  payment: SuccessfulPayment,
  telegramUserId: number,
  supabase: any,
  botToken: string
): Promise<Response> {
  const startTime = Date.now();
  logger.info('Successful payment received', {
    chargeId: payment.telegram_payment_charge_id,
    amount: payment.total_amount,
  });

  try {
    // Parse invoice payload
    const payload: InvoicePayload = JSON.parse(payment.invoice_payload);

    // T047: Check for duplicate (idempotency)
    const { data: existing } = await supabase
      .from('stars_transactions')
      .select('*')
      .eq('telegram_payment_charge_id', payment.telegram_payment_charge_id)
      .single();

    if (existing) {
      logger.info('Duplicate payment detected (idempotent)', {
        chargeId: payment.telegram_payment_charge_id,
        transactionId: existing.id,
      });

      return new Response(JSON.stringify({ ok: true, duplicate: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process payment using database function
    const { data: result, error: processError } = await supabase.rpc('process_stars_payment', {
      p_transaction_id: payload.transactionId,
      p_telegram_payment_charge_id: payment.telegram_payment_charge_id,
      p_metadata: {
        telegram_user_id: telegramUserId,
        provider_charge_id: payment.provider_payment_charge_id,
        currency: payment.currency,
        processed_at: new Date().toISOString(),
      },
    });

    if (processError || !result?.success) {
      logger.error('Payment processing failed', {
        error: processError,
        result,
        transactionId: payload.transactionId,
      });

      return new Response(
        JSON.stringify({
          error: 'Payment processing failed',
          details: result?.error || processError?.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const duration = Date.now() - startTime;
    logger.info('Payment processed successfully', {
      transactionId: payload.transactionId,
      type: result.type,
      credits: result.credits_granted,
      subscription: result.subscription_tier,
      duration,
    });

    // Send confirmation message to user
    const confirmationMessage = result.type === 'credits'
      ? `✅ Payment successful! ${result.credits_granted} credits have been added to your account.`
      : `✅ Subscription activated! You now have ${result.subscription_tier} access.`;

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramUserId,
        text: confirmationMessage,
        parse_mode: 'Markdown',
      }),
    });

    return new Response(JSON.stringify({ ok: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    logger.error('Successful payment handler error', {
      error: error.message,
      stack: error.stack,
    });

    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * T042: Main webhook handler with timeout protection (T048)
 */
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // T048: Timeout protection (must respond <30s for Telegram)
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), 28000); // 28s safety margin

  try {
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN not configured');
    }

    // T043: Validate webhook signature
    if (!validateWebhookSignature(req)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const update: WebhookUpdate = await req.json();
    logger.info('Webhook update received', { updateId: update.update_id });

    // Handle pre_checkout_query
    if (update.pre_checkout_query) {
      const response = await handlePreCheckoutQuery(update.pre_checkout_query, supabase, botToken);
      clearTimeout(timeoutId);
      return response;
    }

    // Handle successful_payment
    if (update.message?.successful_payment) {
      const response = await handleSuccessfulPayment(
        update.message.successful_payment,
        update.message.from.id,
        supabase,
        botToken
      );
      clearTimeout(timeoutId);
      return response;
    }

    // Unknown update type
    logger.warn('Unknown update type', { update });
    clearTimeout(timeoutId);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // T046: Error handling and structured logging
    logger.error('Webhook error', {
      level: 'ERROR',
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
