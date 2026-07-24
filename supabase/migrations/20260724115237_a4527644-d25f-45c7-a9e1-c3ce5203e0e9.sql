-- Fix missing GRANTs on track_versions (root cause: PostgREST INSERTs from edge functions silently rejected)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.track_versions TO authenticated;
GRANT ALL ON public.track_versions TO service_role;
GRANT SELECT ON public.track_versions TO anon;

-- Add service_role INSERT policy so edge functions (sync-stale-tasks, suno-music-callback) can persist versions.
DROP POLICY IF EXISTS "Service role can manage track versions" ON public.track_versions;
CREATE POLICY "Service role can manage track versions"
ON public.track_versions
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);