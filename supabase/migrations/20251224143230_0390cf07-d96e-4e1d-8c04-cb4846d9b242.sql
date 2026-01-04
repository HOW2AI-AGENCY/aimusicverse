-- Phase 4: Database Optimization - Add indexes for frequently queried columns

CREATE INDEX IF NOT EXISTS idx_tracks_user_created ON public.tracks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_user_status ON public.generation_tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_time ON public.user_analytics_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_track_likes_track ON public.track_likes(track_id);
CREATE INDEX IF NOT EXISTS idx_comments_track ON public.comments(track_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_playlists_user ON public.playlists(user_id, created_at DESC);