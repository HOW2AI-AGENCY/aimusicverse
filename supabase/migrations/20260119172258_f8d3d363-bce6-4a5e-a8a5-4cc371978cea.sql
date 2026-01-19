-- Fix RLS policies for cover_thumbnails
-- Only service role (edge functions) should write, not public

-- Drop overly permissive policies
DROP POLICY IF EXISTS "cover_thumbnails_system_write" ON public.cover_thumbnails;
DROP POLICY IF EXISTS "cover_thumbnails_system_update" ON public.cover_thumbnails;

-- No INSERT/UPDATE policies for regular users - only service role can write
-- Edge functions use service_role key which bypasses RLS
-- This is secure because:
-- 1. Regular users (anon/authenticated) cannot INSERT/UPDATE
-- 2. Only backend edge functions with service_role can modify

COMMENT ON TABLE public.cover_thumbnails IS 
  'Pre-generated WebP thumbnails for track covers. Write access restricted to service_role (edge functions only).';