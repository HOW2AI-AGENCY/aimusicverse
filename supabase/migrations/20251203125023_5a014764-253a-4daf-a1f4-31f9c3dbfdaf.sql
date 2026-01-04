-- Add artist reference fields to tracks table
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS artist_id uuid REFERENCES public.artists(id) ON DELETE SET NULL;
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS artist_name varchar(255);
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS artist_avatar_url text;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_tracks_artist_id ON public.tracks(artist_id);