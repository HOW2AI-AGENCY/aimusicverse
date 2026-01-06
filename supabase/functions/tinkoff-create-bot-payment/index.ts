import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  generateTinkoffToken, 
  initTinkoffPayment, 
  generateOrderId,
  type TinkoffInitRequest 
} from "../_shared/tinkoff.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateBotPaymentRequest {
  productCode: string;
  telegramId: number;
  chatId?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const terminalKey = Deno.env.get('TINKOFF_TERMINAL_KEY');
    const secretKey = Deno.env.get('TINKOFF_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!terminalKey || !secretKey) {
      console.error('Tinkoff credentials not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Payment gateway not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { productCode, telegramId, chatId }: CreateBotPaymentRequest = await req.json();

    if (!productCode || !telegramId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Product code and telegram ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating bot payment', { productCode, telegramId });

    // Get user by telegram_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', telegramId)
      .single();

    if (profileError || !profile) {
      console.error('User not found:', telegramId, profileError);
      return new Response(
        JSON.stringify({ success: false, error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get product
    const { data: product, error: productError } = await supabaseAdmin
      .from('stars_products')
      .select('*')
      .eq('product_code', productCode)
      .eq('status', 'active')
      .single();

    if (productError || !product) {
      console.error('Product not found:', productCode, productError);
      return new Response(
        JSON.stringify({ success: false, error: 'Product not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if product has RUB price
    if (!product.price_rub_cents) {
      return new Response(
        JSON.stringify({ success: false, error: 'Product not available for card payment' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const orderId = generateOrderId();

    // Create payment transaction
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        user_id: profile.user_id,
        gateway: 'tinkoff',
        product_code: productCode,
        amount_cents: product.price_rub_cents,
        currency: 'RUB',
        status: 'pending',
        gateway_order_id: orderId,
        metadata: {
          source: 'telegram_bot',
          telegram_id: telegramId,
          chat_id: chatId,
          product_name: product.name,
          credits_amount: product.credits_amount,
          subscription_tier: product.subscription_tier,
        }
      })
      .select()
      .single();

    if (txError || !transaction) {
      console.error('Failed to create transaction:', txError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build Tinkoff request
    const notificationUrl = `${supabaseUrl}/functions/v1/tinkoff-webhook`;
    
    // Get product name for description
    const productName = typeof product.name === 'object' 
      ? (product.name as Record<string, string>).ru || (product.name as Record<string, string>).en || productCode
      : product.name || productCode;

    const tinkoffRequest: TinkoffInitRequest = {
      TerminalKey: terminalKey,
      Amount: product.price_rub_cents,
      OrderId: orderId,
      Description: `Покупка: ${productName}`,
      NotificationURL: notificationUrl,
      PayType: 'O',
      Language: 'ru',
      DATA: {
        UserId: profile.user_id,
        TransactionId: transaction.id,
        TelegramId: String(telegramId),
        Source: 'telegram_bot',
      }
    };

    tinkoffRequest.Token = await generateTinkoffToken(tinkoffRequest as unknown as Record<string, unknown>, secretKey);

    console.log('Initializing Tinkoff payment for bot:', { orderId, amount: product.price_rub_cents });

    const tinkoffResponse = await initTinkoffPayment(tinkoffRequest);

    console.log('Tinkoff response:', tinkoffResponse);

    if (!tinkoffResponse.Success) {
      await supabaseAdmin
        .from('payment_transactions')
        .update({
          status: 'failed',
          error_message: tinkoffResponse.Message || tinkoffResponse.Details || 'Tinkoff init failed',
        })
        .eq('id', transaction.id);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: tinkoffResponse.Message || 'Payment initialization failed',
          errorCode: tinkoffResponse.ErrorCode 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update transaction with payment info
    await supabaseAdmin
      .from('payment_transactions')
      .update({
        gateway_transaction_id: String(tinkoffResponse.PaymentId),
        gateway_payment_url: tinkoffResponse.PaymentURL,
        status: 'pending',
      })
      .eq('id', transaction.id);

    console.log('Bot payment created successfully:', { 
      transactionId: transaction.id, 
      paymentId: tinkoffResponse.PaymentId,
      paymentUrl: tinkoffResponse.PaymentURL 
    });

    return new Response(
      JSON.stringify({
        success: true,
        transactionId: transaction.id,
        paymentUrl: tinkoffResponse.PaymentURL,
        orderId: orderId,
        amount: product.price_rub_cents,
        currency: 'RUB',
        productName,
        creditsAmount: product.credits_amount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Tinkoff bot payment error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});