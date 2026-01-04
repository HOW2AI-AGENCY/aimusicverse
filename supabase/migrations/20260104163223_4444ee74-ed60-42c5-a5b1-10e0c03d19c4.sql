-- ===========================================
-- PHASE 6: SECURITY FIXES
-- ===========================================

-- Fix Security Definer views by recreating with SECURITY INVOKER
-- These views already use proper filtering, just need to ensure INVOKER mode

-- 1. Fix public_profile_view
DROP VIEW IF EXISTS public.public_profile_view;
CREATE VIEW public.public_profile_view 
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  username,
  first_name,
  photo_url,
  is_public
FROM public.profiles
WHERE is_public = true 
   OR EXISTS (SELECT 1 FROM public.tracks t WHERE t.user_id = profiles.user_id AND t.is_public = true)
   OR EXISTS (SELECT 1 FROM public.artists a WHERE a.user_id = profiles.user_id AND a.is_public = true);

-- 2. Fix trending_tracks view
DROP VIEW IF EXISTS public.trending_tracks CASCADE;
CREATE VIEW public.trending_tracks 
WITH (security_invoker = true)
AS
SELECT 
  t.id,
  t.title,
  t.style,
  t.tags,
  COALESCE(t.audio_url, t.telegram_file_id) AS audio_url,
  t.telegram_file_id,
  t.cover_url,
  t.duration_seconds,
  t.created_at,
  t.user_id,
  p.username AS creator_username,
  p.display_name AS creator_name,
  t.computed_genre,
  t.computed_mood,
  t.trending_score,
  t.quality_score
FROM public.tracks t
JOIN public.profiles p ON p.user_id = t.user_id
WHERE t.is_public = true 
  AND t.status = 'completed' 
  AND (t.audio_url IS NOT NULL OR t.telegram_file_id IS NOT NULL);

-- 3. Fix tracks_with_active_audio view
DROP VIEW IF EXISTS public.tracks_with_active_audio;
CREATE VIEW public.tracks_with_active_audio 
WITH (security_invoker = true)
AS
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
  COALESCE(av.audio_url, t.audio_url) AS resolved_audio_url,
  COALESCE(av.cover_url, t.cover_url) AS resolved_cover_url,
  av.version_label AS active_version_label
FROM public.tracks t
LEFT JOIN public.track_versions av ON av.id = t.active_version_id;

-- 4. Fix safe_public_profiles view
DROP VIEW IF EXISTS public.safe_public_profiles;
CREATE VIEW public.safe_public_profiles 
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  username,
  display_name,
  photo_url,
  banner_url,
  bio,
  is_public,
  followers_count,
  following_count
FROM public.profiles
WHERE is_public = true;

-- 5. Fix functions with mutable search_path
-- Fix get_track_active_audio
CREATE OR REPLACE FUNCTION public.get_track_active_audio(p_track_id uuid)
RETURNS TABLE(audio_url text, cover_url text, version_label text)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
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
$$;

-- Fix set_active_version_on_insert trigger function
CREATE OR REPLACE FUNCTION public.set_active_version_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
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
$$;