
-- =====================================================
-- SECURITY FIX: RLS Policy Hardening
-- P0 Critical Security Migration
-- =====================================================

-- 1. FIX: Remove dangerous "Users can update own credits" policy
DROP POLICY IF EXISTS "Users can update own credits" ON public.user_credits;

-- 2. Create secure credit update policy
CREATE POLICY "Only service role can update credits"
ON public.user_credits
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 3. Secure user_credits INSERT
DROP POLICY IF EXISTS "Users can insert own credits" ON public.user_credits;
CREATE POLICY "Service role can insert credits"
ON public.user_credits
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- 4. FIX: Profiles policy
DROP POLICY IF EXISTS "Authenticated users can view profiles with public content" ON public.profiles;

CREATE POLICY "Users can view profiles safely"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id
  OR (
    auth.role() = 'authenticated'
    AND (
      is_public = true 
      OR EXISTS (SELECT 1 FROM tracks t WHERE t.user_id = profiles.user_id AND t.is_public = true LIMIT 1)
    )
  )
);

-- 5. Drop existing view first, then recreate
DROP VIEW IF EXISTS public.safe_public_profiles;

CREATE VIEW public.safe_public_profiles AS
SELECT 
  user_id,
  username,
  display_name,
  photo_url,
  bio,
  is_public,
  followers_count,
  following_count,
  banner_url,
  subscription_tier,
  created_at
FROM public.profiles
WHERE is_public = true 
   OR EXISTS (SELECT 1 FROM tracks t WHERE t.user_id = profiles.user_id AND t.is_public = true LIMIT 1);

GRANT SELECT ON public.safe_public_profiles TO authenticated;
GRANT SELECT ON public.safe_public_profiles TO anon;

-- 6. Cleanup potentially dangerous policies
DROP POLICY IF EXISTS "Anyone can view api usage logs" ON public.api_usage_logs;
DROP POLICY IF EXISTS "Anyone can view payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Anyone can view subscriptions" ON public.tinkoff_subscriptions;

-- 7. Secure credit update function
CREATE OR REPLACE FUNCTION public.secure_credit_update(
  _user_id UUID,
  _amount INTEGER,
  _action_type TEXT,
  _description TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_credits 
  SET 
    balance = balance + _amount,
    total_earned = CASE WHEN _amount > 0 THEN total_earned + _amount ELSE total_earned END,
    total_spent = CASE WHEN _amount < 0 THEN total_spent + ABS(_amount) ELSE total_spent END,
    updated_at = now()
  WHERE user_id = _user_id;
  
  INSERT INTO credit_transactions (user_id, amount, transaction_type, action_type, description)
  VALUES (
    _user_id,
    _amount,
    CASE WHEN _amount > 0 THEN 'credit' ELSE 'debit' END,
    _action_type,
    _description
  );
  
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.secure_credit_update TO authenticated;
GRANT EXECUTE ON FUNCTION public.secure_credit_update TO service_role;
