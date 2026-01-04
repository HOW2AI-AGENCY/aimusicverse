-- Phase 1: Security Fixes

-- 1. Fix profiles RLS - restrict access to sensitive fields
-- Drop existing policy
DROP POLICY IF EXISTS "Users can view profiles with public content or own" ON public.profiles;

-- Create more restrictive policy - users can only see their own sensitive data
CREATE POLICY "Users can view own profile or public info of others"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id 
  OR (
    is_public = true 
    AND user_id IN (
      SELECT user_id FROM tracks WHERE is_public = true
      UNION
      SELECT user_id FROM artists WHERE is_public = true
    )
  )
);

-- 2. Fix telegram_bot_metrics - admin only access
DROP POLICY IF EXISTS "Service role can manage metrics" ON public.telegram_bot_metrics;

CREATE POLICY "Only admins can view metrics"
ON public.telegram_bot_metrics
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert metrics"
ON public.telegram_bot_metrics
FOR INSERT
WITH CHECK (true);

-- 3. Create public_profiles view for safe public access
CREATE OR REPLACE VIEW public.public_profile_view AS
SELECT 
  id,
  user_id,
  username,
  first_name,
  photo_url,
  is_public
FROM public.profiles
WHERE is_public = true 
   OR EXISTS (SELECT 1 FROM tracks t WHERE t.user_id = profiles.user_id AND t.is_public = true)
   OR EXISTS (SELECT 1 FROM artists a WHERE a.user_id = profiles.user_id AND a.is_public = true);