DROP POLICY IF EXISTS "Track owner can manage tags" ON public.track_tags;

CREATE POLICY "Track owner can manage tags"
ON public.track_tags
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tracks
    WHERE tracks.id = track_tags.track_id
      AND tracks.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tracks
    WHERE tracks.id = track_tags.track_id
      AND tracks.user_id = auth.uid()
  )
);