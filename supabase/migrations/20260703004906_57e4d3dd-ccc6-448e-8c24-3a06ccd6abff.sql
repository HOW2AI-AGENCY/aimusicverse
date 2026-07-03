
-- ============================================================
-- 1) Safe cleanup trigger: never let cleanup errors block INSERT
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_cleanup_track_versions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cleanup_result RECORD;
BEGIN
  BEGIN
    FOR v_cleanup_result IN
      SELECT * FROM cleanup_old_track_versions(NEW.track_id)
    LOOP
      IF v_cleanup_result.deleted_count > 0 THEN
        RAISE LOG 'Auto-cleaned % old versions for track %',
          v_cleanup_result.deleted_count,
          v_cleanup_result.track_id;
      END IF;
    END LOOP;
  EXCEPTION WHEN OTHERS THEN
    -- Never block the INSERT. Record why cleanup failed.
    RAISE WARNING 'auto_cleanup_track_versions failed for track_id=% version_id=%: % (%)',
      NEW.track_id, NEW.id, SQLERRM, SQLSTATE;
    BEGIN
      INSERT INTO public.error_logs (
        error_type, error_message, component, severity, context
      ) VALUES (
        'trigger_error',
        SQLERRM,
        'auto_cleanup_track_versions',
        'error',
        jsonb_build_object(
          'sqlstate', SQLSTATE,
          'track_id', NEW.track_id,
          'version_id', NEW.id,
          'version_label', NEW.version_label,
          'clip_index', NEW.clip_index
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Last-resort: swallow logging failures so the INSERT still succeeds.
      NULL;
    END;
  END;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.auto_cleanup_track_versions() FROM anon, authenticated;

-- ============================================================
-- 2) Safe active-version trigger: same protection
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_active_version_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  BEGIN
    IF NEW.is_primary = true OR NOT EXISTS (
      SELECT 1 FROM public.track_versions
      WHERE track_id = NEW.track_id AND id != NEW.id
    ) THEN
      UPDATE public.tracks
      SET active_version_id = NEW.id,
          audio_url = NEW.audio_url,
          cover_url = COALESCE(NEW.cover_url, cover_url)
      WHERE id = NEW.track_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'set_active_version_on_insert failed for track_id=% version_id=%: % (%)',
      NEW.track_id, NEW.id, SQLERRM, SQLSTATE;
    BEGIN
      INSERT INTO public.error_logs (
        error_type, error_message, component, severity, context
      ) VALUES (
        'trigger_error',
        SQLERRM,
        'set_active_version_on_insert',
        'error',
        jsonb_build_object(
          'sqlstate', SQLSTATE,
          'track_id', NEW.track_id,
          'version_id', NEW.id,
          'version_label', NEW.version_label,
          'clip_index', NEW.clip_index,
          'is_primary', NEW.is_primary
        )
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END;

  RETURN NEW;
END;
$$;

-- ============================================================
-- 3) Backfill function: rebuild missing track_versions from
--    generation_tasks.audio_clips (stored as JSON-encoded string).
-- ============================================================
CREATE OR REPLACE FUNCTION public.backfill_missing_track_versions(
  p_limit INT DEFAULT 500
)
RETURNS TABLE(
  track_id UUID,
  versions_created INT,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  clips JSONB;
  clip JSONB;
  idx INT;
  labels TEXT[] := ARRAY['A','B','C','D','E','F','G','H'];
  v_label TEXT;
  v_created INT;
  v_new_id UUID;
BEGIN
  FOR r IN
    SELECT t.id AS t_id, t.audio_url AS t_audio, gt.audio_clips AS raw_clips
    FROM tracks t
    JOIN generation_tasks gt ON gt.track_id = t.id
    WHERE t.audio_url IS NOT NULL
      AND gt.audio_clips IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM track_versions tv WHERE tv.track_id = t.id)
      AND t.created_at > '2026-02-07'
    ORDER BY t.created_at DESC
    LIMIT p_limit
  LOOP
    v_created := 0;

    -- audio_clips may be stored as a JSON-encoded string OR as a native array
    BEGIN
      IF jsonb_typeof(r.raw_clips) = 'string' THEN
        clips := (r.raw_clips #>> '{}')::jsonb;
      ELSE
        clips := r.raw_clips;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      track_id := r.t_id; versions_created := 0; status := 'parse_error: ' || SQLERRM;
      RETURN NEXT;
      CONTINUE;
    END;

    IF clips IS NULL OR jsonb_typeof(clips) <> 'array' OR jsonb_array_length(clips) = 0 THEN
      track_id := r.t_id; versions_created := 0; status := 'no_clips';
      RETURN NEXT;
      CONTINUE;
    END IF;

    idx := 0;
    FOR clip IN SELECT * FROM jsonb_array_elements(clips)
    LOOP
      v_label := labels[LEAST(idx + 1, array_length(labels, 1))];

      IF COALESCE(clip->>'audio_url', '') = '' THEN
        idx := idx + 1;
        CONTINUE;
      END IF;

      INSERT INTO track_versions (
        track_id, audio_url, cover_url, duration_seconds,
        version_label, clip_index, is_primary,
        source_type, metadata
      ) VALUES (
        r.t_id,
        clip->>'audio_url',
        NULLIF(clip->>'image_url', ''),
        NULLIF(clip->>'duration', '')::NUMERIC::INT,
        v_label,
        idx,
        (idx = 0),  -- clip A becomes primary
        'generated',
        jsonb_build_object(
          'backfilled', true,
          'backfilled_at', now(),
          'suno_clip_id', clip->>'id',
          'title', clip->>'title',
          'model_name', clip->>'model_name'
        )
      ) RETURNING id INTO v_new_id;

      v_created := v_created + 1;
      idx := idx + 1;
    END LOOP;

    track_id := r.t_id;
    versions_created := v_created;
    status := CASE WHEN v_created > 0 THEN 'ok' ELSE 'no_valid_clips' END;
    RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.backfill_missing_track_versions(int) FROM anon, authenticated;
