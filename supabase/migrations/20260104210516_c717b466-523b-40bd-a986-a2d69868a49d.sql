-- Add creator_display_name column to tracks table for proper metadata
ALTER TABLE public.tracks 
ADD COLUMN IF NOT EXISTS creator_display_name text;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tracks_creator_display_name ON public.tracks(creator_display_name) WHERE creator_display_name IS NOT NULL;

-- Backfill existing tracks with creator display names from profiles
UPDATE public.tracks t
SET creator_display_name = COALESCE(p.display_name, p.username, p.first_name)
FROM public.profiles p
WHERE t.user_id = p.user_id
AND t.creator_display_name IS NULL;