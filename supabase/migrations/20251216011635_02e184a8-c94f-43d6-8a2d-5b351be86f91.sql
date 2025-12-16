
-- Add project_track_id to link generated tracks to their plan slots
ALTER TABLE public.tracks 
ADD COLUMN IF NOT EXISTS project_track_id UUID REFERENCES public.project_tracks(id) ON DELETE SET NULL;

-- Add is_approved flag for track approval workflow
ALTER TABLE public.tracks 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

-- Add approval_date for tracking when track was approved
ALTER TABLE public.tracks 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Add approved_by for tracking who approved
ALTER TABLE public.tracks 
ADD COLUMN IF NOT EXISTS approved_by UUID;

-- Add is_master flag to mark the selected version for project
ALTER TABLE public.tracks 
ADD COLUMN IF NOT EXISTS is_master BOOLEAN DEFAULT false;

-- Create index for efficient project track queries
CREATE INDEX IF NOT EXISTS idx_tracks_project_track_id ON public.tracks(project_track_id);
CREATE INDEX IF NOT EXISTS idx_tracks_project_id ON public.tracks(project_id);

-- Update music_projects with publishing workflow
ALTER TABLE public.music_projects 
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.music_projects 
ADD COLUMN IF NOT EXISTS published_by UUID;

-- Add approved_tracks_count for tracking progress
ALTER TABLE public.music_projects 
ADD COLUMN IF NOT EXISTS approved_tracks_count INTEGER DEFAULT 0;

-- Add total_tracks_count for project overview
ALTER TABLE public.music_projects 
ADD COLUMN IF NOT EXISTS total_tracks_count INTEGER DEFAULT 0;

-- Comment for documentation
COMMENT ON COLUMN public.tracks.project_track_id IS 'Links generated track to its project track plan slot';
COMMENT ON COLUMN public.tracks.is_approved IS 'Whether track is approved for final project';
COMMENT ON COLUMN public.tracks.is_master IS 'Whether this is the master/final version for project';
COMMENT ON COLUMN public.music_projects.published_at IS 'When project was published';
