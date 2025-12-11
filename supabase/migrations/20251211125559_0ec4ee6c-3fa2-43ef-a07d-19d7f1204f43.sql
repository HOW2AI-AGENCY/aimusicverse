
-- Sprint 014-D: Таблица аналитики диплинков
CREATE TABLE public.deeplink_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_id TEXT,
  deeplink_type TEXT NOT NULL,
  deeplink_value TEXT,
  source TEXT,
  campaign TEXT,
  referrer TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  converted BOOLEAN DEFAULT false,
  conversion_type TEXT
);

-- Sprint 014-E: Таблица событий аналитики поведения
CREATE TABLE public.user_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_id TEXT,
  event_type TEXT NOT NULL,
  event_name TEXT,
  page_path TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Индексы для deeplink_analytics
CREATE INDEX idx_deeplink_analytics_user_id ON public.deeplink_analytics(user_id);
CREATE INDEX idx_deeplink_analytics_type ON public.deeplink_analytics(deeplink_type);
CREATE INDEX idx_deeplink_analytics_source ON public.deeplink_analytics(source);
CREATE INDEX idx_deeplink_analytics_created_at ON public.deeplink_analytics(created_at DESC);
CREATE INDEX idx_deeplink_analytics_converted ON public.deeplink_analytics(converted) WHERE converted = true;

-- Индексы для user_analytics_events
CREATE INDEX idx_user_analytics_events_user_id ON public.user_analytics_events(user_id);
CREATE INDEX idx_user_analytics_events_event_type ON public.user_analytics_events(event_type);
CREATE INDEX idx_user_analytics_events_created_at ON public.user_analytics_events(created_at DESC);
CREATE INDEX idx_user_analytics_events_session ON public.user_analytics_events(session_id);

-- RLS для deeplink_analytics
ALTER TABLE public.deeplink_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service can insert deeplink analytics"
ON public.deeplink_analytics
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all deeplink analytics"
ON public.deeplink_analytics
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own deeplink analytics"
ON public.deeplink_analytics
FOR SELECT
USING (auth.uid() = user_id);

-- RLS для user_analytics_events
ALTER TABLE public.user_analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service can insert analytics events"
ON public.user_analytics_events
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all analytics events"
ON public.user_analytics_events
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own analytics events"
ON public.user_analytics_events
FOR SELECT
USING (auth.uid() = user_id);
