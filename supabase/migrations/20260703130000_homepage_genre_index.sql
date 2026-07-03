-- Migration: Composite index for homepage genre queries
--
-- usePublicContentBatch (src/hooks/public-content/usePublicContentBatch.ts) and
-- useInfiniteGenreTracks (src/hooks/useInfiniteGenreTracks.ts) both filter on
-- (is_public, status, computed_genre) and sort by play_count DESC. The existing
-- idx_tracks_public and idx_tracks_popular indexes (20251202112923_add_indexes.sql)
-- don't cover computed_genre, so these queries fall back to a sequential scan
-- filtered by genre as track volume grows.
--
-- NOTE: CREATE INDEX CONCURRENTLY cannot run inside a transaction block. If your
-- migration runner wraps files in BEGIN/COMMIT, apply this statement separately
-- (e.g. `psql -f this_file.sql` or `supabase db push` with concurrent-safe mode).
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tracks_genre_popular
  ON public.tracks (computed_genre, play_count DESC, created_at DESC)
  WHERE is_public = TRUE AND status = 'completed';

COMMENT ON INDEX idx_tracks_genre_popular IS 'Optimizes homepage genre-filtered popularity queries (usePublicContentBatch, useInfiniteGenreTracks)';
