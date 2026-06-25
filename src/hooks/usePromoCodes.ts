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

      // Server-side validation: avoids exposing the promo catalog to clients
      const { data, error } = await supabase.rpc('validate_promo_code', {
        p_code: code,
        p_product_code: productCode,
        p_stars_price: starsPrice,
      });

      if (error) {
        return { valid: false, error: error.message };
      }

      const result = (data ?? {}) as {
        valid: boolean;
        error?: string;
        promo?: PromoCode;
        discount_stars?: number;
        bonus_credits?: number;
        final_price?: number;
      };

      if (!result.valid) {
        return { valid: false, error: result.error ?? 'Промокод недействителен' };
      }

      return {
        valid: true,
        promo: result.promo,
        discount_stars: result.discount_stars ?? 0,
        bonus_credits: result.bonus_credits ?? 0,
        final_price: result.final_price ?? starsPrice,
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
