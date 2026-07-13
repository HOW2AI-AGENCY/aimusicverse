-- Restrict referral inserts: users cannot self-grant rewards
DROP POLICY IF EXISTS "Users can insert valid referral" ON public.referrals;
CREATE POLICY "Users can insert valid referral"
ON public.referrals
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = referred_id
  AND referrer_id <> referred_id
  AND EXISTS (
    SELECT 1 FROM public.user_credits uc
    WHERE uc.user_id = referrals.referrer_id
      AND uc.referral_code = referrals.referral_code
  )
  AND COALESCE(reward_granted, false) = false
  AND COALESCE(reward_amount, 0) = 0
  AND COALESCE(status, 'pending') = 'pending'
);

-- Bound discount_applied against the promo code's discount fields
DROP POLICY IF EXISTS "Users can insert own promo usage" ON public.promo_code_usage;
CREATE POLICY "Users can insert own promo usage"
ON public.promo_code_usage
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.promo_codes pc
    WHERE pc.id = promo_code_usage.promo_code_id
      AND pc.is_active = true
      AND (pc.valid_until IS NULL OR pc.valid_until > now())
      AND pc.valid_from <= now()
      AND COALESCE(promo_code_usage.bonus_credits_applied, 0) >= 0
      AND COALESCE(promo_code_usage.bonus_credits_applied, 0) <= COALESCE(pc.bonus_credits, 0)
      AND COALESCE(promo_code_usage.discount_applied, 0) >= 0
      AND COALESCE(promo_code_usage.discount_applied, 0)
          <= GREATEST(COALESCE(pc.discount_stars, 0), COALESCE(pc.discount_percent, 0))
  )
);