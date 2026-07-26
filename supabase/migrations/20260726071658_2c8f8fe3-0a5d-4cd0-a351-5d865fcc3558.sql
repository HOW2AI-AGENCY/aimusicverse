CREATE OR REPLACE FUNCTION public.apply_replacement_version(
  p_track_id UUID,
  p_version_id UUID,
  p_audio_url TEXT,
  p_streaming_url TEXT DEFAULT NULL,
  p_cover_url TEXT DEFAULT NULL,
  p_duration_seconds NUMERIC DEFAULT NULL,
  p_suno_id TEXT DEFAULT NULL,
  p_suno_task_id TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_version_id UUID;
BEGIN
  SELECT active_version_id INTO v_old_version_id
  FROM tracks
  WHERE id = p_track_id;

  UPDATE track_versions
  SET is_primary = false
  WHERE track_id = p_track_id;

  UPDATE track_versions
  SET is_primary = true
  WHERE id = p_version_id;

  UPDATE tracks
  SET
    active_version_id = p_version_id,
    audio_url = p_audio_url,
    streaming_url = COALESCE(p_streaming_url, streaming_url),
    cover_url = COALESCE(p_cover_url, cover_url),
    duration_seconds = COALESCE(p_duration_seconds, duration_seconds),
    suno_id = COALESCE(p_suno_id, suno_id),
    suno_task_id = COALESCE(p_suno_task_id, suno_task_id),
    has_stems = false,
    updated_at = now()
  WHERE id = p_track_id;
EXCEPTION
  WHEN OTHERS THEN
    BEGIN
      UPDATE track_versions SET is_primary = false WHERE track_id = p_track_id;
      IF v_old_version_id IS NOT NULL THEN
        UPDATE track_versions SET is_primary = true WHERE id = v_old_version_id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
    RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_replacement_version(UUID, UUID, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_replacement_version(UUID, UUID, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT) TO service_role;

COMMENT ON FUNCTION public.apply_replacement_version IS 'Atomically applies a replacement version to a track: unsets old primary, sets new primary, updates track row — all in one transaction.';