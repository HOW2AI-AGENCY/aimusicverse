-- Drop the trigger that depends on style column
DROP TRIGGER IF EXISTS trg_tracks_inline_fields ON public.tracks;

-- Drop the view that depends on title/style columns
DROP VIEW IF EXISTS public.trending_tracks;

-- Increase title column length for tracks table to handle longer titles
ALTER TABLE public.tracks ALTER COLUMN title TYPE varchar(500);

-- Also increase style column for complex style descriptions
ALTER TABLE public.tracks ALTER COLUMN style TYPE varchar(500);

-- Recreate the trending_tracks view
CREATE OR REPLACE VIEW public.trending_tracks AS
SELECT t.id,
    t.title,
    t.style,
    t.tags,
    COALESCE(t.audio_url, t.telegram_file_id) AS audio_url,
    t.telegram_file_id,
    t.cover_url,
    t.duration_seconds,
    t.created_at,
    t.user_id,
    p.username AS creator_username,
    p.display_name AS creator_name,
    t.computed_genre,
    t.computed_mood,
    t.trending_score,
    t.quality_score
FROM tracks t
JOIN profiles p ON p.user_id = t.user_id
WHERE t.is_public = true 
  AND t.status::text = 'completed'::text 
  AND (t.audio_url IS NOT NULL OR t.telegram_file_id IS NOT NULL);

-- Recreate the trigger
CREATE TRIGGER trg_tracks_inline_fields 
BEFORE INSERT OR UPDATE OF style, tags, likes_count, play_count, created_at 
ON public.tracks 
FOR EACH ROW EXECUTE FUNCTION update_track_inline_fields();