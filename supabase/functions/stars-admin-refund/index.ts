/**
 * Telegram Stars Payment Admin Refund
 * 
 * Process refunds for Stars payments
 * - Validate refund eligibility (within 24 hours, no credits spent)
 * - Call Telegram refundStarPayment API
 * - Update transaction status to 'refunded'
 * - Deduct credits from user balance if applicable
 * 
 * Tasks: T129-T133
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient } from '../_shared/supabase-client.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('stars-admin-refund');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RefundRequest {
  transactionId: string;
  reason?: string;
}

/**
 * T129: Admin authentication check
 */
async function verifyAdminAccess(supabase: any, token: string | null): Promise<{ isAdmin: boolean; userId: string | null; error?: string }> {
  if (!token) {
    return { isAdmin: false, userId: null, error: 'Missing authorization header' };
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    logger.error('Authentication failed', { error: authError });
    return { isAdmin: false, userId: null, error: 'Unauthorized' };
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single();

  if (!profile?.is_admin) {
    logger.warn('Non-admin attempted to process refund', { userId: user.id });
    return { isAdmin: false, userId: user.id, error: 'Forbidden: admin access required' };
  }

  return { isAdmin: true, userId: user.id };
}

/**
 * T131: Validate refund eligibility
 */
function validateRefundEligibility(transaction: any): { eligible: boolean; reason?: string } {
  // Check transaction status
  if (transaction.status !== 'completed') {
    return { eligible: false, reason: 'Only completed transactions can be refunded' };
  }

  // Check if already refunded
  if (transaction.refunded_at) {
    return { eligible: false, reason: 'Transaction has already been refunded' };
  }

  // Check if within 24 hours (Telegram policy)
  const createdAt = new Date(transaction.created_at);
  const now = new Date();
  const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  
  if (hoursSinceCreation > 24) {
    return { eligible: false, reason: 'Refund window expired (>24 hours)' };
  }

  return { eligible: true };
}

/**
 * T129-T133: Main refund endpoint
 */
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN not configured');
    }

    const supabase = getSupabaseClient();

    // T129: Verify admin authentication
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    const { isAdmin, userId: adminUserId, error: authError } = await verifyAdminAccess(supabase, token ?? null);
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: authError || 'Unauthorized' }),
        {
          status: authError === 'Forbidden: admin access required' ? 403 : 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { transactionId, reason }: RefundRequest = await req.json();

    if (!transactionId) {
      return new Response(
        JSON.stringify({ error: 'transactionId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.info('Processing refund', { transactionId, adminUserId, reason });

    // Get transaction details
    const { data: transaction, error: txError } = await supabase
      .from('stars_transactions')
      .select(`
        *,
        product:stars_products (
          id,
          product_code,
          product_type,
          credits_amount
        )
      `)
      .eq('id', transactionId)
      .single();

    if (txError || !transaction) {
      logger.error('Transaction not found', { transactionId, error: txError });
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // T131: Validate refund eligibility
    const eligibility = validateRefundEligibility(transaction);
    if (!eligibility.eligible) {
      logger.warn('Refund not eligible', { transactionId, reason: eligibility.reason });
      return new Response(
        JSON.stringify({ 
          error: 'Refund not eligible',
          reason: eligibility.reason,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if credits have been spent (for credit packages)
    if (transaction.product?.product_type === 'credit_package') {
      const creditsGranted = transaction.product.credits_amount || 0;
      
      // Get user's current balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('user_id', transaction.user_id)
        .single();

      // Get total credits spent since transaction
      const { data: creditTransactions } = await supabase
        .from('credit_transactions')
        .select('amount')
        .eq('user_id', transaction.user_id)
        .eq('action_type', 'spend')
        .gte('created_at', transaction.created_at);

      const creditsSpent = creditTransactions
        ? creditTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
        : 0;

      if (creditsSpent > 0) {
        logger.warn('Cannot refund: credits already spent', { 
          transactionId, 
          creditsGranted, 
          creditsSpent,
        });
        return new Response(
          JSON.stringify({ 
            error: 'Refund not eligible',
            reason: `User has already spent ${creditsSpent} of ${creditsGranted} credits`,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user has sufficient balance for deduction
      const currentBalance = profile?.credits || 0;
      if (currentBalance < creditsGranted) {
        logger.warn('Insufficient balance for refund', {
          transactionId,
          currentBalance,
          creditsGranted,
        });
        return new Response(
          JSON.stringify({ 
            error: 'Refund not eligible',
            reason: `User has insufficient balance (${currentBalance}) to deduct ${creditsGranted} credits`,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // T130: Call Telegram refundStarPayment API
    const refundParams = {
      user_id: transaction.telegram_user_id,
      telegram_payment_charge_id: transaction.telegram_payment_charge_id,
    };

    logger.info('Calling Telegram refundStarPayment', { params: refundParams });

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/refundStarPayment`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(refundParams),
      }
    );

    const telegramResult = await telegramResponse.json();

    if (!telegramResult.ok) {
      logger.error('Telegram API refund failed', { error: telegramResult });
      return new Response(
        JSON.stringify({ 
          error: 'Telegram refund failed', 
          details: telegramResult.description || 'Unknown error',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // T132: Update transaction status to 'refunded'
    const { error: updateError } = await supabase
      .from('stars_transactions')
      .update({
        status: 'refunded',
        refunded_at: new Date().toISOString(),
        refund_reason: reason || 'Admin-initiated refund',
        refunded_by: adminUserId,
      })
      .eq('id', transactionId);

    if (updateError) {
      logger.error('Failed to update transaction status', { error: updateError });
      // Note: Telegram refund succeeded but DB update failed - critical error
      return new Response(
        JSON.stringify({ 
          error: 'Partial failure: Telegram refund succeeded but database update failed',
          details: updateError.message,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // T133: Deduct credits from user balance if applicable
    if (transaction.product?.product_type === 'credit_package') {
      const creditsToDeduct = transaction.product.credits_amount || 0;

      // Create negative credit transaction
      const { error: creditError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: transaction.user_id,
          amount: -creditsToDeduct,
          transaction_type: 'refund',
          action_type: 'refund',
          description: `Refund for transaction ${transactionId}`,
          stars_transaction_id: transactionId,
        });

      if (creditError) {
        logger.error('Failed to deduct credits', { error: creditError });
        // Note: Refund processed but credits not deducted - requires manual intervention
        return new Response(
          JSON.stringify({ 
            error: 'Partial failure: Refund processed but credits not deducted',
            details: creditError.message,
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update user balance using user_credits table (not profiles)
      const { data: currentCredits } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', transaction.user_id)
        .maybeSingle();

      if (currentCredits) {
        const newBalance = Math.max(0, (currentCredits.balance || 0) - creditsToDeduct);
        const { error: balanceError } = await supabase
          .from('user_credits')
          .update({ 
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', transaction.user_id);

        if (balanceError) {
          logger.error('Failed to update user balance', { error: balanceError });
        }
      }

      logger.info('Credits deducted', { 
        transactionId, 
        userId: transaction.user_id, 
        amount: creditsToDeduct,
      });
    }

    logger.info('Refund processed successfully', { 
      transactionId, 
      adminUserId,
      productType: transaction.product?.product_type,
    });

    return new Response(
      JSON.stringify({
        success: true,
        transactionId,
        refundedAt: new Date().toISOString(),
        message: 'Refund processed successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    logger.error('Error in stars-admin-refund', {
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
});
