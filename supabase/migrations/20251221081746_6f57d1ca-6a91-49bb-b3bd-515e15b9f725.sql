-- Create table for persistent rate limiting
CREATE TABLE IF NOT EXISTS public.telegram_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id bigint NOT NULL,
  action_type text NOT NULL DEFAULT 'message',
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create unique index for efficient lookups
CREATE UNIQUE INDEX idx_telegram_rate_limits_user_action 
ON public.telegram_rate_limits (user_id, action_type);

-- Create index for cleanup
CREATE INDEX idx_telegram_rate_limits_window 
ON public.telegram_rate_limits (window_start);

-- Enable RLS
ALTER TABLE public.telegram_rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access for rate limits"
ON public.telegram_rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- Function to check and update rate limit
CREATE OR REPLACE FUNCTION public.check_telegram_rate_limit(
  p_user_id bigint,
  p_action_type text DEFAULT 'message',
  p_max_requests integer DEFAULT 10,
  p_window_seconds integer DEFAULT 60
)
RETURNS TABLE (
  is_limited boolean,
  current_count integer,
  remaining integer,
  reset_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_window_start timestamp with time zone;
  v_current_count integer;
  v_reset_at timestamp with time zone;
BEGIN
  v_window_start := now() - (p_window_seconds || ' seconds')::interval;
  
  -- Try to upsert the rate limit record
  INSERT INTO telegram_rate_limits (user_id, action_type, request_count, window_start)
  VALUES (p_user_id, p_action_type, 1, now())
  ON CONFLICT (user_id, action_type) DO UPDATE SET
    request_count = CASE 
      WHEN telegram_rate_limits.window_start < v_window_start THEN 1
      ELSE telegram_rate_limits.request_count + 1
    END,
    window_start = CASE 
      WHEN telegram_rate_limits.window_start < v_window_start THEN now()
      ELSE telegram_rate_limits.window_start
    END
  RETURNING 
    request_count,
    window_start + (p_window_seconds || ' seconds')::interval
  INTO v_current_count, v_reset_at;
  
  RETURN QUERY SELECT 
    v_current_count > p_max_requests AS is_limited,
    v_current_count AS current_count,
    GREATEST(0, p_max_requests - v_current_count) AS remaining,
    v_reset_at AS reset_at;
END;
$$;

-- Function to cleanup old rate limit entries
CREATE OR REPLACE FUNCTION public.cleanup_telegram_rate_limits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deleted integer;
BEGIN
  -- Delete entries older than 1 hour
  DELETE FROM telegram_rate_limits
  WHERE window_start < now() - interval '1 hour';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_telegram_rate_limit TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_telegram_rate_limits TO service_role;