-- Add write policies for cover_thumbnails (only service role via Edge Functions)
-- The table should only be written by the generate-thumbnails Edge Function

-- Policy: Service role can insert thumbnails (via Edge Function)
CREATE POLICY "Service role can insert thumbnails"
ON public.cover_thumbnails
FOR INSERT
TO service_role
WITH CHECK (true);

-- Policy: Service role can update thumbnails (via Edge Function)
CREATE POLICY "Service role can update thumbnails"
ON public.cover_thumbnails
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Service role can delete thumbnails (cleanup)
CREATE POLICY "Service role can delete thumbnails"
ON public.cover_thumbnails
FOR DELETE
TO service_role
USING (true);

-- Add comment explaining the policies
COMMENT ON TABLE public.cover_thumbnails IS 'Cached thumbnail variants for track covers. Written only by generate-thumbnails Edge Function.';