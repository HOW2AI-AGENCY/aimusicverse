-- Migration: Add master_version_id to tracks table
-- Task: T001 - Add master version tracking to tracks

-- Add master_version_id column to tracks table
ALTER TABLE public.tracks
ADD COLUMN master_version_id UUID REFERENCES public.track_versions(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_tracks_master_version ON public.tracks(master_version_id);

-- Add comment
COMMENT ON COLUMN public.tracks.master_version_id IS 'References the active/primary version of this track';

-- Note: The master_version_id will be populated in a later migration after version_number and is_master fields are added
