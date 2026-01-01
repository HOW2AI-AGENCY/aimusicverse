-- Create telegram notification queue table
CREATE TABLE IF NOT EXISTS public.telegram_notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id BIGINT NOT NULL,
    user_id UUID,
    notification_type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),
    priority_score INT DEFAULT 50,
    dedupe_key TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    sent_at TIMESTAMP WITH TIME ZONE,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 5,
    error_message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed_permanently'))
);

-- Create indexes for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_tg_queue_status_scheduled ON public.telegram_notification_queue(status, scheduled_at) 
    WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_tg_queue_priority ON public.telegram_notification_queue(priority_score, created_at);
CREATE INDEX IF NOT EXISTS idx_tg_queue_dedupe ON public.telegram_notification_queue(dedupe_key) 
    WHERE dedupe_key IS NOT NULL AND status = 'pending';
CREATE INDEX IF NOT EXISTS idx_tg_queue_user ON public.telegram_notification_queue(user_id);

-- Enable RLS
ALTER TABLE public.telegram_notification_queue ENABLE ROW LEVEL SECURITY;

-- Service role only access (no direct user access)
CREATE POLICY "Service role access only for tg_queue"
ON public.telegram_notification_queue
FOR ALL
USING (false)
WITH CHECK (false);

-- Add function to get pending items for processing
CREATE OR REPLACE FUNCTION public.get_pending_telegram_notifications(_limit INT DEFAULT 50)
RETURNS SETOF telegram_notification_queue
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT * FROM telegram_notification_queue
    WHERE status = 'pending'
    AND scheduled_at <= now()
    ORDER BY priority_score ASC, created_at ASC
    LIMIT _limit
    FOR UPDATE SKIP LOCKED;
$$;

-- Cleanup old sent/failed notifications (keep 7 days)
CREATE OR REPLACE FUNCTION public.cleanup_telegram_queue()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM telegram_notification_queue
    WHERE (status = 'sent' AND sent_at < now() - INTERVAL '7 days')
       OR (status = 'failed_permanently' AND last_attempt_at < now() - INTERVAL '7 days');
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;