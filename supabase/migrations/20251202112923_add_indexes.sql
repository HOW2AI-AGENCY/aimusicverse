-- Migration: Add performance indexes for versioning and public content queries
-- Task: T005 - Create additional indexes for optimized queries

-- Index for public tracks queries (discovery feature)
CREATE INDEX IF NOT EXISTS idx_tracks_public ON public.tracks(is_public, created_at DESC)
WHERE is_public = TRUE;

-- Index for track status queries
CREATE INDEX IF NOT EXISTS idx_tracks_user_status ON public.tracks(user_id, status);

-- Index for version queries with master flag
CREATE INDEX IF NOT EXISTS idx_versions_track_master ON public.track_versions(track_id, is_master, created_at DESC);

-- Index for version type filtering
CREATE INDEX IF NOT EXISTS idx_versions_type ON public.track_versions(version_type);

-- Index for track stems by type
CREATE INDEX IF NOT EXISTS idx_stems_track_type ON public.track_stems(track_id, stem_type);

-- Composite index for tracks with project association
CREATE INDEX IF NOT EXISTS idx_tracks_user_project ON public.tracks(user_id, project_id);

-- Index for tracks by creation date (for "New Releases" feature)
CREATE INDEX IF NOT EXISTS idx_tracks_created_at ON public.tracks(created_at DESC)
WHERE is_public = TRUE;

-- Index for popular tracks (using play_count)
CREATE INDEX IF NOT EXISTS idx_tracks_popular ON public.tracks(play_count DESC, created_at DESC)
WHERE is_public = TRUE;

-- Add comments
COMMENT ON INDEX idx_tracks_public IS 'Optimizes public track discovery queries';
COMMENT ON INDEX idx_tracks_popular IS 'Optimizes popular tracks queries for homepage';
COMMENT ON INDEX idx_versions_track_master IS 'Optimizes master version lookups';
