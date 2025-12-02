-- Sprint 010 - Helper functions for public content and AI assistant
-- RPC functions for atomic operations

-- Function to increment play count
CREATE OR REPLACE FUNCTION increment_play_count(track_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE tracks 
  SET plays_count = plays_count + 1 
  WHERE id = track_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(track_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE tracks 
  SET views_count = views_count + 1 
  WHERE id = track_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment suggestion usage
CREATE OR REPLACE FUNCTION increment_suggestion_usage(suggestion_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE prompt_suggestions 
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = suggestion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get trending tracks (high engagement in last 7 days)
CREATE OR REPLACE FUNCTION get_trending_tracks(
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  style TEXT,
  cover_url TEXT,
  audio_url TEXT,
  likes_count INTEGER,
  plays_count INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.style,
    t.cover_url,
    t.audio_url,
    t.likes_count,
    t.plays_count,
    t.created_at
  FROM tracks t
  WHERE 
    t.is_public = TRUE
    AND t.created_at >= NOW() - INTERVAL '7 days'
  ORDER BY 
    (t.likes_count * 2 + t.plays_count) DESC,
    t.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION increment_play_count IS 'Atomically increment play count for a track';
COMMENT ON FUNCTION increment_view_count IS 'Atomically increment view count for a track';
COMMENT ON FUNCTION increment_suggestion_usage IS 'Atomically increment usage count for AI suggestions';
COMMENT ON FUNCTION get_trending_tracks IS 'Get trending tracks based on recent engagement';
