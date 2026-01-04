-- Phase 1: Create user notification settings table
CREATE TABLE IF NOT EXISTS public.user_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_chat_id BIGINT,
  notify_completed BOOLEAN DEFAULT true,
  notify_failed BOOLEAN DEFAULT true,
  notify_progress BOOLEAN DEFAULT false,
  notify_stem_ready BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_notification_settings UNIQUE(user_id)
);

-- Add telegram_chat_id to profiles if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user_id 
ON public.user_notification_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_user_notification_settings_chat_id 
ON public.user_notification_settings(telegram_chat_id);

CREATE INDEX IF NOT EXISTS idx_profiles_telegram_chat_id 
ON public.profiles(telegram_chat_id);

-- Enable RLS
ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notification settings"
ON public.user_notification_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings"
ON public.user_notification_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings"
ON public.user_notification_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_notification_settings_updated_at ON public.user_notification_settings;
CREATE TRIGGER update_notification_settings_updated_at
BEFORE UPDATE ON public.user_notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_notification_settings_updated_at();