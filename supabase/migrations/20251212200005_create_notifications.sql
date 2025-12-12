-- Migration: Create notifications table
-- Sprint 011 - Task T006
-- Created: 2025-12-12

-- Create notification_type enum
CREATE TYPE public.notification_type AS ENUM (
  'new_follower',
  'track_liked',
  'track_commented',
  'comment_liked',
  'comment_reply',
  'mention',
  'track_shared'
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  notification_type public.notification_type NOT NULL,
  entity_type public.entity_type NOT NULL,
  entity_id uuid NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false NOT NULL,
  telegram_sent boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  read_at timestamp with time zone
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, created_at DESC) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_actor ON public.notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON public.notifications(entity_type, entity_id);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- System can create notifications (handled by triggers)
CREATE POLICY "System can create notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE public.notifications IS 'User notifications for social interactions';
COMMENT ON COLUMN public.notifications.user_id IS 'User receiving the notification';
COMMENT ON COLUMN public.notifications.actor_id IS 'User who triggered the notification';
COMMENT ON COLUMN public.notifications.notification_type IS 'Type of notification';
COMMENT ON COLUMN public.notifications.entity_type IS 'Type of entity involved';
COMMENT ON COLUMN public.notifications.entity_id IS 'ID of the entity involved';
COMMENT ON COLUMN public.notifications.content IS 'Notification message text';
COMMENT ON COLUMN public.notifications.is_read IS 'Whether notification has been read';
COMMENT ON COLUMN public.notifications.telegram_sent IS 'Whether notification was sent via Telegram';
COMMENT ON COLUMN public.notifications.read_at IS 'When notification was read';
