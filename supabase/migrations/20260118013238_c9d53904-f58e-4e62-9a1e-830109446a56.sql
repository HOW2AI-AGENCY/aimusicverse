-- P0: Security Fix - Protect profiles table and track_versions

-- 1. Create safe_public_profiles view that hides telegram_id and telegram_chat_id
DROP VIEW IF EXISTS public.safe_public_profiles;

CREATE VIEW public.safe_public_profiles
WITH (security_invoker = on) AS
SELECT 
  user_id,
  display_name,
  first_name,
  last_name,
  username,
  photo_url,
  banner_url,
  bio,
  is_public,
  created_at,
  followers_count,
  following_count,
  social_links
  -- telegram_id is NOT exposed
  -- telegram_chat_id is NOT exposed
FROM public.profiles;

-- 2. Drop overly permissive profile policies
DROP POLICY IF EXISTS "Anyone can view public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles of users with public content" ON public.profiles;

-- 3. Create more restrictive profile policies
-- Authenticated users can see profiles of users with public content
CREATE POLICY "Authenticated users can view profiles with public content"
ON public.profiles FOR SELECT
USING (
  auth.role() = 'authenticated' AND (
    -- Own profile
    auth.uid() = user_id
    -- Or users who have public content
    OR (is_public = true)
    OR EXISTS (SELECT 1 FROM tracks t WHERE t.user_id = profiles.user_id AND t.is_public = true LIMIT 1)
  )
);

-- 4. Fix track_versions to only expose primary version for public tracks
DROP POLICY IF EXISTS "Users can view own track versions" ON public.track_versions;

-- Owner can see all their versions
CREATE POLICY "Owners can view all their track versions"
ON public.track_versions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tracks 
    WHERE tracks.id = track_versions.track_id 
    AND tracks.user_id = auth.uid()
  )
);

-- Public can only see primary version of public tracks
CREATE POLICY "Public can view only primary versions of public tracks"
ON public.track_versions FOR SELECT
USING (
  track_versions.is_primary = true 
  AND EXISTS (
    SELECT 1 FROM tracks 
    WHERE tracks.id = track_versions.track_id 
    AND tracks.is_public = true
  )
);