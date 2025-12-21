-- Create table for storing failed notifications for retry
CREATE TABLE IF NOT EXISTS public.failed_telegram_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id BIGINT NOT NULL,
  method TEXT NOT NULL, -- 'sendMessage', 'sendPhoto', 'sendAudio', etc.
  payload JSONB NOT NULL,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_retry_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'retrying', 'success', 'failed'))
);

-- Index for efficient retry processing
CREATE INDEX IF NOT EXISTS idx_failed_notifications_retry 
ON public.failed_telegram_notifications (status, next_retry_at) 
WHERE status IN ('pending', 'retrying');

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_failed_notifications_created 
ON public.failed_telegram_notifications (created_at);

-- Enable RLS
ALTER TABLE public.failed_telegram_notifications ENABLE ROW LEVEL SECURITY;

-- Service role only policy (Edge Functions access)
CREATE POLICY "Service role can manage failed notifications"
ON public.failed_telegram_notifications
FOR ALL
USING (true)
WITH CHECK (true);

-- Function to process retry queue
CREATE OR REPLACE FUNCTION public.get_pending_telegram_retries(batch_size INTEGER DEFAULT 10)
RETURNS SETOF public.failed_telegram_notifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.failed_telegram_notifications
  SET status = 'retrying', last_retry_at = now()
  WHERE id IN (
    SELECT id FROM public.failed_telegram_notifications
    WHERE status IN ('pending', 'retrying')
      AND (next_retry_at IS NULL OR next_retry_at <= now())
      AND retry_count < max_retries
    ORDER BY created_at
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END;
$$;

-- Function to cleanup old failed notifications
CREATE OR REPLACE FUNCTION public.cleanup_failed_telegram_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete successful notifications older than 24 hours
  DELETE FROM public.failed_telegram_notifications
  WHERE (status = 'success' AND created_at < now() - INTERVAL '24 hours')
     OR (status = 'failed' AND created_at < now() - INTERVAL '7 days');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_pending_telegram_retries TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_failed_telegram_notifications TO service_role;