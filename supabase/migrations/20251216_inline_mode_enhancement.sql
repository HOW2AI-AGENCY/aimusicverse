-- Inline Mode Enhancement Migration
-- Date: 2025-12-16
-- Purpose: Add support for public content, categories, and improved search

-- 1. Trending tracks materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS trending_tracks AS
SELECT 
  t.id,
  t.title,
  t.style,
  t.tags,
  t.audio_url,
  t.cover_art_url,
  t.duration,
  t.created_at,
  t.user_id,
  p.username as creator_username,
  p.display_name as creator_name,
  -- Trending score calculation
  COALESCE(
    (SELECT COUNT(*) FROM track_listens WHERE track_id = t.id AND created_at > NOW() - INTERVAL '7 days'), 0
  ) * 2 +
  COALESCE(
    (SELECT COUNT(*) FROM track_likes WHERE track_id = t.id AND created_at > NOW() - INTERVAL '7 days'), 0
  ) * 5 +
  COALESCE(
    (SELECT COUNT(*) FROM track_shares WHERE track_id = t.id AND created_at > NOW() - INTERVAL '7 days'), 0
  ) * 10 AS trending_score
FROM tracks t
LEFT JOIN profiles p ON t.user_id = p.user_id
WHERE 
  t.status = 'completed'
  AND t.is_public = true
  AND t.audio_url IS NOT NULL
  AND t.created_at > NOW() - INTERVAL '30 days'
ORDER BY trending_score DESC
LIMIT 100;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_trending_tracks_id ON trending_tracks(id);
CREATE INDEX IF NOT EXISTS idx_trending_tracks_score ON trending_tracks(trending_score DESC);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_trending_tracks()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY trending_tracks;
END;
$$ LANGUAGE plpgsql;

-- 2. Genre extraction function
CREATE OR REPLACE FUNCTION extract_genre(track_style TEXT, track_tags TEXT)
RETURNS TEXT AS $$
DECLARE
  genre_keywords JSONB := '{
    "rock": ["rock", "punk", "metal", "indie rock", "alternative"],
    "pop": ["pop", "pop rock", "synthpop", "dance pop"],
    "hip-hop": ["hip hop", "hip-hop", "rap", "trap", "drill"],
    "electronic": ["electronic", "edm", "house", "techno", "dubstep", "trance"],
    "jazz": ["jazz", "bebop", "smooth jazz", "fusion"],
    "classical": ["classical", "orchestra", "symphony", "chamber"],
    "r&b": ["r&b", "rnb", "soul", "funk"],
    "country": ["country", "folk", "americana", "bluegrass"],
    "latin": ["latin", "reggaeton", "salsa", "bachata", "cumbia"],
    "blues": ["blues", "delta blues", "chicago blues"]
  }'::JSONB;
  search_text TEXT;
  genre TEXT;
  keywords TEXT[];
  keyword TEXT;
BEGIN
  search_text := LOWER(COALESCE(track_style, '') || ' ' || COALESCE(track_tags, ''));
  
  -- Check each genre
  FOR genre IN SELECT jsonb_object_keys(genre_keywords) LOOP
    keywords := ARRAY(SELECT jsonb_array_elements_text(genre_keywords->genre));
    FOREACH keyword IN ARRAY keywords LOOP
      IF search_text LIKE '%' || keyword || '%' THEN
        RETURN genre;
      END IF;
    END LOOP;
  END LOOP;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add computed genre column
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS computed_genre TEXT GENERATED ALWAYS AS (
  extract_genre(style, tags)
) STORED;

CREATE INDEX IF NOT EXISTS idx_tracks_computed_genre ON tracks(computed_genre) WHERE computed_genre IS NOT NULL;

-- 3. Mood detection function
CREATE OR REPLACE FUNCTION extract_mood(track_style TEXT, track_tags TEXT)
RETURNS TEXT AS $$
DECLARE
  mood_keywords JSONB := '{
    "happy": ["happy", "upbeat", "cheerful", "joyful", "energetic", "bright"],
    "sad": ["sad", "melancholic", "emotional", "dark", "gloomy", "somber"],
    "chill": ["chill", "relaxing", "calm", "peaceful", "ambient", "mellow"],
    "energetic": ["energetic", "powerful", "intense", "aggressive", "fast", "upbeat"],
    "romantic": ["romantic", "love", "tender", "soft", "gentle", "intimate"]
  }'::JSONB;
  search_text TEXT;
  mood TEXT;
  keywords TEXT[];
  keyword TEXT;
BEGIN
  search_text := LOWER(COALESCE(track_style, '') || ' ' || COALESCE(track_tags, ''));
  
  FOR mood IN SELECT jsonb_object_keys(mood_keywords) LOOP
    keywords := ARRAY(SELECT jsonb_array_elements_text(mood_keywords->mood));
    FOREACH keyword IN ARRAY keywords LOOP
      IF search_text LIKE '%' || keyword || '%' THEN
        RETURN mood;
      END IF;
    END LOOP;
  END LOOP;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add computed mood column
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS computed_mood TEXT GENERATED ALWAYS AS (
  extract_mood(style, tags)
) STORED;

CREATE INDEX IF NOT EXISTS idx_tracks_computed_mood ON tracks(computed_mood) WHERE computed_mood IS NOT NULL;

-- 4. Full-text search configuration
-- Add tsvector column for better search
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('russian', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('russian', COALESCE(style, '')), 'B') ||
  setweight(to_tsvector('russian', COALESCE(tags, '')), 'C')
) STORED;

CREATE INDEX IF NOT EXISTS idx_tracks_search_vector ON tracks USING gin(search_vector);

-- 5. Inline search history table
CREATE TABLE IF NOT EXISTS inline_search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_user_id BIGINT NOT NULL,
  query TEXT NOT NULL,
  category TEXT,
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inline_search_history_user ON inline_search_history(telegram_user_id, created_at DESC);
CREATE INDEX idx_inline_search_history_query ON inline_search_history(query);

-- Enable RLS
ALTER TABLE inline_search_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own search history"
  ON inline_search_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert search history"
  ON inline_search_history FOR INSERT
  WITH CHECK (true);

-- 6. Add indexes for public track queries
CREATE INDEX IF NOT EXISTS idx_tracks_public_created ON tracks(is_public, created_at DESC) WHERE is_public = true AND status = 'completed';
CREATE INDEX IF NOT EXISTS idx_tracks_public_genre ON tracks(computed_genre, created_at DESC) WHERE is_public = true AND computed_genre IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tracks_public_mood ON tracks(computed_mood, created_at DESC) WHERE is_public = true AND computed_mood IS NOT NULL;

-- 7. Function to get featured tracks (manually curated or high quality)
CREATE OR REPLACE FUNCTION get_featured_tracks(limit_count INTEGER DEFAULT 20, offset_count INTEGER DEFAULT 0)
RETURNS TABLE (
  id UUID,
  title TEXT,
  style TEXT,
  tags TEXT,
  audio_url TEXT,
  cover_art_url TEXT,
  duration NUMERIC,
  created_at TIMESTAMPTZ,
  user_id UUID,
  creator_username TEXT,
  creator_name TEXT,
  quality_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.style,
    t.tags,
    t.audio_url,
    t.cover_art_url,
    t.duration,
    t.created_at,
    t.user_id,
    p.username,
    p.display_name,
    -- Quality score based on engagement
    (
      COALESCE((SELECT COUNT(*)::NUMERIC FROM track_likes WHERE track_id = t.id), 0) * 2 +
      COALESCE((SELECT COUNT(*)::NUMERIC FROM track_listens WHERE track_id = t.id), 0) * 0.1 +
      COALESCE((SELECT COUNT(*)::NUMERIC FROM track_shares WHERE track_id = t.id), 0) * 5
    ) AS quality_score
  FROM tracks t
  LEFT JOIN profiles p ON t.user_id = p.user_id
  WHERE 
    t.status = 'completed'
    AND t.is_public = true
    AND t.audio_url IS NOT NULL
    -- Basic quality filters
    AND t.duration > 10 -- At least 10 seconds
    AND t.title IS NOT NULL
  ORDER BY quality_score DESC, t.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- 8. Refresh trending tracks on schedule (call from cron or manually)
-- Initial refresh
SELECT refresh_trending_tracks();

-- Comments
COMMENT ON MATERIALIZED VIEW trending_tracks IS 'Trending tracks based on engagement in last 7 days, refreshed periodically';
COMMENT ON FUNCTION extract_genre IS 'Extracts primary genre from track style and tags';
COMMENT ON FUNCTION extract_mood IS 'Extracts mood/vibe from track style and tags';
COMMENT ON FUNCTION refresh_trending_tracks IS 'Refresh trending tracks materialized view';
COMMENT ON FUNCTION get_featured_tracks IS 'Get featured/high-quality tracks with quality scoring';
