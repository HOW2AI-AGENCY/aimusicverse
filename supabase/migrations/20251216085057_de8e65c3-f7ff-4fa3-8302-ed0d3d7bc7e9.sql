-- Fix linter: ensure trending_tracks is SECURITY INVOKER
DROP VIEW IF EXISTS public.trending_tracks;

CREATE VIEW public.trending_tracks
WITH (security_invoker = true)
AS
SELECT
  t.id,
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
FROM public.tracks t
JOIN public.profiles p ON p.user_id = t.user_id
WHERE t.is_public = true
  AND t.status = 'completed'
  AND (t.audio_url IS NOT NULL OR t.telegram_file_id IS NOT NULL);
