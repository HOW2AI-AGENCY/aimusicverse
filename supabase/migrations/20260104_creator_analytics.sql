-- Creator Analytics Dashboard - Database Migration
-- Feature: specs/001-creator-analytics
-- Date: 2026-01-04
-- Description: Creates all analytics tables, indexes, RLS policies, and functions

-- ============================================================================
-- TABLE 1: analytics_events (Raw Event Data - 90 Day Retention)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES public.track_versions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Nullable for anonymous
  event_type TEXT NOT NULL CHECK (event_type IN ('play', 'complete', 'skip', 'like', 'share', 'comment', 'playlist_add')),
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW() CHECK (event_timestamp <= NOW()), -- Cannot be future
  listen_duration INTEGER CHECK (listen_duration >= 0), -- Seconds, nullable
  completion_percentage INTEGER CHECK (completion_percentage BETWEEN 0 AND 100), -- Nullable
  user_age_range TEXT CHECK (user_age_range IN ('13-17', '18-24', '25-34', '35-44', '45-54', '55+')),
  user_country TEXT CHECK (LENGTH(user_country) = 2), -- ISO 3166-1 alpha-2
  session_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for analytics_events
CREATE INDEX idx_analytics_events_track_id ON public.analytics_events(track_id);
CREATE INDEX idx_analytics_events_timestamp ON public.analytics_events(event_timestamp DESC);
CREATE INDEX idx_analytics_events_track_ts ON public.analytics_events(track_id, event_timestamp DESC);
CREATE INDEX idx_analytics_events_version ON public.analytics_events(version_id);
CREATE INDEX idx_analytics_events_user ON public.analytics_events(user_id) WHERE user_id IS NOT NULL;

-- Partition by month for performance (manual for now)
-- Future: Auto-partition using pg_partman or similar

-- TTL: 90-day retention policy (cleanup via scheduled function)
COMMENT ON TABLE public.analytics_events IS 'Raw analytics events, retained for 90 days';

-- ============================================================================
-- TABLE 2: track_analytics (Daily Aggregated Metrics - Permanent)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.track_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  version_id UUID REFERENCES public.track_versions(id) ON DELETE CASCADE, -- NULL = aggregated across versions
  date DATE NOT NULL,
  play_count INTEGER NOT NULL DEFAULT 0 CHECK (play_count >= 0),
  unique_listeners INTEGER NOT NULL DEFAULT 0 CHECK (unique_listeners >= 0),
  completion_count INTEGER NOT NULL DEFAULT 0 CHECK (completion_count >= 0),
  completion_rate NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (completion_rate BETWEEN 0 AND 100),
  average_listen_duration NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (average_listen_duration >= 0),
  skip_count INTEGER NOT NULL DEFAULT 0 CHECK (skip_count >= 0),
  skip_rate NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (skip_rate BETWEEN 0 AND 100),
  like_count INTEGER NOT NULL DEFAULT 0 CHECK (like_count >= 0),
  comment_count INTEGER NOT NULL DEFAULT 0 CHECK (comment_count >= 0),
  share_count INTEGER NOT NULL DEFAULT 0 CHECK (share_count >= 0),
  playlist_add_count INTEGER NOT NULL DEFAULT 0 CHECK (playlist_add_count >= 0),
  engagement_rate NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (engagement_rate BETWEEN 0 AND 100),
  viral_coefficient NUMERIC(10,4) NOT NULL DEFAULT 0 CHECK (viral_coefficient >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(track_id, version_id, date) -- Prevent duplicate aggregations
);

-- Indexes for track_analytics
CREATE INDEX idx_track_analytics_track_date ON public.track_analytics(track_id, date DESC);
CREATE INDEX idx_track_analytics_track ON public.track_analytics(track_id);
CREATE INDEX idx_track_analytics_date ON public.track_analytics(date DESC);
CREATE INDEX idx_track_analytics_version ON public.track_analytics(version_id) WHERE version_id IS NOT NULL;

COMMENT ON TABLE public.track_analytics IS 'Daily aggregated analytics metrics, permanently retained';

-- ============================================================================
-- TABLE 3: demographic_summaries (Privacy-Safe Demographics - Permanent)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.demographic_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  age_distribution JSONB NOT NULL DEFAULT '{}', -- {"18-24": 45.2, "25-34": 30.1, ...}
  geographic_distribution JSONB NOT NULL DEFAULT '[]', -- [{"country": "US", "country_code": "US", "percentage": 35.5, "listener_count": 1234}]
  peak_listening_hours INTEGER[] NOT NULL DEFAULT '{}', -- Array of hours 0-23
  average_session_duration NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_unique_listeners INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(track_id, date_range_start, date_range_end),
  CHECK (date_range_end >= date_range_start),
  CHECK (total_unique_listeners >= 100) -- Privacy threshold: Only create when sufficient data
);

-- Indexes for demographic_summaries
CREATE INDEX idx_demographic_track ON public.demographic_summaries(track_id);
CREATE INDEX idx_demographic_date_range ON public.demographic_summaries(track_id, date_range_end DESC);

COMMENT ON TABLE public.demographic_summaries IS 'Privacy-safe demographic rollups, only created when play_count >= 100';

-- ============================================================================
-- TABLE 4: revenue_summaries (Financial Metrics - Permanent)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.revenue_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  total_revenue INTEGER NOT NULL DEFAULT 0 CHECK (total_revenue >= 0), -- USD cents
  revenue_by_source JSONB NOT NULL DEFAULT '{"platform_plays": 0, "tips": 0, "premium_subscriptions": 0}',
  rpm NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (rpm >= 0), -- Revenue per 1000 plays
  projected_30_day_revenue INTEGER NOT NULL DEFAULT 0,
  projected_90_day_revenue INTEGER NOT NULL DEFAULT 0,
  settled_revenue INTEGER NOT NULL DEFAULT 0 CHECK (settled_revenue >= 0),
  pending_revenue INTEGER NOT NULL DEFAULT 0 CHECK (pending_revenue >= 0),
  pending_settlement_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(track_id, date_range_start, date_range_end),
  CHECK (date_range_end >= date_range_start),
  CHECK (total_revenue = settled_revenue + pending_revenue)
);

-- Indexes for revenue_summaries
CREATE INDEX idx_revenue_track ON public.revenue_summaries(track_id);
CREATE INDEX idx_revenue_date_range ON public.revenue_summaries(track_id, date_range_end DESC);

COMMENT ON TABLE public.revenue_summaries IS 'Financial metrics and revenue projections';

-- ============================================================================
-- TABLE 5: analytics_exports (Export Job Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.analytics_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  track_ids UUID[], -- NULL means all tracks
  format TEXT NOT NULL CHECK (format IN ('csv', 'pdf', 'json')),
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  download_url TEXT,
  file_size BIGINT CHECK (file_size > 0),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  CHECK (date_range_end >= date_range_start),
  CHECK (status != 'completed' OR download_url IS NOT NULL),
  CHECK (status != 'completed' OR file_size IS NOT NULL),
  CHECK (status != 'completed' OR expires_at IS NOT NULL)
);

-- Indexes for analytics_exports
CREATE INDEX idx_exports_user ON public.analytics_exports(user_id);
CREATE INDEX idx_exports_status ON public.analytics_exports(status) WHERE status IN ('pending', 'processing');
CREATE INDEX idx_exports_created ON public.analytics_exports(created_at DESC);

COMMENT ON TABLE public.analytics_exports IS 'Export job tracking with 7-day download link expiry';

-- ============================================================================
-- TABLE 6: notification_preferences (User Notification Settings)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  milestones_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  trending_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  charts_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.notification_preferences IS 'User notification preferences for analytics alerts';

-- ============================================================================
-- TABLE 7: notification_log (Rate Limiting Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  track_id UUID REFERENCES public.tracks(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('milestone', 'trending', 'charts')),
  milestone_value TEXT, -- e.g., '1K', '10K', '100K', '1M'
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  telegram_message_id TEXT
);

-- Indexes for notification_log
CREATE INDEX idx_notif_log_user_sent ON public.notification_log(user_id, sent_at DESC);
CREATE INDEX idx_notif_log_track ON public.notification_log(track_id) WHERE track_id IS NOT NULL;

COMMENT ON TABLE public.notification_log IS 'Notification delivery log for rate limiting and auditing';

-- ============================================================================
-- MATERIALIZED VIEW: Current Day Analytics (Real-Time)
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_current_day_analytics AS
SELECT 
  track_id,
  version_id,
  CURRENT_DATE AS date,
  COUNT(*) FILTER (WHERE event_type = 'play') AS play_count,
  COUNT(DISTINCT user_id) AS unique_listeners,
  COUNT(*) FILTER (WHERE event_type = 'complete') AS completion_count,
  ROUND(
    (COUNT(*) FILTER (WHERE event_type = 'complete')::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE event_type = 'play'), 0) * 100)::NUMERIC, 
    2
  ) AS completion_rate,
  ROUND(
    AVG(listen_duration) FILTER (WHERE listen_duration IS NOT NULL)::NUMERIC,
    2
  ) AS average_listen_duration,
  COUNT(*) FILTER (WHERE event_type = 'skip') AS skip_count,
  ROUND(
    (COUNT(*) FILTER (WHERE event_type = 'skip')::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE event_type = 'play'), 0) * 100)::NUMERIC,
    2
  ) AS skip_rate,
  COUNT(*) FILTER (WHERE event_type = 'like') AS like_count,
  COUNT(*) FILTER (WHERE event_type = 'comment') AS comment_count,
  COUNT(*) FILTER (WHERE event_type = 'share') AS share_count,
  COUNT(*) FILTER (WHERE event_type = 'playlist_add') AS playlist_add_count,
  ROUND(
    ((COUNT(*) FILTER (WHERE event_type IN ('like', 'comment', 'share'))::NUMERIC) / 
     NULLIF(COUNT(*) FILTER (WHERE event_type = 'play'), 0) * 100)::NUMERIC,
    2
  ) AS engagement_rate,
  ROUND(
    (COUNT(*) FILTER (WHERE event_type = 'share')::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE event_type = 'play'), 0))::NUMERIC,
    4
  ) AS viral_coefficient
FROM public.analytics_events
WHERE event_timestamp >= CURRENT_DATE
GROUP BY track_id, version_id;

CREATE UNIQUE INDEX ON public.mv_current_day_analytics(track_id, version_id);

COMMENT ON MATERIALIZED VIEW public.mv_current_day_analytics IS 'Real-time current-day metrics, refreshed every 5 minutes';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demographic_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: analytics_events (No direct SELECT, only via aggregation functions)
-- Users cannot query raw events directly for privacy
CREATE POLICY "Service role only for analytics_events"
ON public.analytics_events
FOR ALL
TO service_role
USING (true);

-- RLS Policy: track_analytics (Users can view their own tracks)
CREATE POLICY "Users can view analytics for their own tracks"
ON public.track_analytics
FOR SELECT
USING (
  track_id IN (
    SELECT id FROM public.tracks WHERE user_id = auth.uid()
  )
);

-- RLS Policy: demographic_summaries (Users can view their own tracks)
CREATE POLICY "Users can view demographics for their own tracks"
ON public.demographic_summaries
FOR SELECT
USING (
  track_id IN (
    SELECT id FROM public.tracks WHERE user_id = auth.uid()
  )
);

-- RLS Policy: revenue_summaries (Users can view their own tracks)
CREATE POLICY "Users can view revenue for their own tracks"
ON public.revenue_summaries
FOR SELECT
USING (
  track_id IN (
    SELECT id FROM public.tracks WHERE user_id = auth.uid()
  )
);

-- RLS Policy: analytics_exports (Users can manage their own exports)
CREATE POLICY "Users can manage their own exports"
ON public.analytics_exports
FOR ALL
USING (user_id = auth.uid());

-- RLS Policy: notification_preferences (Users can manage their own preferences)
CREATE POLICY "Users can manage their own notification preferences"
ON public.notification_preferences
FOR ALL
USING (user_id = auth.uid());

-- RLS Policy: notification_log (Users can view their own notifications)
CREATE POLICY "Users can view their own notification log"
ON public.notification_log
FOR SELECT
USING (user_id = auth.uid());

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: track_analytics updated_at
CREATE TRIGGER update_track_analytics_updated_at
  BEFORE UPDATE ON public.track_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: demographic_summaries updated_at
CREATE TRIGGER update_demographic_summaries_updated_at
  BEFORE UPDATE ON public.demographic_summaries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: revenue_summaries updated_at
CREATE TRIGGER update_revenue_summaries_updated_at
  BEFORE UPDATE ON public.revenue_summaries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function: Cleanup expired analytics_events (90-day TTL)
CREATE OR REPLACE FUNCTION public.cleanup_expired_analytics_events()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.analytics_events
  WHERE event_timestamp < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % expired analytics_events', deleted_count;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_expired_analytics_events IS 'Deletes analytics_events older than 90 days';

-- Function: Cleanup expired export files
CREATE OR REPLACE FUNCTION public.cleanup_expired_exports()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.analytics_exports
  WHERE expires_at < NOW() AND status = 'completed';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % expired exports', deleted_count;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_expired_exports IS 'Deletes completed exports past expiration (7 days)';

-- ============================================================================
-- DEFAULT DATA: Notification Preferences for Existing Users
-- ============================================================================

INSERT INTO public.notification_preferences (user_id, milestones_enabled, trending_enabled, charts_enabled)
SELECT id, TRUE, TRUE, TRUE
FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant authenticated users access to analytics tables (via RLS)
GRANT SELECT ON public.track_analytics TO authenticated;
GRANT SELECT ON public.demographic_summaries TO authenticated;
GRANT SELECT ON public.revenue_summaries TO authenticated;
GRANT ALL ON public.analytics_exports TO authenticated;
GRANT ALL ON public.notification_preferences TO authenticated;
GRANT SELECT ON public.notification_log TO authenticated;

-- Grant service role full access (for Edge Functions)
GRANT ALL ON public.analytics_events TO service_role;
GRANT ALL ON public.track_analytics TO service_role;
GRANT ALL ON public.demographic_summaries TO service_role;
GRANT ALL ON public.revenue_summaries TO service_role;
GRANT ALL ON public.analytics_exports TO service_role;
GRANT ALL ON public.notification_preferences TO service_role;
GRANT ALL ON public.notification_log TO service_role;
GRANT SELECT ON public.mv_current_day_analytics TO service_role;

-- ============================================================================
-- COMPLETION
-- ============================================================================

-- Migration complete
DO $$
BEGIN
  RAISE NOTICE 'Creator Analytics Dashboard migration complete';
  RAISE NOTICE 'Tables created: 7';
  RAISE NOTICE 'Indexes created: 16+';
  RAISE NOTICE 'RLS policies created: 7';
  RAISE NOTICE 'Functions created: 3';
  RAISE NOTICE 'Materialized view created: 1';
END
$$;
