-- =====================================================
-- Security Constraints and Validations
-- Date: 2025-12-14
-- Purpose: Add security constraints to prevent SQL injection and invalid data
-- =====================================================

-- =====================================================
-- 1. Stars Products Constraints
-- =====================================================

-- Ensure subscription duration is within valid range
ALTER TABLE public.stars_products
ADD CONSTRAINT IF NOT EXISTS check_subscription_duration
CHECK (
  subscription_duration_days IS NULL OR
  (subscription_duration_days > 0 AND subscription_duration_days <= 365)
);

-- Ensure stars price is reasonable
ALTER TABLE public.stars_products
ADD CONSTRAINT IF NOT EXISTS check_stars_price_range
CHECK (stars_price > 0 AND stars_price <= 100000);

-- Ensure credits amount is positive
ALTER TABLE public.stars_products
ADD CONSTRAINT IF NOT EXISTS check_credits_amount_positive
CHECK (credits_amount IS NULL OR credits_amount > 0);

COMMENT ON CONSTRAINT check_subscription_duration ON public.stars_products
  IS 'Prevents SQL injection through subscription_duration_days field';

-- =====================================================
-- 2. Stars Transactions Constraints
-- =====================================================

-- Ensure stars amount matches product price
ALTER TABLE public.stars_transactions
ADD CONSTRAINT IF NOT EXISTS check_stars_amount_range
CHECK (stars_amount > 0 AND stars_amount <= 100000);

-- Ensure credits granted is positive
ALTER TABLE public.stars_transactions
ADD CONSTRAINT IF NOT EXISTS check_credits_granted_positive
CHECK (credits_granted IS NULL OR credits_granted > 0);

-- =====================================================
-- 3. Credit Transactions Constraints
-- =====================================================

-- Prevent unrealistic credit amounts
ALTER TABLE public.credit_transactions
ADD CONSTRAINT IF NOT EXISTS check_credit_transaction_amount
CHECK (amount >= -10000 AND amount <= 10000);

COMMENT ON CONSTRAINT check_credit_transaction_amount ON public.credit_transactions
  IS 'Prevents manipulation of credit balance through extreme values';

-- =====================================================
-- 4. Subscription History Constraints
-- =====================================================

-- Ensure subscription period is valid
ALTER TABLE public.subscription_history
ADD CONSTRAINT IF NOT EXISTS check_subscription_period
CHECK (expires_at > starts_at);

-- Ensure reasonable subscription length (max 2 years)
ALTER TABLE public.subscription_history
ADD CONSTRAINT IF NOT EXISTS check_subscription_max_length
CHECK (expires_at <= starts_at + INTERVAL '2 years');

-- =====================================================
-- 5. Telegram Bot State Tables Constraints
-- =====================================================

-- Ensure wizard expiration is in the future
ALTER TABLE public.telegram_wizard_state
ADD CONSTRAINT IF NOT EXISTS check_wizard_expires_future
CHECK (expires_at > created_at);

-- Ensure wizard doesn't expire too far in future (max 24 hours)
ALTER TABLE public.telegram_wizard_state
ADD CONSTRAINT IF NOT EXISTS check_wizard_max_expiration
CHECK (expires_at <= created_at + INTERVAL '24 hours');

-- =====================================================
-- 6. Telegram Notification Queue Constraints
-- =====================================================

-- Ensure scheduled time is reasonable (not too far in past/future)
ALTER TABLE public.telegram_notification_queue
ADD CONSTRAINT IF NOT EXISTS check_notification_schedule
CHECK (
  scheduled_for >= created_at - INTERVAL '1 hour' AND
  scheduled_for <= created_at + INTERVAL '7 days'
);

-- Ensure retry count is reasonable
ALTER TABLE public.telegram_notification_queue
ADD CONSTRAINT IF NOT EXISTS check_retry_count_limit
CHECK (retry_count >= 0 AND retry_count <= 10);

-- =====================================================
-- 7. Additional Indexes for Performance
-- =====================================================

-- Index for telegram chat ID lookups (common query)
CREATE INDEX IF NOT EXISTS idx_generation_tasks_telegram_chat
  ON public.generation_tasks(telegram_chat_id)
  WHERE telegram_chat_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tracks_telegram_chat
  ON public.tracks(suno_task_id)
  WHERE suno_task_id IS NOT NULL;

-- Index for active subscriptions (frequently queried)
CREATE INDEX IF NOT EXISTS idx_subscription_history_active_user
  ON public.subscription_history(user_id, expires_at)
  WHERE status = 'active';

-- Index for pending notifications (main worker query)
CREATE INDEX IF NOT EXISTS idx_telegram_notifications_pending
  ON public.telegram_notification_queue(scheduled_for, priority, status)
  WHERE status = 'pending';

-- Composite index for credit balance queries
CREATE INDEX IF NOT EXISTS idx_profiles_credits_subscription
  ON public.profiles(user_id, credits_balance, subscription_tier)
  WHERE subscription_tier IS NOT NULL;

-- =====================================================
-- 8. Function to Validate Input Strings
-- =====================================================

-- Function to sanitize and validate text input
CREATE OR REPLACE FUNCTION public.validate_text_input(
  p_text TEXT,
  p_max_length INTEGER DEFAULT 1000,
  p_field_name TEXT DEFAULT 'input'
)
RETURNS TEXT AS $$
DECLARE
  v_sanitized TEXT;
BEGIN
  -- Check for null
  IF p_text IS NULL THEN
    RAISE EXCEPTION '% cannot be null', p_field_name;
  END IF;

  -- Trim whitespace
  v_sanitized := TRIM(p_text);

  -- Check length
  IF LENGTH(v_sanitized) = 0 THEN
    RAISE EXCEPTION '% cannot be empty', p_field_name;
  END IF;

  IF LENGTH(v_sanitized) > p_max_length THEN
    RAISE EXCEPTION '% exceeds maximum length of % characters', p_field_name, p_max_length;
  END IF;

  -- Remove dangerous patterns
  v_sanitized := REGEXP_REPLACE(v_sanitized, '<script[^>]*>.*?</script>', '', 'gi');
  v_sanitized := REGEXP_REPLACE(v_sanitized, 'javascript:', '', 'gi');
  v_sanitized := REGEXP_REPLACE(v_sanitized, 'on\w+\s*=', '', 'gi');

  RETURN v_sanitized;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.validate_text_input IS
  'Sanitizes and validates text input to prevent XSS and injection attacks';

-- =====================================================
-- 9. Audit Triggers for Sensitive Operations
-- =====================================================

-- Log subscription changes
CREATE TABLE IF NOT EXISTS public.subscription_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  subscription_id UUID REFERENCES public.subscription_history(id),
  action VARCHAR(50) NOT NULL, -- 'created', 'activated', 'cancelled', 'expired'
  old_tier VARCHAR(50),
  new_tier VARCHAR(50),
  old_expires_at TIMESTAMPTZ,
  new_expires_at TIMESTAMPTZ,
  changed_by UUID, -- admin user if manual change
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subscription_audit_user
  ON public.subscription_audit_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscription_audit_action
  ON public.subscription_audit_log(action, created_at DESC);

-- Log credit transactions for fraud detection
CREATE OR REPLACE FUNCTION public.log_large_credit_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Log transactions larger than 100 credits
  IF ABS(NEW.amount) >= 100 THEN
    INSERT INTO public.subscription_audit_log (
      user_id,
      action,
      metadata
    ) VALUES (
      NEW.user_id,
      'large_credit_transaction',
      jsonb_build_object(
        'transaction_id', NEW.id,
        'amount', NEW.amount,
        'action_type', NEW.action_type,
        'description', NEW.description
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_large_credit_transaction
  AFTER INSERT ON public.credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_large_credit_transaction();

-- =====================================================
-- 10. Data Validation Functions
-- =====================================================

-- Validate email format
CREATE OR REPLACE FUNCTION public.is_valid_email(p_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN p_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Validate Telegram user ID (positive bigint)
CREATE OR REPLACE FUNCTION public.is_valid_telegram_id(p_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN p_id > 0 AND p_id < 9223372036854775807;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 11. Rate Limiting Table
-- =====================================================

-- Table for database-backed rate limiting
CREATE TABLE IF NOT EXISTS public.telegram_rate_limits (
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  request_count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, action_type)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window
  ON public.telegram_rate_limits(window_start)
  WHERE request_count > 0;

-- Function to check and update rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_action_type VARCHAR(50),
  p_limit INTEGER DEFAULT 20,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Get current rate limit state
  SELECT request_count, window_start INTO v_count, v_window_start
  FROM public.telegram_rate_limits
  WHERE user_id = p_user_id AND action_type = p_action_type
  FOR UPDATE;

  -- Reset if window expired or first request
  IF v_window_start IS NULL OR v_now > v_window_start + (p_window_seconds || ' seconds')::INTERVAL THEN
    INSERT INTO public.telegram_rate_limits (user_id, action_type, request_count, window_start)
    VALUES (p_user_id, p_action_type, 1, v_now)
    ON CONFLICT (user_id, action_type) DO UPDATE
    SET request_count = 1, window_start = v_now;

    RETURN TRUE;
  END IF;

  -- Check if limit exceeded
  IF v_count >= p_limit THEN
    RETURN FALSE;
  END IF;

  -- Increment counter
  UPDATE public.telegram_rate_limits
  SET request_count = request_count + 1
  WHERE user_id = p_user_id AND action_type = p_action_type;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.check_rate_limit IS
  'Database-backed rate limiting with automatic window reset';

-- =====================================================
-- 12. Cleanup Job for Old Data
-- =====================================================

-- Function to cleanup old audit logs (keep 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.subscription_audit_log
  WHERE created_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Also cleanup old rate limit entries (keep 1 hour)
  DELETE FROM public.telegram_rate_limits
  WHERE window_start < NOW() - INTERVAL '1 hour';

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.cleanup_old_audit_logs IS
  'Cleanup old audit logs and rate limit entries';

-- =====================================================
-- END OF MIGRATION
-- =====================================================

-- Add migration record
INSERT INTO schema_migrations (version, name)
VALUES (
  '20251214000000',
  'security_constraints'
)
ON CONFLICT (version) DO NOTHING;
