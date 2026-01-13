import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, tinkoffCharge } from "../_shared/tinkoff.ts";

interface ChargeRequest {
  subscriptionId?: string;
  // For manual trigger - charge specific subscription
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json().catch(() => ({})) as ChargeRequest;
    
    // Get subscriptions that need charging
    let query = supabase
      .from('tinkoff_subscriptions')
      .select('*, profiles!inner(user_id, first_name)')
      .eq('status', 'active')
      .lte('next_billing_date', new Date().toISOString());

    if (body.subscriptionId) {
      query = query.eq('id', body.subscriptionId);
    }

    const { data: subscriptions, error: fetchError } = await query;

    if (fetchError) {
      console.error('Failed to fetch subscriptions:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No subscriptions to charge');
      return new Response(
        JSON.stringify({ success: true, charged: 0, message: 'No subscriptions to charge' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${subscriptions.length} subscriptions to charge`);

    const results: Array<{ subscriptionId: string; success: boolean; error?: string }> = [];

    for (const subscription of subscriptions) {
      try {
        // Get the product to determine amount
        const { data: product } = await supabase
          .from('stars_products')
          .select('*')
          .eq('product_code', subscription.product_code)
          .single();

        if (!product || !product.price_rub_cents) {
          console.error(`Product not found or no RUB price: ${subscription.product_code}`);
          results.push({ 
            subscriptionId: subscription.id, 
            success: false, 
            error: 'Product not found or no RUB price' 
          });
          continue;
        }

        // Create order ID
        const orderId = `sub_${subscription.id}_${Date.now()}`;

        // Create payment transaction record
        const { data: transaction, error: txError } = await supabase
          .from('payment_transactions')
          .insert({
            user_id: subscription.user_id,
            product_code: subscription.product_code,
            amount_cents: product.price_rub_cents,
            currency: 'RUB',
            gateway: 'tinkoff',
            gateway_order_id: orderId,
            status: 'pending',
            is_recurrent: true,
            subscription_id: subscription.id,
          })
          .select()
          .single();

        if (txError || !transaction) {
          console.error('Failed to create transaction:', txError);
          results.push({ 
            subscriptionId: subscription.id, 
            success: false, 
            error: 'Failed to create transaction' 
          });
          continue;
        }

        // Execute charge
        const chargeResult = await tinkoffCharge({
          RebillId: subscription.rebill_id,
          Amount: product.price_rub_cents,
          OrderId: orderId,
          Description: `Продление подписки: ${product.name}`,
        });

        if (chargeResult.Success) {
          // Update transaction
          await supabase
            .from('payment_transactions')
            .update({
              status: 'completed',
              gateway_transaction_id: chargeResult.PaymentId?.toString(),
              completed_at: new Date().toISOString(),
            })
            .eq('id', transaction.id);

          // Calculate next billing date
          const nextBillingDate = new Date();
          nextBillingDate.setDate(nextBillingDate.getDate() + (product.subscription_days || 30));

          // Update subscription
          await supabase
            .from('tinkoff_subscriptions')
            .update({
              next_billing_date: nextBillingDate.toISOString(),
              last_charge_date: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', subscription.id);

          // Update profile subscription
          await supabase
            .from('profiles')
            .update({
              subscription_tier: subscription.subscription_tier,
              subscription_expires_at: nextBillingDate.toISOString(),
            })
            .eq('user_id', subscription.user_id);

          // Grant credits if applicable
          if (product.credits_amount) {
            await supabase.rpc('add_credits', {
              p_user_id: subscription.user_id,
              p_amount: product.credits_amount,
              p_action_type: 'subscription_renewal',
              p_description: `Продление подписки: ${product.name}`,
            });
          }

          console.log(`Successfully charged subscription ${subscription.id}`);
          results.push({ subscriptionId: subscription.id, success: true });

        } else {
          // Charge failed
          const errorMessage = chargeResult.Message || 'Charge failed';
          
          await supabase
            .from('payment_transactions')
            .update({
              status: 'failed',
              error_message: errorMessage,
            })
            .eq('id', transaction.id);

          // Increment failed attempts
          const failedAttempts = (subscription.failed_charge_attempts || 0) + 1;
          
          // If too many failed attempts, suspend subscription
          if (failedAttempts >= 3) {
            await supabase
              .from('tinkoff_subscriptions')
              .update({
                status: 'suspended',
                failed_charge_attempts: failedAttempts,
                updated_at: new Date().toISOString(),
              })
              .eq('id', subscription.id);

            console.log(`Subscription ${subscription.id} suspended after ${failedAttempts} failed attempts`);
          } else {
            // Schedule retry for tomorrow
            const retryDate = new Date();
            retryDate.setDate(retryDate.getDate() + 1);
            
            await supabase
              .from('tinkoff_subscriptions')
              .update({
                failed_charge_attempts: failedAttempts,
                next_billing_date: retryDate.toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', subscription.id);
          }

          console.error(`Failed to charge subscription ${subscription.id}:`, errorMessage);
          results.push({ subscriptionId: subscription.id, success: false, error: errorMessage });
        }

      } catch (err) {
        console.error(`Error processing subscription ${subscription.id}:`, err);
        results.push({ 
          subscriptionId: subscription.id, 
          success: false, 
          error: err instanceof Error ? err.message : 'Unknown error' 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`Charging complete: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        charged: successCount, 
        failed: failCount,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Recurrent charge error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
