-- Fix function search_path security issue
CREATE OR REPLACE FUNCTION increment_track_share_count(track_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.tracks SET share_count = COALESCE(share_count, 0) + 1 WHERE id = track_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;