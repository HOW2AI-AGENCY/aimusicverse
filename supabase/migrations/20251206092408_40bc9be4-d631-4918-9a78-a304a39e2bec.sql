-- Fix: Create a security definer function to return only public profile info
-- This allows public access to safe fields while keeping full profile data restricted

-- Drop the view since it won't work with invoker security
DROP VIEW IF EXISTS public.profile_public_info;

-- Create a function that returns only public-safe profile fields
CREATE OR REPLACE FUNCTION public.get_public_profile_info(profile_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  username text,
  photo_url text,
  is_public boolean
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
    p.photo_url,
    p.is_public
  FROM public.profiles p
  WHERE p.user_id = profile_user_id;
$$;

-- Create a function to get multiple public profiles at once (for batch queries)
CREATE OR REPLACE FUNCTION public.get_public_profiles(user_ids uuid[])
RETURNS TABLE (
  id uuid,
  user_id uuid,
  username text,
  photo_url text,
  is_public boolean
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
    p.photo_url,
    p.is_public
  FROM public.profiles p
  WHERE p.user_id = ANY(user_ids);
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_public_profile_info(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) TO anon, authenticated;