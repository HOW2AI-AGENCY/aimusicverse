-- ===========================================
-- PHASE 1: CRITICAL INDEXES
-- ===========================================

-- tracks table - most used queries
CREATE INDEX IF NOT EXISTS idx_tracks_user_created 
  ON public.tracks(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tracks_status_public 
  ON public.tracks(status, is_public) WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_tracks_computed_genre 
  ON public.tracks(computed_genre) WHERE computed_genre IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tracks_active_version 
  ON public.tracks(active_version_id) WHERE active_version_id IS NOT NULL;

-- generation_tasks table
CREATE INDEX IF NOT EXISTS idx_generation_tasks_track_id 
  ON public.generation_tasks(track_id) WHERE track_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_generation_tasks_user_status 
  ON public.generation_tasks(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generation_tasks_suno_task 
  ON public.generation_tasks(suno_task_id) WHERE suno_task_id IS NOT NULL;

-- track_versions table
CREATE INDEX IF NOT EXISTS idx_track_versions_track_primary 
  ON public.track_versions(track_id, is_primary) WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS idx_track_versions_track_created 
  ON public.track_versions(track_id, created_at DESC);

-- track_stems table
CREATE INDEX IF NOT EXISTS idx_track_stems_track_type 
  ON public.track_stems(track_id, stem_type);

CREATE INDEX IF NOT EXISTS idx_track_stems_status 
  ON public.track_stems(status) WHERE status != 'completed';

-- credit_transactions table
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created 
  ON public.credit_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_action 
  ON public.credit_transactions(action_type, created_at DESC);

-- comments table
CREATE INDEX IF NOT EXISTS idx_comments_track_created 
  ON public.comments(track_id, created_at DESC);

-- track_likes table
CREATE INDEX IF NOT EXISTS idx_track_likes_track 
  ON public.track_likes(track_id);

CREATE INDEX IF NOT EXISTS idx_track_likes_user 
  ON public.track_likes(user_id);

-- playlists
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist 
  ON public.playlist_tracks(playlist_id, position);

-- music_projects
CREATE INDEX IF NOT EXISTS idx_music_projects_user_status 
  ON public.music_projects(user_id, status);

-- project_tracks
CREATE INDEX IF NOT EXISTS idx_project_tracks_project_position 
  ON public.project_tracks(project_id, position);