-- Drop existing view first
DROP VIEW IF EXISTS public.safe_public_profiles;

-- Create restricted public profile view (only safe fields)
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
  following_count
FROM public.profiles
WHERE is_public = true;

-- Grant access to the view
GRANT SELECT ON public.safe_public_profiles TO anon, authenticated;