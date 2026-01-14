/**
 * Tinkoff Payment Service
 * Handles card payments via Tinkoff Acquiring
 */

import { supabase } from '@/integrations/supabase/client';
import type { CreatePaymentResponse, PaymentTransaction } from '@/types/payment';
import { logger } from '@/lib/logger';

export interface CreateTinkoffPaymentParams {
  productCode: string;
  successUrl?: string;
  failUrl?: string;
}

export interface TinkoffSubscription {
  id: string;
  user_id: string;
  product_code: string;
  rebill_id: string;
  card_pan?: string;
  card_exp_date?: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  amount_cents: number;
  currency: string;
  billing_cycle_days: number;
  next_billing_date?: string;
  last_payment_date?: string;
  failed_attempts: number;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CancelSubscriptionResponse {
  success: boolean;
  message?: string;
  expiresAt?: string;
  error?: string;
}

/**
 * Create a Tinkoff payment
 */
export async function createTinkoffPayment(
  params: CreateTinkoffPaymentParams
): Promise<CreatePaymentResponse> {
  const timer = logger.startTimer('tinkoff:createPayment');
  
  try {
    logger.info('Creating Tinkoff payment', { productCode: params.productCode });

    const { data, error } = await supabase.functions.invoke('tinkoff-create-payment', {
      body: {
        productCode: params.productCode,
        successUrl: params.successUrl || `${window.location.origin}/payment/success`,
        failUrl: params.failUrl || `${window.location.origin}/payment/fail`,
      },
    });

    timer();

    if (error) {
      logger.error('Tinkoff payment creation failed', error, { productCode: params.productCode });
      return {
        success: false,
        error: error.message || 'Failed to create payment',
      };
    }

    if (!data.success) {
      logger.warn('Tinkoff payment rejected', { 
        productCode: params.productCode,
        error: data.error,
        errorCode: data.errorCode,
      });
      return {
        success: false,
        error: data.error || 'Payment initialization failed',
        errorCode: data.errorCode,
      };
    }

    logger.info('Tinkoff payment created', {
      transactionId: data.transactionId,
      orderId: data.orderId,
      amount: data.amount,
    });

    return {
      success: true,
      transactionId: data.transactionId,
      paymentUrl: data.paymentUrl,
      orderId: data.orderId,
      amount: data.amount,
      currency: data.currency,
    };
  } catch (error) {
    timer();
    logger.error('Tinkoff payment error', error as Error);
    return {
      success: false,
      error: (error as Error).message || 'Unknown error',
    };
  }
}

/**
 * Get payment transaction by ID
 */
export async function getPaymentTransaction(
  transactionId: string
): Promise<PaymentTransaction | null> {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (error || !data) {
      logger.warn('Payment transaction not found', { transactionId });
      return null;
    }

    return data as unknown as PaymentTransaction;
  } catch (error) {
    logger.error('Failed to get payment transaction', error as Error);
    return null;
  }
}

/**
 * Get user's payment transactions
 */
export async function getUserPaymentTransactions(
  limit = 20
): Promise<PaymentTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to get payment transactions', error);
      return [];
    }

    return (data || []) as unknown as PaymentTransaction[];
  } catch (error) {
    logger.error('Failed to get payment transactions', error as Error);
    return [];
  }
}

/**
 * Get user's active Tinkoff subscriptions
 */
export async function getUserTinkoffSubscriptions(): Promise<TinkoffSubscription[]> {
  try {
    const { data, error } = await supabase
      .from('tinkoff_subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to get Tinkoff subscriptions', error);
      return [];
    }

    return (data || []) as unknown as TinkoffSubscription[];
  } catch (error) {
    logger.error('Failed to get Tinkoff subscriptions', error as Error);
    return [];
  }
}

/**
 * Get user's active subscription (first active one)
 */
export async function getActiveSubscription(): Promise<TinkoffSubscription | null> {
  try {
    const { data, error } = await supabase
      .from('tinkoff_subscriptions')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error('Failed to get active subscription', error);
      return null;
    }

    return data as unknown as TinkoffSubscription | null;
  } catch (error) {
    logger.error('Failed to get active subscription', error as Error);
    return null;
  }
}

/**
 * Cancel a Tinkoff subscription
 */
export async function cancelTinkoffSubscription(
  subscriptionId: string
): Promise<CancelSubscriptionResponse> {
  const timer = logger.startTimer('tinkoff:cancelSubscription');
  
  try {
    logger.info('Cancelling Tinkoff subscription', { subscriptionId });

    const { data, error } = await supabase.functions.invoke('tinkoff-cancel-subscription', {
      body: { subscriptionId },
    });

    timer();

    if (error) {
      logger.error('Subscription cancellation failed', error, { subscriptionId });
      return {
        success: false,
        error: error.message || 'Failed to cancel subscription',
      };
    }

    if (!data.success) {
      logger.warn('Subscription cancellation rejected', { 
        subscriptionId,
        error: data.error,
      });
      return {
        success: false,
        error: data.error || 'Cancellation failed',
      };
    }

    logger.info('Subscription cancelled', {
      subscriptionId,
      expiresAt: data.expiresAt,
    });

    return {
      success: true,
      message: data.message,
      expiresAt: data.expiresAt,
    };
  } catch (error) {
    timer();
    logger.error('Cancel subscription error', error as Error);
    return {
      success: false,
      error: (error as Error).message || 'Unknown error',
    };
  }
}

/**
 * Redirect to Tinkoff payment page
 */
export function redirectToPayment(paymentUrl: string): void {
  // Store current URL for return
  sessionStorage.setItem('payment_return_url', window.location.href);
  
  // Redirect to Tinkoff payment page
  window.location.href = paymentUrl;
}
