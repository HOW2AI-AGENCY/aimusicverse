-- Atomic replace-section version application.
-- Replaces 3 separate UPDATEs in replace.ts that could leave the
-- database in an inconsistent state if any step fails.
--
-- Usage: SELECT apply_replacement_version(
--   p_track_id,        -- the track being updated
--   p_version_id,      -- the new primary version
--   p_audio_url,       -- audio URL from the new version
--   p_streaming_url,   -- streaming audio URL (nullable)
--   p_cover_url,       -- cover URL (nullable)
--   p_duration_seconds,-- duration (nullable, seconds)
--   p_suno_id,         -- Suno clip ID
--   p_suno_task_id     -- Suno task ID
-- );

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
  -- Save the current primary version for rollback in case of error
  SELECT active_version_id INTO v_old_version_id
  FROM tracks
  WHERE id = p_track_id;

  -- Step 1: Unset primary on all versions of this track
  UPDATE track_versions
  SET is_primary = false
  WHERE track_id = p_track_id;

  -- Step 2: Set the selected version as primary
  UPDATE track_versions
  SET is_primary = true
  WHERE id = p_version_id;

  -- Step 3: Update the track row
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

  -- If any step above fails, the entire transaction rolls back
  -- automatically (Postgres atomicity).
EXCEPTION
  WHEN OTHERS THEN
    -- Attempt best-effort rollback of is_primary
    BEGIN
      UPDATE track_versions SET is_primary = false WHERE track_id = p_track_id;
      IF v_old_version_id IS NOT NULL THEN
        UPDATE track_versions SET is_primary = true WHERE id = v_old_version_id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Nothing we can do at this point — log is handled by the caller
      NULL;
    END;
    RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_replacement_version(UUID, UUID, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_replacement_version(UUID, UUID, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT) TO service_role;

COMMENT ON FUNCTION public.apply_replacement_version IS 'Atomically applies a replacement version to a track: unsets old primary, sets new primary, updates track row — all in one transaction.';
