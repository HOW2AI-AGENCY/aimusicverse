-- Add lyrics field to project_tracks table (separate from notes)
ALTER TABLE public.project_tracks 
ADD COLUMN IF NOT EXISTS lyrics TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.project_tracks.lyrics IS 'Full song lyrics text, separate from notes field';
COMMENT ON COLUMN public.project_tracks.notes IS 'Production notes, ideas, and comments about the track';