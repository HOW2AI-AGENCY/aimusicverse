-- Fix: Profile PII exposure vulnerability
-- Create a secure view with only public-safe fields for creator attribution

-- Drop view if exists (for idempotency)
DROP VIEW IF EXISTS public.profile_public_info;

-- Create view with only safe public fields
CREATE VIEW public.profile_public_info AS
SELECT 
  id,
  user_id,
  username,
  photo_url,
  is_public
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.profile_public_info TO anon, authenticated;

-- Update RLS policy on profiles table to only allow owners to see full data
-- First drop the existing permissive policy
DROP POLICY IF EXISTS "Users can view profiles with public content or own" ON public.profiles;

-- Create new restrictive policy - only owner can see full profile
CREATE POLICY "Users can view own profile only"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Add comment explaining the security model
COMMENT ON VIEW public.profile_public_info IS 'Public view of profiles with only safe fields (username, photo_url). Use this for displaying creator attribution instead of querying profiles directly.';