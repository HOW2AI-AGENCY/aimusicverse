-- Migration: Create Stars Database Functions and Indexes
-- Date: 2025-12-12
-- Tasks: T021-T028

BEGIN;

-- ============================================================================
-- Function 1: Process Stars Payment
-- ============================================================================
-- Allocates credits and updates subscription based on successful payment
-- Idempotent: Safe to call multiple times with same telegram_charge_id

CREATE OR REPLACE FUNCTION public.process_stars_payment(
  p_telegram_charge_id TEXT,
  p_user_id UUID,
  p_product_id UUID,
  p_amount_stars INTEGER,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_id UUID;
  v_product RECORD;
  v_result JSONB;
BEGIN
  -- Check for duplicate (idempotency)
  SELECT id INTO v_transaction_id
  FROM stars_transactions
  WHERE telegram_charge_id = p_telegram_charge_id;
  
  IF v_transaction_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'duplicate', true,
      'transaction_id', v_transaction_id
    );
  END IF;
  
  -- Get product details
  SELECT * INTO v_product
  FROM stars_products
  WHERE id = p_product_id AND is_active = true;
  
  IF v_product IS NULL THEN
    RAISE EXCEPTION 'Product not found or inactive: %', p_product_id;
  END IF;
  
  -- Validate amount
  IF p_amount_stars != v_product.price_stars THEN
    RAISE EXCEPTION 'Amount mismatch: expected %, got %', v_product.price_stars, p_amount_stars;
  END IF;
  
  -- Begin transaction
  BEGIN
    -- Insert Stars transaction
    INSERT INTO stars_transactions (
      user_id, product_id, telegram_charge_id,
      amount_stars, status, metadata, completed_at
    ) VALUES (
      p_user_id, p_product_id, p_telegram_charge_id,
      p_amount_stars, 'completed', p_metadata, NOW()
    )
    RETURNING id INTO v_transaction_id;
    
    -- Handle credits
    IF v_product.product_type = 'credits' THEN
      -- Allocate credits
      INSERT INTO credit_transactions (
        user_id, amount, transaction_type, action_type,
        description, stars_transaction_id
      ) VALUES (
        p_user_id, v_product.credits_amount, 'earn', 'purchase',
        format('Purchased %s credits via Telegram Stars', v_product.credits_amount),
        v_transaction_id
      );
      
      -- Update user balance
      UPDATE profiles
      SET credits = COALESCE(credits, 0) + v_product.credits_amount
      WHERE user_id = p_user_id;
      
    -- Handle subscription
    ELSIF v_product.product_type = 'subscription' THEN
      -- Update subscription
      UPDATE profiles
      SET 
        subscription_tier = v_product.subscription_tier,
        subscription_expires_at = NOW() + (v_product.subscription_days || ' days')::INTERVAL,
        auto_renew = true
      WHERE user_id = p_user_id;
      
      -- Log subscription change
      INSERT INTO subscription_history (
        user_id, tier, action, stars_transaction_id,
        new_tier, new_expires_at
      ) VALUES (
        p_user_id, v_product.subscription_tier, 'subscribe', v_transaction_id,
        v_product.subscription_tier, NOW() + (v_product.subscription_days || ' days')::INTERVAL
      );
    END IF;
    
    -- Build result
    v_result := jsonb_build_object(
      'success', true,
      'duplicate', false,
      'transaction_id', v_transaction_id,
      'product_type', v_product.product_type,
      'credits_allocated', v_product.credits_amount,
      'subscription_tier', v_product.subscription_tier
    );
    
    RETURN v_result;
    
  EXCEPTION WHEN OTHERS THEN
    -- Mark transaction as failed
    UPDATE stars_transactions
    SET status = 'failed', failure_reason = SQLERRM
    WHERE id = v_transaction_id;
    
    RAISE;
  END;
END;
$$;

COMMENT ON FUNCTION process_stars_payment IS 'Process successful Stars payment (idempotent)';

-- ============================================================================
-- Function 2: Check Subscription Status
-- ============================================================================
-- Returns user subscription details and expiry status

CREATE OR REPLACE FUNCTION public.get_subscription_status(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_is_active BOOLEAN;
  v_days_remaining INTEGER;
BEGIN
  SELECT 
    subscription_tier,
    subscription_expires_at,
    auto_renew
  INTO v_profile
  FROM profiles
  WHERE user_id = p_user_id;
  
  IF v_profile IS NULL THEN
    RETURN jsonb_build_object('error', 'User not found');
  END IF;
  
  -- Check if subscription is active
  v_is_active := (
    v_profile.subscription_tier != 'free' AND
    (v_profile.subscription_expires_at IS NULL OR v_profile.subscription_expires_at > NOW())
  );
  
  -- Calculate days remaining
  IF v_profile.subscription_expires_at IS NOT NULL THEN
    v_days_remaining := EXTRACT(DAY FROM v_profile.subscription_expires_at - NOW())::INTEGER;
  ELSE
    v_days_remaining := NULL; -- Lifetime or free
  END IF;
  
  RETURN jsonb_build_object(
    'tier', v_profile.subscription_tier,
    'is_active', v_is_active,
    'expires_at', v_profile.subscription_expires_at,
    'days_remaining', v_days_remaining,
    'auto_renew', v_profile.auto_renew
  );
END;
$$;

COMMENT ON FUNCTION get_subscription_status IS 'Get user subscription status and expiry';

-- ============================================================================
-- Function 3: Get Payment Statistics (Admin)
-- ============================================================================
-- Returns payment analytics for admin dashboard

CREATE OR REPLACE FUNCTION public.get_stars_payment_stats(
  p_from_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_to_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_transactions INTEGER;
  v_total_revenue_stars INTEGER;
  v_success_rate NUMERIC;
  v_top_products JSONB;
  v_active_subscriptions INTEGER;
BEGIN
  -- Total transactions
  SELECT COUNT(*) INTO v_total_transactions
  FROM stars_transactions
  WHERE created_at BETWEEN p_from_date AND p_to_date;
  
  -- Total revenue
  SELECT COALESCE(SUM(amount_stars), 0) INTO v_total_revenue_stars
  FROM stars_transactions
  WHERE status = 'completed'
    AND created_at BETWEEN p_from_date AND p_to_date;
  
  -- Success rate
  SELECT 
    CASE WHEN COUNT(*) > 0 
      THEN ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'completed') / COUNT(*), 2)
      ELSE 0
    END
  INTO v_success_rate
  FROM stars_transactions
  WHERE created_at BETWEEN p_from_date AND p_to_date;
  
  -- Top products
  SELECT jsonb_agg(
    jsonb_build_object(
      'product_name', sp.name,
      'sku', sp.sku,
      'sales_count', product_stats.sales_count,
      'revenue_stars', product_stats.revenue_stars
    )
  ) INTO v_top_products
  FROM (
    SELECT 
      product_id,
      COUNT(*) as sales_count,
      SUM(amount_stars) as revenue_stars
    FROM stars_transactions
    WHERE status = 'completed'
      AND created_at BETWEEN p_from_date AND p_to_date
    GROUP BY product_id
    ORDER BY revenue_stars DESC
    LIMIT 5
  ) product_stats
  JOIN stars_products sp ON sp.id = product_stats.product_id;
  
  -- Active subscriptions
  SELECT COUNT(*) INTO v_active_subscriptions
  FROM profiles
  WHERE subscription_tier != 'free'
    AND (subscription_expires_at IS NULL OR subscription_expires_at > NOW());
  
  RETURN jsonb_build_object(
    'period', jsonb_build_object('from', p_from_date, 'to', p_to_date),
    'total_transactions', v_total_transactions,
    'total_revenue_stars', v_total_revenue_stars,
    'success_rate', v_success_rate,
    'top_products', COALESCE(v_top_products, '[]'::jsonb),
    'active_subscriptions', v_active_subscriptions
  );
END;
$$;

COMMENT ON FUNCTION get_stars_payment_stats IS 'Get payment analytics for admin dashboard';

-- ============================================================================
-- Indexes: stars_products
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_stars_products_sku ON stars_products(sku);
CREATE INDEX IF NOT EXISTS idx_stars_products_type_active ON stars_products(product_type, is_active);
CREATE INDEX IF NOT EXISTS idx_stars_products_display_order ON stars_products(display_order) WHERE is_active = true;

-- ============================================================================
-- Indexes: stars_transactions
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_stars_transactions_charge_id ON stars_transactions(telegram_charge_id); -- Idempotency
CREATE INDEX IF NOT EXISTS idx_stars_transactions_user_id ON stars_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_stars_transactions_created_at ON stars_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stars_transactions_status ON stars_transactions(status);
CREATE INDEX IF NOT EXISTS idx_stars_transactions_product_id ON stars_transactions(product_id);

-- ============================================================================
-- Indexes: subscription_history
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_created_at ON subscription_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_history_action ON subscription_history(action);

-- ============================================================================
-- Indexes: profiles (extended)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier) WHERE subscription_tier != 'free';
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_expires_at ON profiles(subscription_expires_at) WHERE subscription_expires_at IS NOT NULL;

COMMIT;
