-- Migration: Create comments table with threading support
-- Sprint 011 - Task T003
-- Created: 2025-12-12

-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  parent_comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  likes_count integer DEFAULT 0 NOT NULL,
  reply_count integer DEFAULT 0 NOT NULL,
  is_edited boolean DEFAULT false NOT NULL,
  is_moderated boolean DEFAULT false NOT NULL,
  moderation_reason text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Content validation
  CONSTRAINT content_not_empty CHECK (char_length(trim(content)) > 0),
  CONSTRAINT content_length CHECK (char_length(content) <= 2000)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_comments_track_created ON public.comments(track_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.comments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments(parent_comment_id, created_at DESC) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_track_parent ON public.comments(track_id, parent_comment_id) WHERE parent_comment_id IS NULL;

-- Enable Row Level Security
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments
-- Anyone can view non-moderated comments on public tracks
CREATE POLICY "Comments are viewable by everyone"
  ON public.comments
  FOR SELECT
  USING (
    is_moderated = false
    AND EXISTS (
      SELECT 1 FROM public.tracks t
      WHERE t.id = track_id
      AND t.is_public = true
    )
  );

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can comment"
  ON public.comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON public.comments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON public.comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE public.comments IS 'Track comments with threading support (max 5 levels deep)';
COMMENT ON COLUMN public.comments.track_id IS 'Track being commented on';
COMMENT ON COLUMN public.comments.user_id IS 'Comment author';
COMMENT ON COLUMN public.comments.parent_comment_id IS 'Parent comment for threading (NULL for top-level)';
COMMENT ON COLUMN public.comments.content IS 'Comment text content (max 2000 chars)';
COMMENT ON COLUMN public.comments.likes_count IS 'Number of likes on this comment';
COMMENT ON COLUMN public.comments.reply_count IS 'Number of replies to this comment';
COMMENT ON COLUMN public.comments.is_edited IS 'Whether comment has been edited';
COMMENT ON COLUMN public.comments.is_moderated IS 'Whether comment has been moderated/hidden';
