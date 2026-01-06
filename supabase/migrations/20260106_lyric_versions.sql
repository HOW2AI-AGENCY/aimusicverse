-- Migration: Create lyric_versions table
-- Task: T001 - Lyric version tracking system for Mobile Studio V2
-- Description: Tracks all versions of lyrics with full audit trail for A/B comparison and history

-- Create lyric_versions table
CREATE TABLE public.lyric_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 50000),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_current BOOLEAN NOT NULL DEFAULT false,
  change_summary TEXT,

  -- Constraint: Only one current version per track
  CONSTRAINT unique_current_version_per_track EXCLUDE (track_id WITH =)
    WHERE (is_current = true)
);

-- Create indexes for optimized queries
CREATE INDEX idx_lyric_versions_track_version ON public.lyric_versions(track_id, version_number DESC);
CREATE INDEX idx_lyric_versions_track_current ON public.lyric_versions(track_id, is_current)
  WHERE is_current = true;
CREATE INDEX idx_lyric_versions_author_created ON public.lyric_versions(author_id, created_at DESC);

-- Create trigger to maintain only one current version per track
CREATE OR REPLACE FUNCTION public.ensure_single_current_lyric_version()
RETURNS TRIGGER AS $$
BEGIN
  -- If this version is marked as current, unmark all other versions for this track
  IF NEW.is_current = true THEN
    UPDATE public.lyric_versions
    SET is_current = false
    WHERE track_id = NEW.track_id
      AND id != NEW.id
      AND is_current = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_current_lyric_version
  BEFORE INSERT OR UPDATE OF is_current ON public.lyric_versions
  FOR EACH ROW
  WHEN (NEW.is_current = true)
  EXECUTE FUNCTION public.ensure_single_current_lyric_version();

-- Enable Row Level Security
ALTER TABLE public.lyric_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view lyric versions for own tracks"
  ON public.lyric_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tracks
      WHERE tracks.id = lyric_versions.track_id
      AND tracks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert lyric versions for own tracks"
  ON public.lyric_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tracks
      WHERE tracks.id = lyric_versions.track_id
      AND tracks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update lyric versions for own tracks"
  ON public.lyric_versions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tracks
      WHERE tracks.id = lyric_versions.track_id
      AND tracks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete lyric versions for own tracks"
  ON public.lyric_versions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tracks
      WHERE tracks.id = lyric_versions.track_id
      AND tracks.user_id = auth.uid()
    )
  );

-- Add comments for documentation
COMMENT ON TABLE public.lyric_versions IS 'Tracks all versions of lyrics with full audit trail';
COMMENT ON COLUMN public.lyric_versions.track_id IS 'Reference to the track this lyric belongs to';
COMMENT ON COLUMN public.lyric_versions.version_number IS 'Sequential version number for ordering';
COMMENT ON COLUMN public.lyric_versions.content IS 'Full lyric text (max 50,000 characters)';
COMMENT ON COLUMN public.lyric_versions.author_id IS 'User who created this version';
COMMENT ON COLUMN public.lyric_versions.is_current IS 'Flag indicating this is the active version (only one per track)';
COMMENT ON COLUMN public.lyric_versions.change_summary IS 'Brief description of changes made in this version';
