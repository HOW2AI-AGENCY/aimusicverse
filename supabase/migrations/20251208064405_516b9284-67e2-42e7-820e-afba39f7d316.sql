-- Fix Security Definer View warning by using SECURITY INVOKER
DROP VIEW IF EXISTS public.public_profile_view;

CREATE VIEW public.public_profile_view 
WITH (security_invoker = true) AS
SELECT 
  id,
  user_id,
  username,
  first_name,
  photo_url,
  is_public
FROM public.profiles
WHERE is_public = true 
   OR EXISTS (SELECT 1 FROM tracks t WHERE t.user_id = profiles.user_id AND t.is_public = true)
   OR EXISTS (SELECT 1 FROM artists a WHERE a.user_id = profiles.user_id AND a.is_public = true);