/**
 * Unified Payment Service
 * Facade for accessing both Telegram Stars and Tinkoff card payments
 */

import * as starsService from './starsPaymentService';
import * as tinkoffService from './tinkoffPaymentService';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'PaymentService' });

export type PaymentGateway = 'stars' | 'tinkoff';

export interface UnifiedProduct {
  id: string;
  productCode: string;
  productType: 'credits' | 'subscription';
  name: string;
  description: string | null;
  
  // Prices
  starsPrice: number | null;
  rubPriceKopecks: number | null;
  
  // Product details
  creditsAmount: number | null;
  subscriptionDays: number | null;
  subscriptionTier: string | null;
  
  // Display
  features: string[] | null;
  isPopular: boolean;
  sortOrder: number;
}

/**
 * Convert Stars product to unified format
 */
function fromStarsProduct(p: starsService.StarsProduct): UnifiedProduct {
  return {
    id: p.id,
    productCode: p.product_code,
    productType: p.product_type,
    name: p.name,
    description: p.description,
    starsPrice: p.stars_price,
    rubPriceKopecks: p.price_rub_cents,
    creditsAmount: p.credits_amount,
    subscriptionDays: p.subscription_days,
    subscriptionTier: p.subscription_tier ?? null,
    features: p.features,
    isPopular: p.is_popular,
    sortOrder: p.sort_order,
  };
}

/**
 * Get all available products
 */
export async function getAllProducts(): Promise<UnifiedProduct[]> {
  try {
    const starsProducts = await starsService.getProducts();
    return starsProducts.map(fromStarsProduct);
  } catch (error) {
    log.error('Failed to fetch products', error);
    return [];
  }
}

/**
 * Get product by code
 */
export async function getProduct(productCode: string): Promise<UnifiedProduct | null> {
  try {
    const product = await starsService.getProductByCode(productCode);
    return product ? fromStarsProduct(product) : null;
  } catch (error) {
    log.error('Failed to fetch product', error, { productCode });
    return null;
  }
}

/**
 * Get credit packages only
 */
export async function getCreditPackages(): Promise<UnifiedProduct[]> {
  try {
    const products = await starsService.getProductsByType('credits');
    return products.map(fromStarsProduct);
  } catch (error) {
    log.error('Failed to fetch credit packages', error);
    return [];
  }
}

/**
 * Get subscription products only
 */
export async function getSubscriptions(): Promise<UnifiedProduct[]> {
  try {
    const products = await starsService.getProductsByType('subscription');
    return products.map(fromStarsProduct);
  } catch (error) {
    log.error('Failed to fetch subscriptions', error);
    return [];
  }
}

/**
 * Create payment with specified gateway
 */
export async function createPayment(
  productCode: string,
  gateway: PaymentGateway,
  options?: {
    userId?: string;
    successUrl?: string;
    failUrl?: string;
  }
): Promise<{
  success: boolean;
  paymentUrl?: string;
  invoiceLink?: string;
  transactionId?: string;
  error?: string;
}> {
  try {
    if (gateway === 'tinkoff') {
      const result = await tinkoffService.createTinkoffPayment({
        productCode,
        successUrl: options?.successUrl,
        failUrl: options?.failUrl,
      });
      
      return {
        success: result.success,
        paymentUrl: result.paymentUrl,
        transactionId: result.transactionId,
        error: result.error,
      };
    }
    
    // Stars payment requires userId
    if (!options?.userId) {
      return {
        success: false,
        error: 'User ID is required for Stars payment',
      };
    }
    
    const result = await starsService.createInvoice({ 
      productCode,
      userId: options.userId,
    });
    return {
      success: true,
      invoiceLink: result.invoiceLink,
    };
  } catch (error) {
    log.error('Payment creation failed', error as Error, { productCode, gateway });
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Check if Tinkoff payments are available
 */
export function isTinkoffAvailable(): boolean {
  // Tinkoff is available outside of Telegram
  return typeof window !== 'undefined' && !(window as any).Telegram?.WebApp;
}

/**
 * Check if Stars payments are available
 */
export function isStarsAvailable(): boolean {
  // Stars are only available inside Telegram
  return typeof window !== 'undefined' && !!(window as any).Telegram?.WebApp;
}

/**
 * Get recommended payment gateway
 */
export function getRecommendedGateway(): PaymentGateway {
  return isStarsAvailable() ? 'stars' : 'tinkoff';
}

// Re-export individual services for direct access
export { starsService, tinkoffService };
