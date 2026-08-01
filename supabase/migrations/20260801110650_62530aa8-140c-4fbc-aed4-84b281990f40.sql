-- moderation_reports: use has_role() helper, scope to authenticated
DROP POLICY IF EXISTS "Admins can view all moderation reports" ON public.moderation_reports;
DROP POLICY IF EXISTS "Admins can update moderation reports" ON public.moderation_reports;
DROP POLICY IF EXISTS "Admins can delete moderation reports" ON public.moderation_reports;
DROP POLICY IF EXISTS "Users can view own moderation reports" ON public.moderation_reports;
DROP POLICY IF EXISTS "Users can create moderation reports" ON public.moderation_reports;

CREATE POLICY "Staff can view all moderation reports"
ON public.moderation_reports FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Staff can update moderation reports"
ON public.moderation_reports FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins can delete moderation reports"
ON public.moderation_reports FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own moderation reports"
ON public.moderation_reports FOR SELECT TO authenticated
USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create moderation reports"
ON public.moderation_reports FOR INSERT TO authenticated
WITH CHECK (auth.uid() = reporter_id);

-- user_analytics_events: de-duplicate policies
DROP POLICY IF EXISTS "Admins can view all analytics" ON public.user_analytics_events;
DROP POLICY IF EXISTS "Admins can view all analytics events" ON public.user_analytics_events;
DROP POLICY IF EXISTS "Users can view own analytics" ON public.user_analytics_events;
DROP POLICY IF EXISTS "Users can view own analytics events" ON public.user_analytics_events;
DROP POLICY IF EXISTS "Allow analytics insert for all users" ON public.user_analytics_events;
DROP POLICY IF EXISTS "Users can insert own analytics events" ON public.user_analytics_events;

CREATE POLICY "Admins can view all analytics events"
ON public.user_analytics_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own analytics events"
ON public.user_analytics_events FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics events"
ON public.user_analytics_events FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);