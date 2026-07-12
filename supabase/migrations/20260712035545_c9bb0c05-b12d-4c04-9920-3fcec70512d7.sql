
-- economy_config: restrict read to authenticated users
DROP POLICY IF EXISTS "Anyone can read economy config" ON public.economy_config;
CREATE POLICY "Authenticated users can read economy config"
ON public.economy_config FOR SELECT
TO authenticated
USING (true);

-- performance_metrics: add user_id + bind inserts to auth.uid()
ALTER TABLE public.performance_metrics ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
DROP POLICY IF EXISTS "Authenticated users can insert own metrics" ON public.performance_metrics;
CREATE POLICY "Authenticated users can insert own metrics"
ON public.performance_metrics FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- rum_metrics: bind inserted user_id to caller
DROP POLICY IF EXISTS "Authenticated users can insert RUM metrics" ON public.rum_metrics;
CREATE POLICY "Authenticated users can insert RUM metrics"
ON public.rum_metrics FOR INSERT
TO authenticated
WITH CHECK (
  session_id IS NOT NULL
  AND page_path IS NOT NULL
  AND length(page_path) <= 500
  AND (user_id IS NULL OR user_id = auth.uid())
);
