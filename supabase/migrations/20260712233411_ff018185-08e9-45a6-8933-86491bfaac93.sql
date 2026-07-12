
-- Tighten promo_code_usage INSERT policy: enforce values match the referenced promo_code
DROP POLICY IF EXISTS "Users can insert own promo usage" ON public.promo_code_usage;
CREATE POLICY "Users can insert own promo usage"
ON public.promo_code_usage
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.promo_codes pc
    WHERE pc.id = promo_code_id
      AND pc.is_active = true
      AND (pc.valid_until IS NULL OR pc.valid_until > now())
      AND pc.valid_from <= now()
      AND COALESCE(bonus_credits_applied, 0) <= COALESCE(pc.bonus_credits, 0)
      AND COALESCE(discount_applied, 0) >= 0
      AND COALESCE(bonus_credits_applied, 0) >= 0
  )
);

-- Tighten referrals INSERT policy: validate that referrer_id owns the referral_code
DROP POLICY IF EXISTS "System can insert referrals" ON public.referrals;
CREATE POLICY "Users can insert valid referral"
ON public.referrals
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = referred_id
  AND referrer_id <> referred_id
  AND EXISTS (
    SELECT 1 FROM public.user_credits uc
    WHERE uc.user_id = referrer_id
      AND uc.referral_code = referrals.referral_code
  )
);
