-- Fix overly permissive INSERT/UPDATE/ALL policies

-- 1. content_audit_log - restrict to authenticated users
DROP POLICY IF EXISTS "Service can insert audit logs" ON public.content_audit_log;
CREATE POLICY "Authenticated users can insert audit logs"
ON public.content_audit_log
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. deeplink_analytics - restrict to authenticated or service
DROP POLICY IF EXISTS "Service can insert deeplink analytics" ON public.deeplink_analytics;
CREATE POLICY "Users can insert own deeplink analytics"
ON public.deeplink_analytics
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 3. performance_metrics - restrict to authenticated users
DROP POLICY IF EXISTS "Authenticated users can insert performance metrics" ON public.performance_metrics;
CREATE POLICY "Authenticated can insert performance metrics"
ON public.performance_metrics
FOR INSERT
TO authenticated
WITH CHECK (true); -- Performance metrics don't have user_id, intentional for monitoring

-- 4. promo_code_usage - restrict to authenticated users
DROP POLICY IF EXISTS "Service can insert promo usage" ON public.promo_code_usage;
CREATE POLICY "Users can insert own promo usage"
ON public.promo_code_usage
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 5. referral_rewards - restrict to service role only (edge functions)
DROP POLICY IF EXISTS "Service can insert referral rewards" ON public.referral_rewards;
-- No public insert policy - only service role can insert via edge functions

-- 6. inline_result_chosen - allow authenticated users
DROP POLICY IF EXISTS "Service can insert inline choices" ON public.inline_result_chosen;
CREATE POLICY "Authenticated users can insert inline choices"
ON public.inline_result_chosen
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);