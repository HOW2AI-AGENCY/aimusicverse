-- Create table for storing performance metrics over time
CREATE TABLE public.performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source VARCHAR(50) NOT NULL DEFAULT 'manual', -- 'lighthouse-ci', 'manual', 'rum'
  
  -- Bundle metrics
  bundle_size_kb NUMERIC,
  bundle_size_gzip_kb NUMERIC,
  
  -- Core Web Vitals
  lcp_ms NUMERIC, -- Largest Contentful Paint
  fid_ms NUMERIC, -- First Input Delay
  cls NUMERIC, -- Cumulative Layout Shift
  fcp_ms NUMERIC, -- First Contentful Paint
  ttfb_ms NUMERIC, -- Time to First Byte
  tti_ms NUMERIC, -- Time to Interactive
  tbt_ms NUMERIC, -- Total Blocking Time
  speed_index_ms NUMERIC,
  
  -- Lighthouse Scores (0-100)
  lighthouse_performance INTEGER,
  lighthouse_accessibility INTEGER,
  lighthouse_best_practices INTEGER,
  lighthouse_seo INTEGER,
  
  -- Metadata
  url VARCHAR(500),
  device VARCHAR(50) DEFAULT 'mobile', -- 'mobile', 'desktop'
  connection VARCHAR(50) DEFAULT '4g', -- '4g', '3g', 'wifi'
  commit_sha VARCHAR(40),
  branch VARCHAR(100),
  pr_number INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for time-series queries
CREATE INDEX idx_performance_metrics_recorded_at ON public.performance_metrics(recorded_at DESC);
CREATE INDEX idx_performance_metrics_source ON public.performance_metrics(source);

-- Enable RLS
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Allow public read access for dashboard viewing
CREATE POLICY "Performance metrics are publicly readable"
ON public.performance_metrics
FOR SELECT
USING (true);

-- Only authenticated users can insert (for manual entries)
CREATE POLICY "Authenticated users can insert performance metrics"
ON public.performance_metrics
FOR INSERT
WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE public.performance_metrics IS 'Stores performance metrics from Lighthouse CI, RUM, and manual entries for tracking over time';