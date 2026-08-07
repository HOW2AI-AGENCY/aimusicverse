-- 1. Explicit public read policies for public asset buckets
DROP POLICY IF EXISTS "Public can read bot assets" ON storage.objects;
CREATE POLICY "Public can read bot assets"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'bot-assets');

DROP POLICY IF EXISTS "Public can read broadcast images" ON storage.objects;
CREATE POLICY "Public can read broadcast images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'broadcast');

-- broadcast bucket was missing an admin update policy for parity with bot-assets
DROP POLICY IF EXISTS "Admins can update broadcast images" ON storage.objects;
CREATE POLICY "Admins can update broadcast images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'broadcast' AND public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'broadcast' AND public.has_role(auth.uid(), 'admin'::app_role));

-- 2. subscription_history: use the canonical has_role() helper, scoped to authenticated
DROP POLICY IF EXISTS "Admins can view all subscription history" ON public.subscription_history;
CREATE POLICY "Admins can view all subscription history"
ON public.subscription_history FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view own subscription history" ON public.subscription_history;
CREATE POLICY "Users can view own subscription history"
ON public.subscription_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3. Explicit service-role management for private voice buckets
DROP POLICY IF EXISTS "Voice sources: service role manage" ON storage.objects;
CREATE POLICY "Voice sources: service role manage"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'voice-sources')
WITH CHECK (bucket_id = 'voice-sources');

DROP POLICY IF EXISTS "Voice verifications: service role manage" ON storage.objects;
CREATE POLICY "Voice verifications: service role manage"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'voice-verifications')
WITH CHECK (bucket_id = 'voice-verifications');