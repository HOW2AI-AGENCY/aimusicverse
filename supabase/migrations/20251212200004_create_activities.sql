-- Migration: Create activities table for activity feed
-- Sprint 011 - Task T005
-- Created: 2025-12-12

-- Create activity_type enum
CREATE TYPE public.activity_type AS ENUM (
  'track_created',
  'track_liked',
  'comment_posted',
  'user_followed',
  'playlist_created',
  'track_added_to_playlist'
);

-- Create entity_type enum
CREATE TYPE public.entity_type AS ENUM (
  'track',
  'comment',
  'user',
  'playlist'
);

-- Create activities table
CREATE TABLE IF NOT EXISTS public.activities (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  activity_type public.activity_type NOT NULL,
  entity_type public.entity_type NOT NULL,
  entity_id uuid NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Prevent duplicate activities within short time window
  CONSTRAINT unique_activity UNIQUE (user_id, actor_id, activity_type, entity_id, created_at)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_user_created ON public.activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_actor ON public.activities(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(activity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON public.activities(entity_type, entity_id);

-- Enable Row Level Security
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activities
-- Users can view their own activity feed
CREATE POLICY "Users can view their activity feed"
  ON public.activities
  FOR SELECT
  USING (auth.uid() = user_id);

-- System can create activities (handled by triggers)
CREATE POLICY "System can create activities"
  ON public.activities
  FOR INSERT
  WITH CHECK (true);

-- Add comments
COMMENT ON TABLE public.activities IS 'Activity feed events for users';
COMMENT ON COLUMN public.activities.user_id IS 'User who receives this activity in their feed';
COMMENT ON COLUMN public.activities.actor_id IS 'User who performed the action';
COMMENT ON COLUMN public.activities.activity_type IS 'Type of activity';
COMMENT ON COLUMN public.activities.entity_type IS 'Type of entity involved';
COMMENT ON COLUMN public.activities.entity_id IS 'ID of the entity involved';
COMMENT ON COLUMN public.activities.metadata IS 'Additional activity metadata (JSON)';
