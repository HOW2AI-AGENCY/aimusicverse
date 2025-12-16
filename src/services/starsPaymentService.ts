/**
 * Stars Payment Service
 * Handles all API calls related to Telegram Stars payments
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  CreateInvoiceRequest,
  CreateInvoiceResponse,
  SubscriptionStatusResponse,
  PaymentStatsResponse,
  ErrorResponse,
} from '@/types/starsPayment';
import type { Json } from '@/integrations/supabase/types';

// Default language for localization
const DEFAULT_LANG = 'ru';

// Parse localized JSON field to string
function parseLocalizedField(value: unknown, fallback: string = ''): string {
  if (!value) return fallback;
  
  // If it's already a plain string, return it
  if (typeof value === 'string') {
    // Try to parse as JSON in case it's a stringified object
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed[DEFAULT_LANG] || parsed['en'] || fallback;
      }
      return value;
    } catch {
      return value;
    }
  }
  
  // If it's an object with language keys
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, string>;
    return obj[DEFAULT_LANG] || obj['en'] || fallback;
  }
  
  return fallback;
}

// Database product type from Supabase (matches actual DB schema)
interface DbStarsProduct {
  id: string;
  product_code: string;
  product_type: string;
  name: unknown; // Can be JSON object or string
  description: unknown | null;
  stars_price: number;
  credits_amount: number | null;
  subscription_days: number | null;
  features: Json | null;
  is_popular: boolean | null;
  sort_order: number | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Client-side product type for UI
export interface StarsProduct {
  id: string;
  product_code: string;
  product_type: 'credits' | 'subscription';
  name: string;
  description: string | null;
  stars_price: number;
  credits_amount: number | null;
  subscription_tier?: string | null;
  subscription_days: number | null;
  features: string[] | null;
  is_popular: boolean;
  is_featured: boolean;
  sort_order: number;
  display_order: number;
  price_stars: number;
  is_active: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

// Map DB product to client product
function mapDbProduct(db: DbStarsProduct): StarsProduct {
  // Parse features - can be array of strings or null
  let features: string[] | null = null;
  if (db.features) {
    if (Array.isArray(db.features)) {
      features = db.features as string[];
    }
  }

  return {
    id: db.id,
    product_code: db.product_code,
    product_type: db.product_type as 'credits' | 'subscription',
    name: parseLocalizedField(db.name, db.product_code),
    description: parseLocalizedField(db.description),
    stars_price: db.stars_price,
    price_stars: db.stars_price, // alias for compatibility
    credits_amount: db.credits_amount,
    subscription_tier: db.product_type === 'subscription' ? db.product_code.replace('sub_', '') : null,
    subscription_days: db.subscription_days,
    features,
    is_popular: db.is_popular ?? false,
    is_featured: db.is_popular ?? false, // use is_popular as is_featured
    sort_order: db.sort_order ?? 0,
    display_order: db.sort_order ?? 0, // alias for compatibility
    is_active: db.status === 'active',
    status: db.status ?? 'active',
    created_at: db.created_at ?? new Date().toISOString(),
    updated_at: db.updated_at ?? new Date().toISOString(),
  };
}

// Transaction type for history
export interface PaymentTransaction {
  id: string;
  product_code: string;
  stars_amount: number;
  status: string;
  created_at: string;
  credits_granted: number | null;
}

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
    .eq('status', 'active')
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(error.message || 'Failed to fetch products');
  }

  return (data || []).map((item) => mapDbProduct(item as unknown as DbStarsProduct));
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
    .eq('status', 'active')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(error.message || 'Failed to fetch product');
  }

  return data ? mapDbProduct(data as unknown as DbStarsProduct) : null;
}

/**
 * Get user's payment history with pagination
 */
export async function getPaymentHistory(
  userId: string,
  page: number = 0,
  pageSize: number = 20
): Promise<{
  transactions: PaymentTransaction[];
  hasMore: boolean;
}> {
  const from = page * pageSize;
  const to = from + pageSize;

  const { data, error, count } = await supabase
    .from('stars_transactions')
    .select('id, product_code, stars_amount, status, created_at, credits_granted', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to - 1);

  if (error) {
    throw new Error(error.message || 'Failed to fetch payment history');
  }

  const transactions: PaymentTransaction[] = (data || []).map((t) => ({
    id: t.id,
    product_code: t.product_code,
    stars_amount: t.stars_amount,
    status: t.status,
    created_at: t.created_at ?? new Date().toISOString(),
    credits_granted: t.credits_granted,
  }));

  return {
    transactions,
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
): Promise<{
  id: string;
  status: string;
  credits_granted: number | null;
} | null> {
  const { data, error } = await supabase
    .from('stars_transactions')
    .select('id, status, credits_granted')
    .eq('id', transactionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(error.message || 'Failed to check transaction status');
  }

  return data;
}

/**
 * Get featured products only
 */
export async function getFeaturedProducts(): Promise<StarsProduct[]> {
  const { data, error } = await supabase
    .from('stars_products')
    .select('*')
    .eq('status', 'active')
    .eq('is_popular', true)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(error.message || 'Failed to fetch featured products');
  }

  return (data || []).map((item) => mapDbProduct(item as unknown as DbStarsProduct));
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
    .eq('status', 'active')
    .eq('product_type', type)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(error.message || 'Failed to fetch products');
  }

  return (data || []).map((item) => mapDbProduct(item as unknown as DbStarsProduct));
}
