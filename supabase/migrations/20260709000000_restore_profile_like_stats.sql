-- Restore profiles.stats_likes_received maintenance (Sprint 050-A3 reconciliation).
--
-- History: 20260703120000 (Sprint 049) and its Lovable copy 20260704014859 both
-- versioned update_track_likes_count() with a profiles.stats_likes_received update.
-- On prod that column was missing (schema drift — it comes from
-- 20251212200000_extend_profiles_social.sql), so every like INSERT/DELETE raised
-- "column does not exist" at runtime. The hotfix 20260704015457 fixed the crash by
-- dropping the profiles update entirely — which silently froze the "likes received"
-- profile stat. This migration reconciles both worlds:
--   1. guarantees the column exists (no-op where 20251212200000 already ran),
--   2. backfills it from actual current likes,
--   3. restores the trigger function with the profiles update included.
-- Verified on a local PG16 replay of the full likes-migration chain.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stats_likes_received integer NOT NULL DEFAULT 0;

-- Backfill from live data: count likes across all tracks owned by each profile.
UPDATE public.profiles p
SET stats_likes_received = COALESCE(sub.cnt, 0)
FROM (
  SELECT t.user_id, count(*) AS cnt
  FROM public.track_likes tl
  JOIN public.tracks t ON t.id = tl.track_id
  GROUP BY t.user_id
) sub
WHERE p.user_id = sub.user_id;

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

COMMENT ON COLUMN public.profiles.stats_likes_received IS 'Denormalized count of likes received across all of the user''s tracks; maintained by update_track_likes_count()';
