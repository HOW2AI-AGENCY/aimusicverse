-- Migration: Create user_follows table for following system
-- Sprint 011 - Task T002
-- Created: 2025-12-12
-- Updated: 2025-12-13 - Renamed to user_follows to match Supabase types

-- Create user_follows table
CREATE TABLE IF NOT EXISTS public.user_follows (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  follower_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  status text DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'blocked')),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Unique constraint: can't follow same user twice
  CONSTRAINT unique_follow UNIQUE (follower_id, following_id),
  
  -- Self-follow prevention
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_follows_status ON public.user_follows(status) WHERE status = 'active';

-- Enable Row Level Security
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_follows
-- Anyone can view active follows for public profiles
CREATE POLICY "Public follows are viewable by everyone"
  ON public.user_follows
  FOR SELECT
  USING (status = 'active');

-- Users can create follows (follow others)
CREATE POLICY "Users can follow others"
  ON public.user_follows
  FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- Users can delete their own follows (unfollow)
CREATE POLICY "Users can unfollow"
  ON public.user_follows
  FOR DELETE
  USING (auth.uid() = follower_id);

-- Add comments
COMMENT ON TABLE public.user_follows IS 'User following relationships';
COMMENT ON COLUMN public.user_follows.follower_id IS 'User who is following';
COMMENT ON COLUMN public.user_follows.following_id IS 'User being followed';
COMMENT ON COLUMN public.user_follows.status IS 'Follow status: active or blocked';
