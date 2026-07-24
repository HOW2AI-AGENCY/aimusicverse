CREATE OR REPLACE FUNCTION public.ensure_track_active_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  selected_version_id uuid;
BEGIN
  IF NEW.active_version_id IS NOT NULL OR NEW.status <> 'completed' THEN
    RETURN NEW;
  END IF;

  SELECT tv.id
  INTO selected_version_id
  FROM public.track_versions tv
  WHERE tv.track_id = NEW.id
    AND tv.audio_url IS NOT NULL
  ORDER BY tv.clip_index ASC NULLS LAST, tv.created_at ASC
  LIMIT 1;

  IF selected_version_id IS NOT NULL THEN
    NEW.active_version_id := selected_version_id;

    UPDATE public.track_versions
    SET is_primary = (id = selected_version_id)
    WHERE track_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_track_active_version() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_track_active_version() TO service_role;

DROP TRIGGER IF EXISTS trg_ensure_track_active_version ON public.tracks;
CREATE TRIGGER trg_ensure_track_active_version
BEFORE UPDATE OF status, active_version_id ON public.tracks
FOR EACH ROW
EXECUTE FUNCTION public.ensure_track_active_version();