-- Phase 3: Database Optimization Indexes
-- Optimized composite indexes for homepage queries

-- Index for public tracks filtered by genre (uses computed_genre)
CREATE INDEX IF NOT EXISTS idx_tracks_public_genre_optimized 
  ON public.tracks(is_public, status, computed_genre, play_count DESC NULLS LAST)
  WHERE is_public = true AND status = 'completed' AND audio_url IS NOT NULL;

-- Index for recent public tracks  
CREATE INDEX IF NOT EXISTS idx_tracks_public_recent
  ON public.tracks(is_public, status, created_at DESC)
  WHERE is_public = true AND status = 'completed' AND audio_url IS NOT NULL;

-- Index for popular public tracks
CREATE INDEX IF NOT EXISTS idx_tracks_public_popular
  ON public.tracks(is_public, status, play_count DESC NULLS LAST)
  WHERE is_public = true AND status = 'completed' AND audio_url IS NOT NULL;