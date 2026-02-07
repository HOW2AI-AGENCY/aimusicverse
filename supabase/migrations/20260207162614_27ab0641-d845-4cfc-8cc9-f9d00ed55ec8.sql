
-- FIX: Security Definer View - change to INVOKER
ALTER VIEW public.safe_public_profiles SET (security_invoker = on);
