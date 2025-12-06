-- Fix: Security Definer View issue
-- Recreate view with SECURITY INVOKER to use querying user's permissions

DROP VIEW IF EXISTS public.profile_public_info;

CREATE VIEW public.profile_public_info 
WITH (security_invoker = true) AS
SELECT 
  id,
  user_id,
  username,
  photo_url,
  is_public
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.profile_public_info TO anon, authenticated;

COMMENT ON VIEW public.profile_public_info IS 'Public view of profiles with only safe fields (username, photo_url). Use this for displaying creator attribution instead of querying profiles directly.';