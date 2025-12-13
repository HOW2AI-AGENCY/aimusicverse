-- Migration: Add system announcement support
-- Created: 2025-12-13
-- Purpose: Add system-wide announcement notifications for all users

-- Add new notification type for system announcements
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'system_announcement';

-- Create system announcements table for admin-managed announcements
CREATE TABLE IF NOT EXISTS public.system_announcements (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  title text NOT NULL,
  message text NOT NULL,
  announcement_type text DEFAULT 'info' NOT NULL,
  icon text,
  link_url text,
  link_text text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  expires_at timestamp with time zone,
  created_by uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.system_announcements ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view active announcements
CREATE POLICY "Anyone can view active announcements"
  ON public.system_announcements
  FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Function to broadcast system announcement to all users
CREATE OR REPLACE FUNCTION public.broadcast_system_announcement(
  announcement_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_announcement record;
BEGIN
  -- Get announcement details
  SELECT * INTO v_announcement
  FROM public.system_announcements
  WHERE id = announcement_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Announcement not found';
  END IF;

  -- Create notification for all users (except the creator)
  INSERT INTO public.notifications (
    user_id,
    actor_id,
    notification_type,
    entity_type,
    entity_id,
    content,
    is_read,
    telegram_sent
  )
  SELECT
    p.user_id,
    COALESCE(v_announcement.created_by, p.user_id), -- Use creator or self as actor
    'system_announcement'::notification_type,
    'announcement'::entity_type,
    announcement_id,
    v_announcement.message,
    false,
    false
  FROM public.profiles p
  WHERE p.user_id != COALESCE(v_announcement.created_by, '00000000-0000-0000-0000-000000000000'::uuid);

  RAISE NOTICE 'Broadcast % notifications for announcement %',
    (SELECT COUNT(*) FROM public.profiles WHERE user_id != COALESCE(v_announcement.created_by, '00000000-0000-0000-0000-000000000000'::uuid)),
    announcement_id;
END;
$$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_system_announcements_active ON public.system_announcements(is_active, created_at DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_system_announcements_expires ON public.system_announcements(expires_at) WHERE expires_at IS NOT NULL;

-- Comments
COMMENT ON TABLE public.system_announcements IS 'System-wide announcements managed by admins';
COMMENT ON FUNCTION public.broadcast_system_announcement IS 'Broadcasts announcement notification to all users';

-- Insert initial announcement about lyrics assistant improvements
INSERT INTO public.system_announcements (
  title,
  message,
  announcement_type,
  icon,
  is_active,
  expires_at
) VALUES (
  '✨ Улучшен AI Lyrics Assistant',
  'AI помощник для написания лирики стал умнее! Теперь он помнит всю историю диалога, не задаёт лишние вопросы и сразу создаёт полный текст с тегами Suno, когда у него достаточно информации.',
  'feature',
  '🎵',
  true,
  NOW() + INTERVAL '7 days'
);

-- Get the announcement ID and broadcast it
DO $$
DECLARE
  v_announcement_id uuid;
BEGIN
  -- Get the last inserted announcement
  SELECT id INTO v_announcement_id
  FROM public.system_announcements
  WHERE title = '✨ Улучшен AI Lyrics Assistant'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Broadcast to all users
  IF v_announcement_id IS NOT NULL THEN
    PERFORM public.broadcast_system_announcement(v_announcement_id);
  END IF;
END $$;
