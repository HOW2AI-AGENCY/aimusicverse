
CREATE OR REPLACE FUNCTION public.update_track_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tracks
    SET likes_count = COALESCE(likes_count, 0) + 1
    WHERE id = NEW.track_id;

    UPDATE public.track_versions
    SET likes_count = COALESCE(likes_count, 0) + 1
    WHERE id = NEW.track_version_id;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tracks
    SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
    WHERE id = OLD.track_id;

    UPDATE public.track_versions
    SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
    WHERE id = OLD.track_version_id;

    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
