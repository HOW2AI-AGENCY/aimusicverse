WITH affected_tracks AS (
  SELECT DISTINCT t.id AS track_id, t.active_version_id
  FROM public.tracks t
  JOIN public.generation_tasks gt ON gt.track_id = t.id
  WHERE gt.status = 'completed'
    AND t.active_version_id IS NOT NULL
    AND jsonb_typeof(gt.audio_clips) = 'array'
)
UPDATE public.track_versions tv
SET is_primary = (tv.id = at.active_version_id)
FROM affected_tracks at
WHERE tv.track_id = at.track_id
  AND tv.is_primary IS DISTINCT FROM (tv.id = at.active_version_id);