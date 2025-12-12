/**
 * Stars Payment Service
 * Handles all API calls related to Telegram Stars payments
 */

import { supabase } from '@/lib/supabase';
import type {
  StarsProduct,
  StarsTransaction,
  CreateInvoiceRequest,
  CreateInvoiceResponse,
  SubscriptionStatusResponse,
  PaymentStatsResponse,
  ErrorResponse,
} from '@/types/starsPayment';

/**
 * Create a Telegram Stars invoice for a product purchase
 */
export async function createInvoice(
  request: CreateInvoiceRequest
): Promise<CreateInvoiceResponse> {
  const { data, error } = await supabase.functions.invoke('create-stars-invoice', {
    body: request,
  });

  if (error) {
    throw new Error(error.message || 'Failed to create invoice');
  }

  if (!data.success) {
    const errorResponse = data as ErrorResponse;
    throw new Error(errorResponse.error.message);
  }

  return data as CreateInvoiceResponse;
}

/**
 * Get user's subscription status
 */
export async function getSubscriptionStatus(
  userId: string
): Promise<SubscriptionStatusResponse> {
  const { data, error } = await supabase.functions.invoke('stars-subscription-check', {
    body: { userId },
  });

  if (error) {
    throw new Error(error.message || 'Failed to fetch subscription status');
  }

  if (!data.success) {
    const errorResponse = data as ErrorResponse;
    throw new Error(errorResponse.error.message);
  }

  return data as SubscriptionStatusResponse;
}

/**
 * Get all active products (credits and subscriptions)
 */
export async function getProducts(): Promise<StarsProduct[]> {
  const { data, error } = await supabase
    .from('stars_products')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    throw new Error(error.message || 'Failed to fetch products');
  }

  return data as StarsProduct[];
}

/**
 * Get a specific product by product_code
 */
export async function getProductByCode(
  productCode: string
): Promise<StarsProduct | null> {
  const { data, error } = await supabase
    .from('stars_products')
    .select('*')
    .eq('product_code', productCode)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(error.message || 'Failed to fetch product');
  }

  return data as StarsProduct;
}

/**
 * Get user's payment history with pagination
 */
export async function getPaymentHistory(
  userId: string,
  page: number = 0,
  pageSize: number = 20
): Promise<{
  transactions: StarsTransaction[];
  hasMore: boolean;
}> {
  const from = page * pageSize;
  const to = from + pageSize;

  const { data, error, count } = await supabase
    .from('stars_transactions')
    .select('*, product:stars_products(*)', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to - 1);

  if (error) {
    throw new Error(error.message || 'Failed to fetch payment history');
  }

  return {
    transactions: (data as any[]) || [],
    hasMore: (count || 0) > to,
  };
}

/**
 * Get payment statistics (admin only)
 */
export async function getPaymentStats(
  from?: string,
  to?: string
): Promise<PaymentStatsResponse> {
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);

  const { data, error } = await supabase.functions.invoke(
    `stars-admin-stats?${params.toString()}`,
    {
      method: 'GET',
    }
  );

  if (error) {
    throw new Error(error.message || 'Failed to fetch payment stats');
  }

  if (!data.success) {
    const errorResponse = data as ErrorResponse;
    throw new Error(errorResponse.error.message);
  }

  return data as PaymentStatsResponse;
}

/**
 * Check if a transaction is complete
 */
export async function checkTransactionStatus(
  transactionId: string
): Promise<StarsTransaction | null> {
  const { data, error } = await supabase
    .from('stars_transactions')
    .select('*, product:stars_products(*)')
    .eq('id', transactionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(error.message || 'Failed to check transaction status');
  }

  return data as StarsTransaction;
}

/**
 * Get subscription history for a user
 */
export async function getSubscriptionHistory(
  userId: string,
  limit: number = 10
): Promise<any[]> {
  const { data, error } = await supabase
    .from('subscription_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message || 'Failed to fetch subscription history');
  }

  return data || [];
}

/**
 * Get featured products only
 */
export async function getFeaturedProducts(): Promise<StarsProduct[]> {
  const { data, error } = await supabase
    .from('stars_products')
    .select('*')
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('display_order', { ascending: true });

  if (error) {
    throw new Error(error.message || 'Failed to fetch featured products');
  }

  return data as StarsProduct[];
}

/**
 * Get products by type
 */
export async function getProductsByType(
  type: 'credits' | 'subscription'
): Promise<StarsProduct[]> {
  const { data, error } = await supabase
    .from('stars_products')
    .select('*')
    .eq('is_active', true)
    .eq('product_type', type)
    .order('display_order', { ascending: true });

  if (error) {
    throw new Error(error.message || 'Failed to fetch products');
  }

  return data as StarsProduct[];
}
