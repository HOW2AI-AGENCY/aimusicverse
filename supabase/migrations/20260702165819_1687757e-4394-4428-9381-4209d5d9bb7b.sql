
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
CREATE POLICY "Users can update own comments" ON public.comments
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND is_moderated = (SELECT c.is_moderated FROM public.comments c WHERE c.id = comments.id)
);

DROP POLICY IF EXISTS "Users can insert own track logs" ON public.track_change_log;
CREATE POLICY "Users can insert own track logs" ON public.track_change_log
FOR INSERT
WITH CHECK (
  changed_by = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.tracks
    WHERE tracks.id = track_change_log.track_id AND tracks.user_id = auth.uid()
  )
);
