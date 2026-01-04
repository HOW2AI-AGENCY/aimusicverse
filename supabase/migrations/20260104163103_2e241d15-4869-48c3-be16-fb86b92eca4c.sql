-- ===========================================
-- PHASE 2: ELIMINATE DATA DUPLICATION (FIXED)
-- ===========================================

-- Function to get active audio URL for a track
CREATE OR REPLACE FUNCTION public.get_track_active_audio(p_track_id uuid)
RETURNS TABLE(audio_url text, cover_url text, version_label text) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tv.audio_url,
    tv.cover_url,
    tv.version_label
  FROM public.track_versions tv
  WHERE tv.id = (SELECT t.active_version_id FROM public.tracks t WHERE t.id = p_track_id)
  UNION ALL
  SELECT 
    tv.audio_url,
    tv.cover_url,
    tv.version_label
  FROM public.track_versions tv
  WHERE tv.track_id = p_track_id AND tv.is_primary = true
  AND NOT EXISTS (SELECT 1 FROM public.tracks t WHERE t.id = p_track_id AND t.active_version_id IS NOT NULL)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;

-- View for backward compatibility - uses actual column names
CREATE OR REPLACE VIEW public.tracks_with_active_audio AS
SELECT 
  t.id,
  t.user_id,
  t.title,
  t.prompt,
  t.style,
  t.status,
  t.is_public,
  t.duration_seconds,
  t.created_at,
  t.updated_at,
  t.computed_genre,
  t.computed_mood,
  t.lyrics,
  t.is_instrumental,
  t.active_version_id,
  t.has_stems,
  t.likes_count,
  t.play_count,
  COALESCE(av.audio_url, t.audio_url) as resolved_audio_url,
  COALESCE(av.cover_url, t.cover_url) as resolved_cover_url,
  av.version_label as active_version_label
FROM public.tracks t
LEFT JOIN public.track_versions av ON av.id = t.active_version_id;

-- Ensure active_version_id is populated for tracks with versions
UPDATE public.tracks t
SET active_version_id = (
  SELECT tv.id FROM public.track_versions tv 
  WHERE tv.track_id = t.id AND tv.is_primary = true 
  LIMIT 1
)
WHERE t.active_version_id IS NULL
AND EXISTS (SELECT 1 FROM public.track_versions tv WHERE tv.track_id = t.id);

-- Create trigger to auto-set active_version when first version is created
CREATE OR REPLACE FUNCTION public.set_active_version_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is the first version or marked as primary, update the track
  IF NEW.is_primary = true OR NOT EXISTS (
    SELECT 1 FROM public.track_versions WHERE track_id = NEW.track_id AND id != NEW.id
  ) THEN
    UPDATE public.tracks 
    SET active_version_id = NEW.id,
        audio_url = NEW.audio_url,
        cover_url = COALESCE(NEW.cover_url, cover_url)
    WHERE id = NEW.track_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS trg_set_active_version ON public.track_versions;
CREATE TRIGGER trg_set_active_version
  AFTER INSERT ON public.track_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_active_version_on_insert();