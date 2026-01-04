-- Create user_journey_events table for funnel tracking
CREATE TABLE public.user_journey_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id text NOT NULL,
  funnel_name text NOT NULL,
  step_name text NOT NULL,
  step_index int NOT NULL,
  completed boolean DEFAULT false,
  dropped_off boolean DEFAULT false,
  duration_from_prev_ms int,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_journey_events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own events
CREATE POLICY "Users can insert own journey events"
ON public.user_journey_events FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can read their own events
CREATE POLICY "Users can read own journey events"
ON public.user_journey_events FOR SELECT
USING (auth.uid() = user_id);

-- Create indexes for analytics queries
CREATE INDEX idx_journey_funnel ON public.user_journey_events(funnel_name, step_name);
CREATE INDEX idx_journey_user ON public.user_journey_events(user_id, created_at DESC);
CREATE INDEX idx_journey_session ON public.user_journey_events(session_id);
CREATE INDEX idx_journey_dropoff ON public.user_journey_events(funnel_name, dropped_off) WHERE dropped_off = true;

-- Add reference_audio columns to tracks table
ALTER TABLE public.tracks 
ADD COLUMN IF NOT EXISTS reference_audio_url text,
ADD COLUMN IF NOT EXISTS generation_mode text;

-- RPC function to get funnel drop-off statistics
CREATE OR REPLACE FUNCTION public.get_funnel_dropoff_stats(
  _funnel_name text,
  _days_back int DEFAULT 7
)
RETURNS TABLE (
  step_name text,
  step_index int,
  users_reached bigint,
  users_dropped bigint,
  conversion_rate numeric,
  avg_duration_ms numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH step_stats AS (
    SELECT 
      e.step_name,
      e.step_index,
      COUNT(DISTINCT e.user_id) as users_at_step,
      COUNT(DISTINCT e.user_id) FILTER (WHERE e.dropped_off) as dropped_users,
      AVG(e.duration_from_prev_ms) as avg_duration
    FROM user_journey_events e
    WHERE e.funnel_name = _funnel_name
      AND e.created_at >= NOW() - (_days_back || ' days')::interval
    GROUP BY e.step_name, e.step_index
  ),
  first_step AS (
    SELECT users_at_step as total_users
    FROM step_stats
    WHERE step_index = 0
    LIMIT 1
  )
  SELECT 
    ss.step_name,
    ss.step_index,
    ss.users_at_step as users_reached,
    ss.dropped_users as users_dropped,
    ROUND(
      (ss.users_at_step::numeric / NULLIF((SELECT total_users FROM first_step), 0)) * 100,
      2
    ) as conversion_rate,
    ROUND(ss.avg_duration, 0) as avg_duration_ms
  FROM step_stats ss
  ORDER BY ss.step_index;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_funnel_dropoff_stats TO authenticated;