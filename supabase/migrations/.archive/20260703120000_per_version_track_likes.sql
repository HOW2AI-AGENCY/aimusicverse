-- Rework track_likes to be scoped per track VERSION instead of per track.
--
-- Today a like is keyed only by (user_id, track_id), so liking version A and
-- liking version B of the same track collapse into a single row — switching
-- the active version silently carries the like over (or drops it) with no
-- real per-version semantics. This adds track_version_id as the real scope
-- and keeps track_id as a denormalized, auto-derived column so every
-- existing SELECT/DELETE call site (there are several duplicated ones across
-- the app and the Telegram bot edge functions) keeps working unchanged.

-- 1. Add track_version_id (nullable until backfilled below).
ALTER TABLE public.track_likes
  ADD COLUMN IF NOT EXISTS track_version_id uuid REFERENCES public.track_versions(id) ON DELETE CASCADE;

-- 2. Backfill existing likes onto the track's active version, falling back to
--    its primary version, then to its oldest version, so no existing like is
--    lost even for tracks with unusual/legacy version state.
UPDATE public.track_likes tl
SET track_version_id = COALESCE(
  (SELECT t.active_version_id FROM public.tracks t WHERE t.id = tl.track_id),
  (SELECT tv.id FROM public.track_versions tv WHERE tv.track_id = tl.track_id AND tv.is_primary = true LIMIT 1),
  (SELECT tv.id FROM public.track_versions tv WHERE tv.track_id = tl.track_id ORDER BY tv.created_at ASC LIMIT 1)
)
WHERE tl.track_version_id IS NULL;

-- Likes on tracks with zero versions can't be scoped to a version — these are
-- orphaned/legacy rows (track_versions didn't always exist); drop them rather
-- than blocking the NOT NULL constraint below.
DELETE FROM public.track_likes WHERE track_version_id IS NULL;

ALTER TABLE public.track_likes ALTER COLUMN track_version_id SET NOT NULL;

-- 3. Replace the (user, track) uniqueness with (user, version) — a user can
--    now independently like each version of a track.
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

-- 4. Auto-resolve track_version_id <-> track_id on insert. Callers that
--    already know the exact version (the app's canonical like hook) pass
--    track_version_id directly. Every other existing insert call site only
--    ever sent {user_id, track_id} — for those, resolve to the track's
--    current active/primary version so they keep working without changes,
--    now transparently scoped to whichever version is actually active.
CREATE OR REPLACE FUNCTION public.resolve_track_like_version()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.track_version_id IS NOT NULL THEN
    -- Derive track_id from the version so the two can never disagree.
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

-- 5. Per-version like counter, alongside the existing track-level aggregate
--    (tracks.likes_count keeps meaning "likes across all versions").
ALTER TABLE public.track_versions ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;

-- Backfill counts for existing data.
UPDATE public.track_versions tv
SET likes_count = (SELECT count(*) FROM public.track_likes tl WHERE tl.track_version_id = tv.id);

-- Re-point the existing AFTER INSERT/DELETE trigger's function (same name,
-- same trigger binding from the original migration) to also maintain the
-- new per-version counter.
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
