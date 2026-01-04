-- Add remix fields to tracks table
ALTER TABLE public.tracks 
ADD COLUMN IF NOT EXISTS parent_track_id UUID REFERENCES public.tracks(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS allow_remix BOOLEAN DEFAULT true;

-- Create index for parent track lookup
CREATE INDEX IF NOT EXISTS idx_tracks_parent_track_id ON public.tracks(parent_track_id);

-- Comment for documentation
COMMENT ON COLUMN public.tracks.parent_track_id IS 'Reference to original track this was remixed from';
COMMENT ON COLUMN public.tracks.allow_remix IS 'Whether other users can create remixes of this track (paid feature)';