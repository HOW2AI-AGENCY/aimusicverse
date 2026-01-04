/**
 * Multi-gateway payment types
 */

export type PaymentGateway = 'telegram_stars' | 'tinkoff' | 'robokassa';

export type PaymentStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled' 
  | 'refunded';

export interface PaymentMethod {
  gateway: PaymentGateway;
  name: string;
  description: string;
  icon: string;
  available: boolean;
  currencies: string[];
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  gateway: PaymentGateway;
  product_code: string;
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  gateway_transaction_id?: string;
  gateway_payment_url?: string;
  gateway_order_id?: string;
  credits_granted?: number;
  subscription_granted?: string;
  error_message?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface CreatePaymentRequest {
  productCode: string;
  gateway: PaymentGateway;
  successUrl?: string;
  failUrl?: string;
}

export interface CreatePaymentResponse {
  success: boolean;
  transactionId?: string;
  paymentUrl?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  error?: string;
  errorCode?: string;
}

export interface ProductWithPrices {
  id: string;
  product_code: string;
  product_type: 'credits' | 'subscription';
  name: Record<string, string>;
  description?: Record<string, string>;
  price_stars: number;
  price_rub_cents?: number;
  credits_amount?: number;
  subscription_tier?: string;
  subscription_days?: number;
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
}

// Helper to format price in rubles
export function formatRubles(kopecks: number): string {
  const rubles = kopecks / 100;
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rubles);
}

// Helper to format price in stars
export function formatStars(stars: number): string {
  return `⭐ ${stars}`;
}

// Get available payment methods
export function getPaymentMethods(isTelegram: boolean): PaymentMethod[] {
  const methods: PaymentMethod[] = [
    {
      gateway: 'telegram_stars',
      name: 'Telegram Stars',
      description: 'Оплата через Telegram',
      icon: '⭐',
      available: isTelegram,
      currencies: ['XTR'], // Telegram Stars
    },
    {
      gateway: 'tinkoff',
      name: 'Банковская карта',
      description: 'Visa, Mastercard, МИР',
      icon: '💳',
      available: true,
      currencies: ['RUB'],
    },
  ];

  return methods.filter(m => m.available);
}
