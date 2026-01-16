-- Fix: Security Definer View - recreate with SECURITY INVOKER
DROP VIEW IF EXISTS public.safe_public_profiles;

CREATE VIEW public.safe_public_profiles
WITH (security_invoker = true)
AS
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
  followers_count,
  following_count,
  profile_theme,
  social_links,
  subscription_tier,
  created_at
FROM public.profiles
WHERE is_public = true;

-- Grant access to the view
GRANT SELECT ON public.safe_public_profiles TO anon, authenticated;