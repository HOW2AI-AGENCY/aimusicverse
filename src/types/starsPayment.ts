/**
 * TypeScript types for Telegram Stars Payment System
 * Based on contracts/stars-invoice-api.json
 */

// Product Types
export type StarsProductType = 'credits' | 'subscription';
export type StarsProductStatus = 'active' | 'inactive' | 'archived';
export type SubscriptionTier = 'free' | 'pro' | 'premium' | 'enterprise';

// Transaction Types
export type StarsTransactionStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled' 
  | 'refunded';

export type SubscriptionHistoryAction = 
  | 'activated' 
  | 'renewed' 
  | 'cancelled' 
  | 'expired' 
  | 'upgraded' 
  | 'downgraded';

// Database Entities
export interface StarsProduct {
  id: string;
  product_type: StarsProductType;
  product_code: string; // Using product_code (not sku) per existing schema
  name: Record<string, string>; // Multi-language support: { en: "...", ru: "..." }
  description: Record<string, string>;
  price_stars: number;
  price_usd?: number;
  credits_amount?: number | null; // For credit packages
  subscription_tier?: SubscriptionTier | null; // For subscriptions
  subscription_days?: number | null; // For subscriptions
  display_order: number;
  is_featured: boolean;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface StarsTransaction {
  id: string;
  user_id: string;
  product_id: string;
  telegram_payment_charge_id: string; // Using telegram_payment_charge_id per existing schema
  telegram_invoice_payload?: string;
  amount_stars: number;
  amount_usd?: number;
  status: StarsTransactionStatus;
  payment_method: 'telegram_stars';
  telegram_user_id?: number;
  idempotency_key?: string;
  error_message?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  
  // Relations
  product?: StarsProduct;
}

export interface SubscriptionHistory {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  action: SubscriptionHistoryAction;
  stars_transaction_id?: string | null;
  previous_tier?: SubscriptionTier;
  expires_at?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface SubscriptionStatus {
  has_subscription: boolean;
  tier: SubscriptionTier;
  is_active: boolean;
  expires_at: string | null;
  days_remaining: number | null;
  auto_renew?: boolean;
}

// API Request/Response Types (based on contracts/stars-invoice-api.json)

export interface CreateInvoiceRequest {
  productCode: string; // product_code
  userId: string;
  metadata?: {
    source?: 'mini_app' | 'bot' | 'web';
    campaign?: string;
    referrer?: string;
  };
}

export interface CreateInvoiceResponse {
  success: boolean;
  invoiceLink: string;
  invoiceUrl?: string;
  productDetails: {
    name: string;
    description?: string;
    priceStars: number;
    priceUSD?: number;
    creditsAmount?: number;
    subscriptionTier?: SubscriptionTier;
  };
}

export interface SubscriptionStatusResponse {
  success: boolean;
  subscription: SubscriptionStatus;
  user_id: string;
  checked_at: string;
}

export interface PaymentStatsResponse {
  success: boolean;
  period: {
    from: string;
    to: string;
  };
  stats: {
    total_transactions: number;
    completed_transactions: number;
    total_stars_collected: number;
    total_credits_granted: number;
    active_subscriptions: number;
    success_rate: string;
  };
  breakdown: {
    by_product_type: {
      credits: number;
      subscriptions: number;
    };
    by_status: Record<StarsTransactionStatus, number>;
  };
  checked_at: string;
  cached?: boolean;
}

// Error Types
export type PaymentErrorCode = 
  | 'PRODUCT_NOT_FOUND'
  | 'USER_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INVALID_REQUEST'
  | 'INTERNAL_ERROR'
  | 'PAYMENT_FAILED';

export interface PaymentError {
  code: PaymentErrorCode;
  message: string;
  details?: Record<string, any>;
}

export interface ErrorResponse {
  success: false;
  error: PaymentError;
}

// UI State Types
export interface PaymentFlowState {
  step: 'select' | 'invoice' | 'payment' | 'success' | 'error';
  selectedProduct?: StarsProduct;
  invoiceLink?: string;
  error?: PaymentError;
}

// Grouped products for UI display
export interface GroupedProducts {
  credits: StarsProduct[];
  subscriptions: StarsProduct[];
  featured: StarsProduct[];
}
