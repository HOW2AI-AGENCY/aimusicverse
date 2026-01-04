-- Drop old restrictive policy
DROP POLICY IF EXISTS "Users can view own or public profiles" ON public.profiles;

-- Create more permissive policy for viewing basic profile info
-- Allows viewing own profile, public profiles, or basic info (username, photo_url) for users who have public content
CREATE POLICY "Users can view profiles with public content or own"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id 
  OR is_public = true
  OR EXISTS (
    SELECT 1 FROM public.tracks t WHERE t.user_id = profiles.user_id AND t.is_public = true
  )
  OR EXISTS (
    SELECT 1 FROM public.artists a WHERE a.user_id = profiles.user_id AND a.is_public = true
  )
);