
-- Tighten comment_likes SELECT: own likes OR likes on accessible comments (track public or own)
DROP POLICY IF EXISTS "Authenticated users can view comment likes" ON public.comment_likes;
CREATE POLICY "Users view own or accessible comment likes"
ON public.comment_likes
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.comments c
    LEFT JOIN public.tracks t ON t.id = c.track_id
    WHERE c.id = comment_likes.comment_id
      AND (c.user_id = auth.uid() OR t.is_public = true OR t.user_id = auth.uid())
  )
);

-- Tighten track_likes SELECT: own likes OR likes on public/own tracks
DROP POLICY IF EXISTS "Authenticated users can view track likes" ON public.track_likes;
CREATE POLICY "Users view own or public track likes"
ON public.track_likes
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.tracks t
    WHERE t.id = track_likes.track_id
      AND (t.is_public = true OR t.user_id = auth.uid())
  )
);

-- Tighten user_follows SELECT: own follow relationships only
DROP POLICY IF EXISTS "Authenticated users can view follows" ON public.user_follows;
CREATE POLICY "Users view own follow relationships"
ON public.user_follows
FOR SELECT
TO authenticated
USING (auth.uid() = follower_id OR auth.uid() = following_id);
