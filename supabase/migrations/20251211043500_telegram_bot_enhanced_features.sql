-- ============================================================================
-- Telegram Bot Enhanced Features Migration
-- Version: 1.0
-- Date: 2025-12-11
-- ============================================================================

-- Description:
-- This migration adds support for advanced bot features including:
-- - Multi-level menu navigation with state persistence
-- - Step-by-step wizard workflows
-- - Smart notification queue with priority levels
-- - Bot analytics and metrics

-- ============================================================================
-- 1. Menu State Management
-- ============================================================================

-- Store menu navigation state for each user
CREATE TABLE IF NOT EXISTS telegram_menu_state (
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  menu_stack JSONB NOT NULL DEFAULT '[]'::jsonb,
  context_stack JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_telegram_menu_state_user 
  ON telegram_menu_state(user_id);

-- Index for cleanup of stale states
CREATE INDEX IF NOT EXISTS idx_telegram_menu_state_updated 
  ON telegram_menu_state(last_updated);

-- ============================================================================
-- 2. Wizard State Management
-- ============================================================================

-- Store wizard workflow state for each user
CREATE TABLE IF NOT EXISTS telegram_wizard_state (
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  wizard_type VARCHAR(50) NOT NULL,
  current_step VARCHAR(50) NOT NULL,
  selections JSONB NOT NULL DEFAULT '{}'::jsonb,
  message_id BIGINT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, wizard_type)
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_telegram_wizard_state_user 
  ON telegram_wizard_state(user_id);

-- Index for expiration cleanup
CREATE INDEX IF NOT EXISTS idx_telegram_wizard_state_expires 
  ON telegram_wizard_state(expires_at) 
  WHERE expires_at > NOW();

-- ============================================================================
-- 3. Notification Queue
-- ============================================================================

-- Smart notification queue with priority and scheduling
CREATE TABLE IF NOT EXISTS telegram_notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  priority INTEGER NOT NULL DEFAULT 3,
  payload JSONB NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Status values: 'pending', 'sent', 'failed', 'cancelled'
  CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  
  -- Priority values: 1=CRITICAL, 2=HIGH, 3=MEDIUM, 4=LOW
  CONSTRAINT valid_priority CHECK (priority BETWEEN 1 AND 4)
);

-- Index for user notifications
CREATE INDEX IF NOT EXISTS idx_telegram_notification_queue_user 
  ON telegram_notification_queue(user_id);

-- Index for scheduled notifications (main query)
CREATE INDEX IF NOT EXISTS idx_telegram_notification_scheduled 
  ON telegram_notification_queue(scheduled_for, status, priority) 
  WHERE status = 'pending';

-- Index for status tracking
CREATE INDEX IF NOT EXISTS idx_telegram_notification_status 
  ON telegram_notification_queue(status, created_at);

-- ============================================================================
-- 4. Bot Analytics
-- ============================================================================

-- Track bot usage and user behavior
CREATE TABLE IF NOT EXISTS telegram_bot_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user analytics
CREATE INDEX IF NOT EXISTS idx_telegram_bot_analytics_user 
  ON telegram_bot_analytics(user_id);

-- Index for event type analysis
CREATE INDEX IF NOT EXISTS idx_telegram_bot_analytics_event 
  ON telegram_bot_analytics(event_type, created_at);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_telegram_bot_analytics_created 
  ON telegram_bot_analytics(created_at DESC);

-- ============================================================================
-- 5. Functions
-- ============================================================================

-- Function to cleanup expired wizard states
CREATE OR REPLACE FUNCTION cleanup_expired_wizard_states()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM telegram_wizard_state
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old menu states (>24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_menu_states()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM telegram_menu_state
  WHERE last_updated < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get pending notifications for processing
CREATE OR REPLACE FUNCTION get_pending_telegram_notifications(
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  notification_type VARCHAR(50),
  priority INTEGER,
  payload JSONB,
  retry_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.user_id,
    n.notification_type,
    n.priority,
    n.payload,
    n.retry_count
  FROM telegram_notification_queue n
  WHERE n.status = 'pending'
    AND n.scheduled_for <= NOW()
    AND n.retry_count < 3
  ORDER BY n.priority ASC, n.scheduled_for ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to mark notification as sent
CREATE OR REPLACE FUNCTION mark_telegram_notification_sent(
  p_notification_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE telegram_notification_queue
  SET 
    status = 'sent',
    sent_at = NOW()
  WHERE id = p_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark notification as failed
CREATE OR REPLACE FUNCTION mark_telegram_notification_failed(
  p_notification_id UUID,
  p_error_message TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE telegram_notification_queue
  SET 
    status = 'failed',
    error_message = p_error_message,
    retry_count = retry_count + 1
  WHERE id = p_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to track bot event
CREATE OR REPLACE FUNCTION track_telegram_bot_event(
  p_user_id UUID,
  p_event_type VARCHAR(50),
  p_event_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO telegram_bot_analytics (user_id, event_type, event_data)
  VALUES (p_user_id, p_event_type, p_event_data)
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE telegram_menu_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_wizard_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_bot_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own menu state
CREATE POLICY telegram_menu_state_user_access ON telegram_menu_state
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can only access their own wizard state
CREATE POLICY telegram_wizard_state_user_access ON telegram_wizard_state
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can only read their own notifications
CREATE POLICY telegram_notification_user_read ON telegram_notification_queue
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can only read their own analytics
CREATE POLICY telegram_analytics_user_read ON telegram_bot_analytics
  FOR SELECT
  USING (user_id = auth.uid());

-- Service role has full access (for bot operations)
CREATE POLICY telegram_menu_state_service_all ON telegram_menu_state
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY telegram_wizard_state_service_all ON telegram_wizard_state
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY telegram_notification_service_all ON telegram_notification_queue
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY telegram_analytics_service_all ON telegram_bot_analytics
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 7. Scheduled Cleanup Jobs
-- ============================================================================

-- Note: These would typically be set up with pg_cron or external schedulers
-- For now, we document them here for manual/external execution

-- Cleanup expired wizard states (run every 5 minutes)
-- SELECT cron.schedule('cleanup-expired-wizards', '*/5 * * * *', 
--   'SELECT cleanup_expired_wizard_states()');

-- Cleanup old menu states (run daily at 3 AM)
-- SELECT cron.schedule('cleanup-old-menus', '0 3 * * *', 
--   'SELECT cleanup_old_menu_states()');

-- Cleanup old analytics (run monthly, keep 90 days)
-- SELECT cron.schedule('cleanup-old-analytics', '0 4 1 * *', 
--   'DELETE FROM telegram_bot_analytics WHERE created_at < NOW() - INTERVAL ''90 days''');

-- ============================================================================
-- 8. Comments
-- ============================================================================

COMMENT ON TABLE telegram_menu_state IS 
  'Stores menu navigation state for Telegram bot users';

COMMENT ON TABLE telegram_wizard_state IS 
  'Stores step-by-step wizard workflow state for Telegram bot users';

COMMENT ON TABLE telegram_notification_queue IS 
  'Smart notification queue with priority and scheduling for Telegram bot';

COMMENT ON TABLE telegram_bot_analytics IS 
  'Analytics and usage tracking for Telegram bot events';

COMMENT ON FUNCTION cleanup_expired_wizard_states() IS 
  'Deletes wizard states that have expired';

COMMENT ON FUNCTION cleanup_old_menu_states() IS 
  'Deletes menu states older than 24 hours';

COMMENT ON FUNCTION get_pending_telegram_notifications(INTEGER) IS 
  'Retrieves pending notifications for processing';

COMMENT ON FUNCTION track_telegram_bot_event(UUID, VARCHAR, JSONB) IS 
  'Tracks a bot event for analytics';

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Add migration record
INSERT INTO schema_migrations (version, name) 
VALUES (
  '20251211043500', 
  'telegram_bot_enhanced_features'
)
ON CONFLICT (version) DO NOTHING;
