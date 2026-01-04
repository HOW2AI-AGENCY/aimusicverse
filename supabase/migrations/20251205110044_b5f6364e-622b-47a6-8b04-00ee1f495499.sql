-- Create table for Telegram bot metrics
CREATE TABLE public.telegram_bot_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL, -- 'message_sent', 'message_failed', 'callback_processed', 'notification_sent', etc.
  success BOOLEAN NOT NULL DEFAULT true,
  user_id UUID,
  telegram_chat_id BIGINT,
  error_message TEXT,
  response_time_ms INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_telegram_metrics_event_type ON public.telegram_bot_metrics(event_type);
CREATE INDEX idx_telegram_metrics_created_at ON public.telegram_bot_metrics(created_at DESC);
CREATE INDEX idx_telegram_metrics_success ON public.telegram_bot_metrics(success);

-- Enable RLS
ALTER TABLE public.telegram_bot_metrics ENABLE ROW LEVEL SECURITY;

-- Only service role can insert metrics (from edge functions)
CREATE POLICY "Service role can manage metrics"
ON public.telegram_bot_metrics
FOR ALL
USING (true)
WITH CHECK (true);

-- Create function to get bot health metrics
CREATE OR REPLACE FUNCTION public.get_telegram_bot_metrics(
  _time_period INTERVAL DEFAULT '24 hours'::interval
)
RETURNS TABLE (
  total_events BIGINT,
  successful_events BIGINT,
  failed_events BIGINT,
  success_rate NUMERIC,
  avg_response_time_ms NUMERIC,
  events_by_type JSONB
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_events,
    COUNT(*) FILTER (WHERE success = true)::BIGINT as successful_events,
    COUNT(*) FILTER (WHERE success = false)::BIGINT as failed_events,
    ROUND(
      (COUNT(*) FILTER (WHERE success = true)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 
      2
    ) as success_rate,
    ROUND(AVG(response_time_ms)::NUMERIC, 2) as avg_response_time_ms,
    (
      SELECT jsonb_object_agg(event_type, cnt)
      FROM (
        SELECT event_type, COUNT(*) as cnt
        FROM telegram_bot_metrics
        WHERE created_at >= now() - _time_period
        GROUP BY event_type
      ) sub
    ) as events_by_type
  FROM telegram_bot_metrics
  WHERE created_at >= now() - _time_period;
END;
$$;