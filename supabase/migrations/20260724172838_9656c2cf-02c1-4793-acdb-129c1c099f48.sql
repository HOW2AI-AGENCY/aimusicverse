
-- Observability: view for tracks stuck in 'completed' state without audio.
-- If this view ever returns rows in production, either the callback or the
-- recovery worker regressed on Suno field naming — investigate immediately.
CREATE OR REPLACE VIEW public.suno_stuck_completed_tracks AS
SELECT
  t.id AS track_id,
  t.user_id,
  t.title,
  t.status,
  t.audio_url,
  t.cover_url,
  t.active_version_id,
  t.suno_task_id,
  t.created_at,
  t.updated_at,
  (SELECT COUNT(*) FROM public.track_versions v WHERE v.track_id = t.id) AS versions_count
FROM public.tracks t
WHERE t.status = 'completed'
  AND (t.audio_url IS NULL OR t.audio_url = '' OR t.active_version_id IS NULL)
  AND t.provider = 'suno'
  AND t.created_at > now() - interval '30 days';

REVOKE ALL ON public.suno_stuck_completed_tracks FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.suno_stuck_completed_tracks TO service_role;

COMMENT ON VIEW public.suno_stuck_completed_tracks IS
  'Suno tracks marked completed but missing audio_url or active_version_id. Should always be empty; non-empty rows indicate a callback/recovery regression (e.g. field-casing mismatch).';
