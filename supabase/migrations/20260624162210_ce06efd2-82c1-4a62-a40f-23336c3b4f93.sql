-- 1. subscription_history
DROP POLICY IF EXISTS "Users can insert own subscription history" ON public.subscription_history;
DROP POLICY IF EXISTS "Users can insert their own subscription history" ON public.subscription_history;
DROP POLICY IF EXISTS "Users can create subscription history" ON public.subscription_history;
DROP POLICY IF EXISTS "Authenticated users can insert subscription history" ON public.subscription_history;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='subscription_history' AND policyname='Service role can manage subscription history') THEN
    CREATE POLICY "Service role can manage subscription history" ON public.subscription_history FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 2. user_achievements
DROP POLICY IF EXISTS "Users can insert own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can insert their own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can create own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Authenticated users can insert achievements" ON public.user_achievements;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_achievements' AND policyname='Service role can manage user achievements') THEN
    CREATE POLICY "Service role can manage user achievements" ON public.user_achievements FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 3. tinkoff_subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.tinkoff_subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.tinkoff_subscriptions;
DROP POLICY IF EXISTS "Users can read own tinkoff subscriptions" ON public.tinkoff_subscriptions;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tinkoff_subscriptions' AND policyname='Service role can manage tinkoff subscriptions') THEN
    CREATE POLICY "Service role can manage tinkoff subscriptions" ON public.tinkoff_subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE OR REPLACE VIEW public.my_tinkoff_subscriptions
WITH (security_invoker = true) AS
SELECT
  id, user_id, product_code, rebill_id, status,
  amount_cents, currency, billing_cycle_days,
  next_billing_date, last_payment_date,
  created_at, updated_at
FROM public.tinkoff_subscriptions
WHERE user_id = auth.uid();

GRANT SELECT ON public.my_tinkoff_subscriptions TO authenticated;