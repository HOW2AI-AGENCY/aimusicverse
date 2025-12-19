-- Add missing columns for notification management
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS group_key text,
ADD COLUMN IF NOT EXISTS expires_at timestamptz,
ADD COLUMN IF NOT EXISTS priority integer DEFAULT 0;

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_notifications_group_key ON public.notifications(user_id, group_key) WHERE group_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON public.notifications(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(user_id, created_at DESC);