-- Migration: Create likes tables (track_likes and comment_likes)
-- Sprint 011 - Task T004
-- Created: 2025-12-12

-- Create track_likes table
CREATE TABLE IF NOT EXISTS public.track_likes (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Unique constraint: can't like same track twice
  CONSTRAINT unique_track_like UNIQUE (user_id, track_id)
);

-- Create comment_likes table
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Unique constraint: can't like same comment twice
  CONSTRAINT unique_comment_like UNIQUE (user_id, comment_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_track_likes_track ON public.track_likes(track_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_track_likes_user ON public.track_likes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON public.comment_likes(comment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON public.comment_likes(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.track_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for track_likes
-- Anyone can view track likes for public tracks
CREATE POLICY "Track likes are viewable by everyone"
  ON public.track_likes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tracks t
      WHERE t.id = track_id
      AND t.is_public = true
    )
  );

-- Authenticated users can like tracks
CREATE POLICY "Users can like tracks"
  ON public.track_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can unlike tracks (delete their own likes)
CREATE POLICY "Users can unlike tracks"
  ON public.track_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for comment_likes
-- Anyone can view comment likes
CREATE POLICY "Comment likes are viewable by everyone"
  ON public.comment_likes
  FOR SELECT
  USING (true);

-- Authenticated users can like comments
CREATE POLICY "Users can like comments"
  ON public.comment_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can unlike comments (delete their own likes)
CREATE POLICY "Users can unlike comments"
  ON public.comment_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE public.track_likes IS 'Track likes from users';
COMMENT ON TABLE public.comment_likes IS 'Comment likes from users';
COMMENT ON COLUMN public.track_likes.track_id IS 'Track being liked';
COMMENT ON COLUMN public.track_likes.user_id IS 'User who liked the track';
COMMENT ON COLUMN public.comment_likes.comment_id IS 'Comment being liked';
COMMENT ON COLUMN public.comment_likes.user_id IS 'User who liked the comment';
