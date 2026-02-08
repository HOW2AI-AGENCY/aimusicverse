-- Fix permissive RLS policies and add field-level security

-- 1. Create secure view for payment_transactions (hide sensitive fields from client)
CREATE OR REPLACE VIEW public.safe_payment_transactions 
WITH (security_invoker=on) AS
SELECT 
  id,
  user_id,
  gateway,
  product_code,
  amount_cents,
  currency,
  status,
  credits_granted,
  subscription_granted,
  created_at,
  updated_at,
  completed_at,
  subscription_id,
  is_recurrent
  -- Hidden: ip_address, user_agent, gateway_transaction_id, gateway_payment_url, gateway_order_id, error_message, metadata
FROM public.payment_transactions;

-- 2. Create secure view for subscription_history (hide sensitive metadata)
CREATE OR REPLACE VIEW public.safe_subscription_history
WITH (security_invoker=on) AS
SELECT
  id,
  user_id,
  tier,
  action,
  previous_tier,
  expires_at,
  created_at
  -- Hidden: stars_transaction_id, metadata
FROM public.subscription_history;

-- 3. Tighten api_usage_logs policy to service role only
DROP POLICY IF EXISTS "Service role can insert api usage logs" ON public.api_usage_logs;
-- This table should only be written to by service role via edge functions
-- No direct client access needed

-- 4. Tighten cover_thumbnails policies 
DROP POLICY IF EXISTS "Service role can insert thumbnails" ON public.cover_thumbnails;
DROP POLICY IF EXISTS "Service role can update thumbnails" ON public.cover_thumbnails;
DROP POLICY IF EXISTS "Service role can delete thumbnails" ON public.cover_thumbnails;

-- Recreate with proper role-based checks (service_role only)
CREATE POLICY "Backend can insert thumbnails"
ON public.cover_thumbnails FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Backend can update thumbnails" 
ON public.cover_thumbnails FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Backend can delete thumbnails"
ON public.cover_thumbnails FOR DELETE
TO service_role
USING (true);

-- 5. Update rum_metrics to require validation (use actual columns: session_id, page_path)
DROP POLICY IF EXISTS "Allow anonymous RUM inserts" ON public.rum_metrics;
CREATE POLICY "Allow RUM inserts with validation"
ON public.rum_metrics FOR INSERT
WITH CHECK (
  session_id IS NOT NULL 
  AND page_path IS NOT NULL
  AND length(page_path) <= 500
);

-- 6. Grant access to secure views
GRANT SELECT ON public.safe_payment_transactions TO authenticated;
GRANT SELECT ON public.safe_subscription_history TO authenticated;

COMMENT ON VIEW public.safe_payment_transactions IS 'Secure view hiding IP, user agent, and gateway IDs from payment transactions';
COMMENT ON VIEW public.safe_subscription_history IS 'Secure view hiding sensitive metadata from subscription history';