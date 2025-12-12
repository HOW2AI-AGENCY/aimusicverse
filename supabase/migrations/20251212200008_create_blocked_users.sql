-- Migration: Create blocked_users table for privacy features
-- Sprint 011 - Task T010
-- Created: 2025-12-12

-- Create blocked_users table
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  blocker_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  reason text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Unique constraint: can't block same user twice
  CONSTRAINT unique_block UNIQUE (blocker_id, blocked_id),
  
  -- Self-block prevention
  CONSTRAINT no_self_block CHECK (blocker_id != blocked_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON public.blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON public.blocked_users(blocked_id);

-- Enable Row Level Security
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blocked_users
-- Users can view their own blocks
CREATE POLICY "Users can view own blocks"
  ON public.blocked_users
  FOR SELECT
  USING (auth.uid() = blocker_id);

-- Users can create blocks
CREATE POLICY "Users can block others"
  ON public.blocked_users
  FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

-- Users can remove blocks (unblock)
CREATE POLICY "Users can unblock"
  ON public.blocked_users
  FOR DELETE
  USING (auth.uid() = blocker_id);

-- Function to check if user is blocked
CREATE OR REPLACE FUNCTION public.is_user_blocked(
  p_blocker_id uuid,
  p_blocked_id uuid
)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.blocked_users
    WHERE blocker_id = p_blocker_id
    AND blocked_id = p_blocked_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Add comments
COMMENT ON TABLE public.blocked_users IS 'User blocking for privacy and moderation';
COMMENT ON COLUMN public.blocked_users.blocker_id IS 'User who is blocking';
COMMENT ON COLUMN public.blocked_users.blocked_id IS 'User being blocked';
COMMENT ON COLUMN public.blocked_users.reason IS 'Optional reason for blocking';
COMMENT ON FUNCTION public.is_user_blocked IS 'Check if one user has blocked another';
