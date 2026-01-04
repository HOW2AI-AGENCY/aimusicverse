import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
