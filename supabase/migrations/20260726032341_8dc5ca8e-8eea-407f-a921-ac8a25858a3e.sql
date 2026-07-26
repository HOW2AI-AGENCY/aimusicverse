DROP POLICY IF EXISTS "Users can insert track analytics" ON public.track_analytics;
CREATE POLICY "Users can insert track analytics"
ON public.track_analytics FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.tracks t
    WHERE t.id = track_analytics.track_id
      AND (t.is_public = true OR t.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Anyone can read track tags" ON public.track_tags;
CREATE POLICY "Track tags visible for public or own tracks"
ON public.track_tags FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tracks t
    WHERE t.id = track_tags.track_id
      AND (t.is_public = true OR t.user_id = auth.uid())
  )
);