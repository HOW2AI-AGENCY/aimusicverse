-- Fix the security definer view by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.safe_public_profiles;

CREATE VIEW public.safe_public_profiles 
WITH (security_invoker = on)
AS
SELECT 
  id,
  user_id,
  username,
  first_name,
  photo_url,
  display_name,
  is_public,
  followers_count,
  following_count,
  created_at
FROM public.profiles
WHERE is_public = true;

-- Grant access to the view
GRANT SELECT ON public.safe_public_profiles TO authenticated, anon;