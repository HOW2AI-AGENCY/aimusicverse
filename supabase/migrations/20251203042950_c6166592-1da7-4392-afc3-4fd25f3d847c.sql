-- Populate track_versions for existing tracks that don't have versions
INSERT INTO track_versions (track_id, audio_url, cover_url, version_type, is_primary, duration_seconds)
SELECT 
  t.id,
  t.audio_url,
  t.cover_url,
  'initial',
  true,
  t.duration_seconds
FROM tracks t
WHERE t.audio_url IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM track_versions tv WHERE tv.track_id = t.id
);