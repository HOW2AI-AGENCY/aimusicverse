-- Create telemetry_events table for storing metrics and analytics
CREATE TABLE public.telemetry_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  duration_ms INTEGER,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  platform TEXT,
  app_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_telemetry_events_user_id ON public.telemetry_events(user_id);
CREATE INDEX idx_telemetry_events_event_type ON public.telemetry_events(event_type);
CREATE INDEX idx_telemetry_events_timestamp ON public.telemetry_events(timestamp DESC);
CREATE INDEX idx_telemetry_events_session_id ON public.telemetry_events(session_id);

-- Enable RLS
ALTER TABLE public.telemetry_events ENABLE ROW LEVEL SECURITY;

-- Allow insert for authenticated users
CREATE POLICY "Users can insert their own telemetry"
ON public.telemetry_events FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow service role to read all telemetry (for analytics)
CREATE POLICY "Service role can read all telemetry"
ON public.telemetry_events FOR SELECT
USING (auth.role() = 'service_role');

-- Create error_logs table for error tracking
CREATE TABLE public.error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  error_fingerprint TEXT,
  component TEXT,
  context JSONB DEFAULT '{}',
  severity TEXT DEFAULT 'error',
  platform TEXT,
  app_version TEXT,
  url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for error_logs
CREATE INDEX idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX idx_error_logs_error_type ON public.error_logs(error_type);
CREATE INDEX idx_error_logs_fingerprint ON public.error_logs(error_fingerprint);
CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX idx_error_logs_severity ON public.error_logs(severity);

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Allow insert for authenticated users
CREATE POLICY "Users can insert their own errors"
ON public.error_logs FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow service role to read all errors
CREATE POLICY "Service role can read all errors"
ON public.error_logs FOR SELECT
USING (auth.role() = 'service_role');

-- Create analytics_aggregates table for pre-computed metrics
CREATE TABLE public.analytics_aggregates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  dimension TEXT,
  dimension_value TEXT,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  sample_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(metric_name, dimension, dimension_value, period_start)
);

-- Create indexes
CREATE INDEX idx_analytics_aggregates_metric ON public.analytics_aggregates(metric_name);
CREATE INDEX idx_analytics_aggregates_period ON public.analytics_aggregates(period_start, period_end);

-- Enable RLS
ALTER TABLE public.analytics_aggregates ENABLE ROW LEVEL SECURITY;

-- Service role access only
CREATE POLICY "Service role can manage aggregates"
ON public.analytics_aggregates FOR ALL
USING (auth.role() = 'service_role');

-- Add comment
COMMENT ON TABLE public.telemetry_events IS 'Stores user telemetry events for analytics';
COMMENT ON TABLE public.error_logs IS 'Stores error logs for debugging and monitoring';
COMMENT ON TABLE public.analytics_aggregates IS 'Pre-computed analytics aggregates';