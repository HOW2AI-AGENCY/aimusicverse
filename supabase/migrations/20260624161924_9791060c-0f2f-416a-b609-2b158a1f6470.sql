-- 1. credit_transactions: remove client INSERT policy
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Users can create their own transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Authenticated users can insert credit transactions" ON public.credit_transactions;

-- Ensure service_role can still write
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'credit_transactions'
      AND policyname = 'Service role can manage credit transactions'
  ) THEN
    CREATE POLICY "Service role can manage credit transactions"
      ON public.credit_transactions
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 2. user_credits: remove admin direct UPDATE policy
DROP POLICY IF EXISTS "Admins can update user credits" ON public.user_credits;
DROP POLICY IF EXISTS "Admins can update credits" ON public.user_credits;

-- 3. stars_transactions: remove client INSERT policy
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.stars_transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.stars_transactions;
DROP POLICY IF EXISTS "Users can create own stars transactions" ON public.stars_transactions;

-- Ensure service_role write access for webhook
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'stars_transactions'
      AND policyname = 'Service role can manage stars transactions'
  ) THEN
    CREATE POLICY "Service role can manage stars transactions"
      ON public.stars_transactions
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;