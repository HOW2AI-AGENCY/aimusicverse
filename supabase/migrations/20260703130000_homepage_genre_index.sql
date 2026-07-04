-- Migration: Composite index for homepage genre queries
--
-- usePublicContentBatch (src/hooks/public-content/usePublicContentBatch.ts) and
-- useInfiniteGenreTracks (src/hooks/useInfiniteGenreTracks.ts) both filter on
-- (is_public, status, computed_genre) and sort by play_count DESC. The existing
-- idx_tracks_public and idx_tracks_popular indexes (20251202112923_add_indexes.sql)
-- don't cover computed_genre, so these queries fall back to a sequential scan
-- filtered by genre as track volume grows.
--
-- NOTE (2026-07-04, Sprint 050-A3): originally CREATE INDEX CONCURRENTLY, which
-- cannot run inside a transaction block — the standard supabase migration runner
-- wraps every file in BEGIN/COMMIT, so a from-scratch replay failed exactly here
-- (verified on a local PG16 replay). The index is small at current data volume and
-- 20260704014859 already ships the identical non-concurrent definition, so plain
-- CREATE INDEX keeps fresh environments working and is a no-op where it exists.
CREATE INDEX IF NOT EXISTS idx_tracks_genre_popular
  ON public.tracks (computed_genre, play_count DESC, created_at DESC)
  WHERE is_public = TRUE AND status = 'completed';

COMMENT ON INDEX idx_tracks_genre_popular IS 'Optimizes homepage genre-filtered popularity queries (usePublicContentBatch, useInfiniteGenreTracks)';
