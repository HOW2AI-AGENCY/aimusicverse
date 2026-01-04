-- Sprint 010 - Phase 1: Add public content support for Homepage Discovery
-- This migration adds columns to support public content discovery features

-- Add public content columns to tracks table
ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS plays_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Add indexes for public content queries
CREATE INDEX IF NOT EXISTS idx_tracks_public ON tracks(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_tracks_featured ON tracks(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_tracks_likes_count ON tracks(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_tracks_plays_count ON tracks(plays_count DESC);
CREATE INDEX IF NOT EXISTS idx_tracks_created_at_desc ON tracks(created_at DESC);

-- Create track_likes table for managing user likes
CREATE TABLE IF NOT EXISTS track_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(track_id, user_id)
);

-- Add index for likes queries
CREATE INDEX IF NOT EXISTS idx_track_likes_track_id ON track_likes(track_id);
CREATE INDEX IF NOT EXISTS idx_track_likes_user_id ON track_likes(user_id);

-- Create function to update likes_count when a like is added/removed
CREATE OR REPLACE FUNCTION update_track_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tracks SET likes_count = likes_count + 1 WHERE id = NEW.track_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tracks SET likes_count = likes_count - 1 WHERE id = OLD.track_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update likes_count
DROP TRIGGER IF EXISTS track_likes_count_trigger ON track_likes;
CREATE TRIGGER track_likes_count_trigger
AFTER INSERT OR DELETE ON track_likes
FOR EACH ROW
EXECUTE FUNCTION update_track_likes_count();

-- Enable RLS on track_likes table
ALTER TABLE track_likes ENABLE ROW LEVEL SECURITY;

-- Allow users to like tracks
CREATE POLICY "Users can like tracks"
ON track_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to unlike their own likes
CREATE POLICY "Users can unlike tracks"
ON track_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow anyone to view likes
CREATE POLICY "Anyone can view likes"
ON track_likes FOR SELECT
TO authenticated
USING (true);

-- Add comment
COMMENT ON TABLE track_likes IS 'Stores user likes for tracks to support Homepage Discovery features';
COMMENT ON COLUMN tracks.is_public IS 'Whether the track is publicly visible on Homepage';
COMMENT ON COLUMN tracks.is_featured IS 'Whether the track is featured on Homepage';
COMMENT ON COLUMN tracks.likes_count IS 'Cached count of likes for performance';
COMMENT ON COLUMN tracks.plays_count IS 'Cached count of plays for popularity tracking';
