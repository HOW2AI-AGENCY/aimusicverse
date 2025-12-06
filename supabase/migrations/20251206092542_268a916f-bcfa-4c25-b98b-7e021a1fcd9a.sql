-- Restore profile visibility for public content attribution
-- Users consent to profile sharing when signing up (part of ToS)

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view own profile only" ON public.profiles;

-- Restore policy allowing public profile view for users with public content
CREATE POLICY "Users can view profiles with public content or own"
ON public.profiles
FOR SELECT
USING (
  (auth.uid() = user_id) 
  OR (is_public = true) 
  OR (EXISTS ( SELECT 1 FROM tracks t WHERE t.user_id = profiles.user_id AND t.is_public = true))
  OR (EXISTS ( SELECT 1 FROM artists a WHERE a.user_id = profiles.user_id AND a.is_public = true))
);