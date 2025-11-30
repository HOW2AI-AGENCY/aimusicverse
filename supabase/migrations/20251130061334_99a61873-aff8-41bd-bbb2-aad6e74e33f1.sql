-- Create API usage logs table
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service VARCHAR(50) NOT NULL,
  endpoint VARCHAR(100) NOT NULL,
  method VARCHAR(10) DEFAULT 'POST',
  request_body JSONB,
  response_status INTEGER,
  response_body JSONB,
  duration_ms INTEGER,
  estimated_cost DECIMAL(10,6),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_api_logs_user_created ON public.api_usage_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_service ON public.api_usage_logs(service, created_at DESC);

-- Enable RLS
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own API logs"
  ON public.api_usage_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all API logs"
  ON public.api_usage_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );