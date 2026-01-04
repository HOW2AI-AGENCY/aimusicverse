
-- Drop existing view and recreate with correct columns
DROP VIEW IF EXISTS public.safe_public_profiles;

CREATE VIEW public.safe_public_profiles AS
SELECT 
  id,
  user_id,
  username,
  display_name,
  photo_url,
  banner_url,
  bio,
  is_public,
  followers_count,
  following_count,
  created_at
FROM public.profiles
WHERE is_public = true;

-- Grant access to authenticated users
GRANT SELECT ON public.safe_public_profiles TO authenticated;
GRANT SELECT ON public.safe_public_profiles TO anon;

-- Drop old functions and recreate with correct signatures
DROP FUNCTION IF EXISTS public.get_safe_public_profile(uuid);
DROP FUNCTION IF EXISTS public.get_safe_public_profiles(uuid[]);

-- Create function to get public profile info without exposing sensitive data
CREATE OR REPLACE FUNCTION public.get_safe_public_profile(profile_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  username text,
  display_name text,
  photo_url text,
  banner_url text,
  bio text,
  is_public boolean,
  followers_count integer,
  following_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.username,
    p.display_name,
    p.photo_url,
    p.banner_url,
    p.bio,
    p.is_public,
    p.followers_count,
    p.following_count
  FROM public.profiles p
  WHERE p.user_id = profile_user_id
    AND p.is_public = true;
$$;

-- Create function to get multiple public profiles at once
CREATE OR REPLACE FUNCTION public.get_safe_public_profiles(user_ids uuid[])
RETURNS TABLE (
  id uuid,
  user_id uuid,
  username text,
  display_name text,
  photo_url text,
  banner_url text,
  bio text,
  is_public boolean,
  followers_count integer,
  following_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.username,
    p.display_name,
    p.photo_url,
    p.banner_url,
    p.bio,
    p.is_public,
    p.followers_count,
    p.following_count
  FROM public.profiles p
  WHERE p.user_id = ANY(user_ids)
    AND p.is_public = true;
$$;

-- Update profiles RLS policy to be more restrictive
DROP POLICY IF EXISTS "Users can view own profile or public info of others" ON public.profiles;

-- New policy: users can only view their own FULL profile (telegram_id protected)
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);
