DROP POLICY IF EXISTS "cover_thumbnails_public_read" ON public.cover_thumbnails;

CREATE POLICY "cover_thumbnails_public_read"
ON public.cover_thumbnails
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tracks t
    WHERE t.id = cover_thumbnails.track_id
      AND t.is_public = true
  )
);

CREATE POLICY "cover_thumbnails_owner_read"
ON public.cover_thumbnails
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tracks t
    WHERE t.id = cover_thumbnails.track_id
      AND t.user_id = auth.uid()
  )
);