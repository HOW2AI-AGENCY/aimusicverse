-- Phase 3: Improve Admin RLS policies for moderation_reports

-- Drop existing permissive policies for moderation_reports
DROP POLICY IF EXISTS "Users can create reports" ON public.moderation_reports;
DROP POLICY IF EXISTS "Users can view own reports" ON public.moderation_reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON public.moderation_reports;
DROP POLICY IF EXISTS "Admins can update reports" ON public.moderation_reports;

-- Create proper RLS policies for moderation_reports

-- Users can create reports (reporter must be authenticated user)
CREATE POLICY "Users can create moderation reports"
ON public.moderation_reports
FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view own moderation reports"
ON public.moderation_reports
FOR SELECT
USING (auth.uid() = reporter_id);

-- Admins and moderators can view all reports
CREATE POLICY "Admins can view all moderation reports"
ON public.moderation_reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'moderator')
  )
);

-- Admins and moderators can update reports (review status)
CREATE POLICY "Admins can update moderation reports"
ON public.moderation_reports
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'moderator')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'moderator')
  )
);

-- Only admins can delete reports
CREATE POLICY "Admins can delete moderation reports"
ON public.moderation_reports
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);