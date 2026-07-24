WITH primary_versions AS (
  SELECT DISTINCT ON (tv.track_id)
    tv.track_id,
    tv.id AS version_id
  FROM public.track_versions tv
  JOIN public.tracks t ON t.id = tv.track_id
  JOIN public.generation_tasks gt ON gt.track_id = t.id
  WHERE t.status = 'completed'
    AND t.active_version_id IS NULL
    AND tv.audio_url IS NOT NULL
    AND gt.status = 'completed'
  ORDER BY tv.track_id, tv.clip_index ASC NULLS LAST, tv.created_at ASC
), updated_tracks AS (
  UPDATE public.tracks t
  SET active_version_id = pv.version_id,
      updated_at = now()
  FROM primary_versions pv
  WHERE t.id = pv.track_id
  RETURNING t.id, t.active_version_id
)
UPDATE public.track_versions tv
SET is_primary = (tv.id = ut.active_version_id)
FROM updated_tracks ut
WHERE tv.track_id = ut.id
  AND tv.is_primary IS DISTINCT FROM (tv.id = ut.active_version_id);