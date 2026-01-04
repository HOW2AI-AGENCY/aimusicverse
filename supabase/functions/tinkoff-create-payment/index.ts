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

interface CreatePaymentRequest {
  productCode: string;
  successUrl?: string;
  failUrl?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get secrets
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

    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase clients
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const { productCode, successUrl, failUrl }: CreatePaymentRequest = await req.json();

    if (!productCode) {
      return new Response(
        JSON.stringify({ success: false, error: 'Product code required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get product
    const { data: product, error: productError } = await supabaseAdmin
      .from('stars_products')
      .select('*')
      .eq('product_code', productCode)
      .eq('is_active', true)
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

    // Generate unique order ID
    const orderId = generateOrderId();

    // Create payment transaction record
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        gateway: 'tinkoff',
        product_code: productCode,
        amount_cents: product.price_rub_cents,
        currency: 'RUB',
        status: 'pending',
        gateway_order_id: orderId,
        metadata: {
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
    const defaultSuccessUrl = successUrl || `${req.headers.get('origin') || 'https://t.me'}/payment/success`;
    const defaultFailUrl = failUrl || `${req.headers.get('origin') || 'https://t.me'}/payment/fail`;

    // Get product name for description
    const productName = typeof product.name === 'object' 
      ? (product.name as Record<string, string>).ru || (product.name as Record<string, string>).en || productCode
      : product.name || productCode;

    const tinkoffRequest: TinkoffInitRequest = {
      TerminalKey: terminalKey,
      Amount: product.price_rub_cents,
      OrderId: orderId,
      Description: `Покупка: ${productName}`,
      SuccessURL: defaultSuccessUrl,
      FailURL: defaultFailUrl,
      NotificationURL: notificationUrl,
      PayType: 'O', // Одностадийная оплата
      Language: 'ru',
      DATA: {
        UserId: user.id,
        TransactionId: transaction.id,
      }
    };

    // Generate token
    tinkoffRequest.Token = await generateTinkoffToken(tinkoffRequest as unknown as Record<string, unknown>, secretKey);

    console.log('Initializing Tinkoff payment:', { orderId, amount: product.price_rub_cents });

    // Call Tinkoff Init
    const tinkoffResponse = await initTinkoffPayment(tinkoffRequest);

    console.log('Tinkoff response:', tinkoffResponse);

    if (!tinkoffResponse.Success) {
      // Update transaction as failed
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

    console.log('Payment created successfully:', { 
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
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Tinkoff create payment error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
