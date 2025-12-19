-- Phase 1.2: Dead Letter Queue for Failed Telegram Notifications
-- =============================================================

-- Table to store failed notifications for retry
CREATE TABLE IF NOT EXISTS public.telegram_failed_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id BIGINT NOT NULL,
    user_id UUID,
    notification_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    error_message TEXT,
    error_code TEXT,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_retry_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'retrying', 'resolved', 'failed_permanently'))
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_telegram_failed_notifications_status 
    ON public.telegram_failed_notifications(status) WHERE status IN ('pending', 'retrying');
CREATE INDEX IF NOT EXISTS idx_telegram_failed_notifications_next_retry 
    ON public.telegram_failed_notifications(next_retry_at) WHERE status IN ('pending', 'retrying');
CREATE INDEX IF NOT EXISTS idx_telegram_failed_notifications_chat_id 
    ON public.telegram_failed_notifications(chat_id);

-- Enable RLS
ALTER TABLE public.telegram_failed_notifications ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (internal use only)
CREATE POLICY "Service role access" ON public.telegram_failed_notifications
    FOR ALL USING (auth.role() = 'service_role');

-- Phase 2.1: Wizard State Table (if not exists)
-- ==============================================

CREATE TABLE IF NOT EXISTS public.telegram_wizard_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    wizard_type TEXT NOT NULL,
    current_step TEXT NOT NULL,
    selections JSONB DEFAULT '{}',
    message_id BIGINT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, wizard_type)
);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_telegram_wizard_state_expires 
    ON public.telegram_wizard_state(expires_at);

-- Enable RLS
ALTER TABLE public.telegram_wizard_state ENABLE ROW LEVEL SECURITY;

-- Users can only access their own wizard state
CREATE POLICY "Users can manage own wizard state" ON public.telegram_wizard_state
    FOR ALL USING (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "Service role full access wizard" ON public.telegram_wizard_state
    FOR ALL USING (auth.role() = 'service_role');

-- Phase 2.2: Voice Message Transcription Log
-- ==========================================

CREATE TABLE IF NOT EXISTS public.telegram_voice_transcriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    telegram_chat_id BIGINT NOT NULL,
    telegram_file_id TEXT NOT NULL,
    duration_seconds INT,
    transcription TEXT,
    detected_language TEXT,
    confidence DECIMAL(3, 2),
    used_for_generation BOOLEAN DEFAULT false,
    generation_task_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_telegram_voice_transcriptions_user 
    ON public.telegram_voice_transcriptions(user_id);

-- Enable RLS
ALTER TABLE public.telegram_voice_transcriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own transcriptions
CREATE POLICY "Users can view own transcriptions" ON public.telegram_voice_transcriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "Service role full access transcriptions" ON public.telegram_voice_transcriptions
    FOR ALL USING (auth.role() = 'service_role');

-- Function to cleanup expired wizard states
CREATE OR REPLACE FUNCTION public.cleanup_expired_wizard_states()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.telegram_wizard_state
  WHERE expires_at < now();
END;
$$;

-- Function to get retry-ready notifications
CREATE OR REPLACE FUNCTION public.get_pending_notification_retries(_limit INT DEFAULT 50)
RETURNS SETOF public.telegram_failed_notifications
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT *
  FROM public.telegram_failed_notifications
  WHERE status IN ('pending', 'retrying')
    AND (next_retry_at IS NULL OR next_retry_at <= now())
    AND retry_count < max_retries
  ORDER BY created_at ASC
  LIMIT _limit;
$$;