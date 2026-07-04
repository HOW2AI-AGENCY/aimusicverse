
-- === Per-version track likes ===
ALTER TABLE public.track_likes
  ADD COLUMN IF NOT EXISTS track_version_id uuid REFERENCES public.track_versions(id) ON DELETE CASCADE;

UPDATE public.track_likes tl
SET track_version_id = COALESCE(
  (SELECT t.active_version_id FROM public.tracks t WHERE t.id = tl.track_id),
  (SELECT tv.id FROM public.track_versions tv WHERE tv.track_id = tl.track_id AND tv.is_primary = true LIMIT 1),
  (SELECT tv.id FROM public.track_versions tv WHERE tv.track_id = tl.track_id ORDER BY tv.created_at ASC LIMIT 1)
)
WHERE tl.track_version_id IS NULL;

DELETE FROM public.track_likes WHERE track_version_id IS NULL;

ALTER TABLE public.track_likes ALTER COLUMN track_version_id SET NOT NULL;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.track_likes'::regclass AND contype = 'u'
  LOOP
    EXECUTE format('ALTER TABLE public.track_likes DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.track_likes ADD CONSTRAINT track_likes_user_version_key UNIQUE (user_id, track_version_id);

CREATE INDEX IF NOT EXISTS idx_track_likes_version ON public.track_likes(track_version_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.resolve_track_like_version()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.track_version_id IS NOT NULL THEN
    SELECT track_id INTO NEW.track_id FROM public.track_versions WHERE id = NEW.track_version_id;
    IF NEW.track_id IS NULL THEN
      RAISE EXCEPTION 'track_version_id % does not reference an existing track_versions row', NEW.track_version_id;
    END IF;
  ELSE
    SELECT COALESCE(
      (SELECT t.active_version_id FROM public.tracks t WHERE t.id = NEW.track_id),
      (SELECT tv.id FROM public.track_versions tv WHERE tv.track_id = NEW.track_id AND tv.is_primary = true LIMIT 1),
      (SELECT tv.id FROM public.track_versions tv WHERE tv.track_id = NEW.track_id ORDER BY tv.created_at ASC LIMIT 1)
    ) INTO NEW.track_version_id;
    IF NEW.track_version_id IS NULL THEN
      RAISE EXCEPTION 'Track % has no version to like', NEW.track_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_resolve_track_like_version ON public.track_likes;
CREATE TRIGGER trigger_resolve_track_like_version
  BEFORE INSERT ON public.track_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.resolve_track_like_version();

ALTER TABLE public.track_versions ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;

UPDATE public.track_versions tv
SET likes_count = (SELECT count(*) FROM public.track_likes tl WHERE tl.track_version_id = tv.id);

CREATE OR REPLACE FUNCTION public.update_track_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tracks
    SET likes_count = COALESCE(likes_count, 0) + 1
    WHERE id = NEW.track_id;

    UPDATE public.track_versions
    SET likes_count = COALESCE(likes_count, 0) + 1
    WHERE id = NEW.track_version_id;

    UPDATE public.profiles p
    SET stats_likes_received = stats_likes_received + 1
    FROM public.tracks t
    WHERE t.id = NEW.track_id
    AND p.user_id = t.user_id;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tracks
    SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
    WHERE id = OLD.track_id;

    UPDATE public.track_versions
    SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
    WHERE id = OLD.track_version_id;

    UPDATE public.profiles p
    SET stats_likes_received = GREATEST(stats_likes_received - 1, 0)
    FROM public.tracks t
    WHERE t.id = OLD.track_id
    AND p.user_id = t.user_id;

    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON COLUMN public.track_likes.track_version_id IS 'The specific A/B version this like applies to — likes are scoped per version, not per track';
COMMENT ON COLUMN public.track_versions.likes_count IS 'Denormalized like count for this specific version';

-- === Homepage genre index (non-CONCURRENTLY inside migration transaction) ===
CREATE INDEX IF NOT EXISTS idx_tracks_genre_popular
  ON public.tracks (computed_genre, play_count DESC, created_at DESC)
  WHERE is_public = TRUE AND status = 'completed';

COMMENT ON INDEX public.idx_tracks_genre_popular IS 'Optimizes homepage genre-filtered popularity queries';
