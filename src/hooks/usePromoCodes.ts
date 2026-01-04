/**
 * usePromoCodes Hook
 * Manages promo code validation and application
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface PromoCode {
  id: string;
  code: string;
  discount_percent: number | null;
  discount_stars: number | null;
  bonus_credits: number;
  max_uses: number | null;
  current_uses: number;
  max_uses_per_user: number;
  valid_from: string;
  valid_until: string | null;
  product_codes: string[];
  min_purchase_stars: number;
  is_active: boolean;
}

export interface PromoValidation {
  valid: boolean;
  promo?: PromoCode;
  discount_stars?: number;
  bonus_credits?: number;
  final_price?: number;
  error?: string;
}

// Query keys
export const promoKeys = {
  all: ['promo-codes'] as const,
  validate: (code: string, productCode: string) => 
    [...promoKeys.all, 'validate', code, productCode] as const,
};

/**
 * Validate a promo code for a specific product
 */
export function useValidatePromoCode() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      code, 
      productCode, 
      starsPrice 
    }: { 
      code: string; 
      productCode: string; 
      starsPrice: number;
    }): Promise<PromoValidation> => {
      if (!user?.id) {
        return { valid: false, error: 'Требуется авторизация' };
      }

      // Fetch promo code
      const { data: promo, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !promo) {
        return { valid: false, error: 'Промокод не найден' };
      }

      // Check validity period
      const now = new Date();
      if (promo.valid_from && new Date(promo.valid_from) > now) {
        return { valid: false, error: 'Промокод ещё не активен' };
      }
      if (promo.valid_until && new Date(promo.valid_until) < now) {
        return { valid: false, error: 'Промокод истёк' };
      }

      // Check max uses
      if (promo.max_uses && (promo.current_uses ?? 0) >= promo.max_uses) {
        return { valid: false, error: 'Промокод исчерпан' };
      }

      // Check user usage limit
      const { count: userUsage } = await supabase
        .from('promo_code_usage')
        .select('*', { count: 'exact', head: true })
        .eq('promo_code_id', promo.id)
        .eq('user_id', user.id);

      const maxUsesPerUser = promo.max_uses_per_user ?? 1;
      if (userUsage && userUsage >= maxUsesPerUser) {
        return { valid: false, error: 'Вы уже использовали этот промокод' };
      }

      // Check product restrictions
      const productCodes = promo.product_codes ?? [];
      if (productCodes.length > 0 && !productCodes.includes(productCode)) {
        return { valid: false, error: 'Промокод не применим к этому продукту' };
      }

      // Check minimum purchase
      const minPurchase = promo.min_purchase_stars ?? 0;
      if (starsPrice < minPurchase) {
        return { 
          valid: false, 
          error: `Минимальная сумма покупки: ${minPurchase} Stars` 
        };
      }

      // Calculate discount
      let discountStars = 0;
      if (promo.discount_percent) {
        discountStars = Math.floor(starsPrice * (promo.discount_percent / 100));
      } else if (promo.discount_stars) {
        discountStars = Math.min(promo.discount_stars, starsPrice - 1);
      }

      const promoResult: PromoCode = {
        id: promo.id,
        code: promo.code,
        discount_percent: promo.discount_percent,
        discount_stars: promo.discount_stars,
        bonus_credits: promo.bonus_credits ?? 0,
        max_uses: promo.max_uses,
        current_uses: promo.current_uses ?? 0,
        max_uses_per_user: maxUsesPerUser,
        valid_from: promo.valid_from ?? '',
        valid_until: promo.valid_until,
        product_codes: productCodes,
        min_purchase_stars: minPurchase,
        is_active: promo.is_active ?? true,
      };

      return {
        valid: true,
        promo: promoResult,
        discount_stars: discountStars,
        bonus_credits: promo.bonus_credits ?? 0,
        final_price: starsPrice - discountStars,
      };
    },
  });
}

/**
 * Apply promo code to a transaction
 */
export function useApplyPromoCode() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      promoCodeId,
      transactionId,
      discountApplied,
      bonusCreditsApplied,
    }: {
      promoCodeId: string;
      transactionId: string;
      discountApplied: number;
      bonusCreditsApplied: number;
    }) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Record usage
      const { error: usageError } = await supabase
        .from('promo_code_usage')
        .insert({
          promo_code_id: promoCodeId,
          user_id: user.id,
          transaction_id: transactionId,
          discount_applied: discountApplied,
          bonus_credits_applied: bonusCreditsApplied,
        });

      if (usageError) {
        throw new Error(usageError.message);
      }

      // Increment usage count directly
      const { data: promo } = await supabase
        .from('promo_codes')
        .select('current_uses')
        .eq('id', promoCodeId)
        .single();

      await supabase
        .from('promo_codes')
        .update({ current_uses: (promo?.current_uses ?? 0) + 1 })
        .eq('id', promoCodeId);

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promoKeys.all });
    },
    onError: (error: Error) => {
      toast.error('Ошибка применения промокода', { description: error.message });
    },
  });
}
