
-- 1. audio_analysis: convert user_id text -> uuid, recreate policies with direct equality
DROP POLICY IF EXISTS "Users can delete their own audio analysis" ON public.audio_analysis;
DROP POLICY IF EXISTS "Users can update their own audio analysis" ON public.audio_analysis;
DROP POLICY IF EXISTS "Users can view their own audio analysis" ON public.audio_analysis;
DROP POLICY IF EXISTS "Users can insert their own audio analysis" ON public.audio_analysis;

ALTER TABLE public.audio_analysis
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

CREATE POLICY "Users can view their own audio analysis"
  ON public.audio_analysis FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own audio analysis"
  ON public.audio_analysis FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own audio analysis"
  ON public.audio_analysis FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own audio analysis"
  ON public.audio_analysis FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 2. comments: restrict non-moderated visibility to comments on public tracks (or owner)
DROP POLICY IF EXISTS "Anyone can view non-moderated comments" ON public.comments;

CREATE POLICY "View non-moderated comments on public tracks or own"
  ON public.comments FOR SELECT
  USING (
    (is_moderated = false AND EXISTS (
      SELECT 1 FROM public.tracks t
      WHERE t.id = comments.track_id AND t.is_public = true
    ))
    OR auth.uid() = user_id
  );

-- 3. telegram_menu_items: replace permissive public "true" SELECT with authenticated-only read
DROP POLICY IF EXISTS "Service role can read menu items" ON public.telegram_menu_items;

CREATE POLICY "Authenticated users can read menu items"
  ON public.telegram_menu_items FOR SELECT TO authenticated
  USING (true);

-- 4. playlists: ensure is_public default is false (idempotent)
ALTER TABLE public.playlists ALTER COLUMN is_public SET DEFAULT false;
