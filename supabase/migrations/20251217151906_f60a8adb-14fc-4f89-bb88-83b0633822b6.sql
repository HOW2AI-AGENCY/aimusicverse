-- Add RLS policy for viewing public profiles (needed for public profile pages)
CREATE POLICY "Anyone can view public profiles" 
ON public.profiles 
FOR SELECT 
USING (is_public = true);

-- Add RLS policy for profiles of users who have public content
CREATE POLICY "Anyone can view profiles of users with public content"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tracks t WHERE t.user_id = profiles.user_id AND t.is_public = true
  ) OR EXISTS (
    SELECT 1 FROM artists a WHERE a.user_id = profiles.user_id AND a.is_public = true
  ) OR EXISTS (
    SELECT 1 FROM music_projects mp WHERE mp.user_id = profiles.user_id AND mp.is_public = true
  )
);