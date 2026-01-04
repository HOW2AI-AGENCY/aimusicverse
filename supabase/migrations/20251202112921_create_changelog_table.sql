-- Migration: Create track_changelog table for version change tracking
-- Task: T003 - Create changelog table with proper indexes
-- Note: track_change_log already exists, but track_changelog is more focused on versioning

-- Create track_changelog table (focused on version changes)
CREATE TABLE public.track_changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  version_id UUID REFERENCES public.track_versions(id) ON DELETE SET NULL,
  change_type TEXT NOT NULL CHECK (change_type IN (
    'version_created',
    'master_changed',
    'metadata_updated',
    'stem_generated',
    'cover_updated',
    'lyrics_updated'
  )),
  change_data JSONB NOT NULL DEFAULT '{}',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX idx_changelog_track ON public.track_changelog(track_id, created_at DESC);
CREATE INDEX idx_changelog_user ON public.track_changelog(user_id, created_at DESC);
CREATE INDEX idx_changelog_type ON public.track_changelog(change_type);
CREATE INDEX idx_changelog_version ON public.track_changelog(version_id);

-- Add comments
COMMENT ON TABLE public.track_changelog IS 'Audit log for track and version changes focused on versioning system';
COMMENT ON COLUMN public.track_changelog.change_data IS 'JSON object with old_value, new_value, and optional reason fields';

-- Enable RLS
ALTER TABLE public.track_changelog ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view changelog for own tracks"
  ON public.track_changelog FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tracks
      WHERE tracks.id = track_changelog.track_id
      AND (tracks.user_id = auth.uid() OR tracks.is_public = TRUE)
    )
  );

CREATE POLICY "Users can insert changelog for own tracks"
  ON public.track_changelog FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tracks
      WHERE tracks.id = track_changelog.track_id
      AND tracks.user_id = auth.uid()
    )
  );
