-- Fix SECURITY DEFINER view warning - recreate with SECURITY INVOKER
DROP VIEW IF EXISTS public.safe_public_profiles;

CREATE VIEW public.safe_public_profiles 
WITH (security_invoker = true) AS
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
  following_count
FROM public.profiles
WHERE is_public = true;

GRANT SELECT ON public.safe_public_profiles TO anon, authenticated;