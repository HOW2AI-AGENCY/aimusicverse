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
 * Redirect to Tinkoff payment page
 */
export function redirectToPayment(paymentUrl: string): void {
  // Store current URL for return
  sessionStorage.setItem('payment_return_url', window.location.href);
  
  // Redirect to Tinkoff payment page
  window.location.href = paymentUrl;
}
