-- Fix remaining user-facing INSERT policies

-- 1. track_analytics - allow authenticated users to insert their own analytics
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.track_analytics;
CREATE POLICY "Users can insert track analytics"
ON public.track_analytics
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 2. user_feedback - restrict to authenticated users
DROP POLICY IF EXISTS "Service can insert feedback" ON public.user_feedback;
CREATE POLICY "Users can insert own feedback"
ON public.user_feedback
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. user_analytics_events - restrict to authenticated users
DROP POLICY IF EXISTS "Service can insert analytics events" ON public.user_analytics_events;
CREATE POLICY "Users can insert own analytics events"
ON public.user_analytics_events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Note: Remaining service-level tables (telegram_*, health_alerts, klangio_logs)
-- use service role from edge functions - intentional design