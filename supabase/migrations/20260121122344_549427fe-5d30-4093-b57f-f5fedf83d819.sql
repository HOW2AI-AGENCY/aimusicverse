-- Create RUM metrics table for real user monitoring
CREATE TABLE public.rum_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  page_path TEXT,
  -- Core Web Vitals
  lcp_ms NUMERIC,
  fid_ms NUMERIC,
  cls NUMERIC,
  fcp_ms NUMERIC,
  ttfb_ms NUMERIC,
  inp_ms NUMERIC,
  -- Device info
  device_type TEXT,
  connection_type TEXT,
  viewport_width INTEGER,
  viewport_height INTEGER,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX idx_rum_metrics_created_at ON public.rum_metrics(created_at DESC);
CREATE INDEX idx_rum_metrics_user_id ON public.rum_metrics(user_id);
CREATE INDEX idx_rum_metrics_page_path ON public.rum_metrics(page_path);
CREATE INDEX idx_rum_metrics_device_type ON public.rum_metrics(device_type);

-- Enable RLS
ALTER TABLE public.rum_metrics ENABLE ROW LEVEL SECURITY;

-- Allow insert for anyone (metrics collection from browser)
CREATE POLICY "Allow anonymous RUM inserts"
ON public.rum_metrics FOR INSERT
WITH CHECK (true);

-- Allow read for admins only using has_role function
CREATE POLICY "Admins can read RUM metrics"
ON public.rum_metrics FOR SELECT
USING (has_role(auth.uid(), 'admin'));

COMMENT ON TABLE public.rum_metrics IS 'Real User Monitoring metrics collected from browser performance API';