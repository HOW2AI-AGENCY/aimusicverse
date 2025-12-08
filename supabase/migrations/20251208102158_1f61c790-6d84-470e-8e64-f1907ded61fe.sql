-- Create health_alerts table for incident tracking
CREATE TABLE public.health_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  overall_status TEXT NOT NULL,
  alert_type TEXT NOT NULL DEFAULT 'automatic',
  unhealthy_services TEXT[] DEFAULT '{}',
  degraded_services TEXT[] DEFAULT '{}',
  metrics JSONB DEFAULT '{}',
  recipients_count INTEGER DEFAULT 0,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_note TEXT,
  is_test BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.health_alerts ENABLE ROW LEVEL SECURITY;

-- Only admins can view alerts
CREATE POLICY "Admins can view health alerts"
ON public.health_alerts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert alerts
CREATE POLICY "Service role can insert alerts"
ON public.health_alerts
FOR INSERT
WITH CHECK (true);

-- Admins can update alerts (for resolution)
CREATE POLICY "Admins can update alerts"
ON public.health_alerts
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for efficient querying
CREATE INDEX idx_health_alerts_created_at ON public.health_alerts(created_at DESC);
CREATE INDEX idx_health_alerts_overall_status ON public.health_alerts(overall_status);
CREATE INDEX idx_health_alerts_resolved ON public.health_alerts(resolved_at) WHERE resolved_at IS NULL;