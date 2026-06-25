
-- 1) payment_transactions: revoke column-level SELECT on PII from authenticated/anon
REVOKE SELECT (ip_address, user_agent) ON public.payment_transactions FROM authenticated;
REVOKE SELECT (ip_address, user_agent) ON public.payment_transactions FROM anon;
-- service_role keeps full access via GRANT ALL

-- 2) rum_metrics: require authenticated for inserts
DROP POLICY IF EXISTS "Allow RUM inserts with validation" ON public.rum_metrics;
CREATE POLICY "Authenticated users can insert RUM metrics"
ON public.rum_metrics
FOR INSERT
TO authenticated
WITH CHECK (
  session_id IS NOT NULL
  AND page_path IS NOT NULL
  AND length(page_path) <= 500
);

-- 3) telemetry_events: require authenticated and bind to auth.uid()
DROP POLICY IF EXISTS "Users can insert their own telemetry" ON public.telemetry_events;
CREATE POLICY "Authenticated users insert own telemetry"
ON public.telemetry_events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
