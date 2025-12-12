-- Migration: Row Level Security Policies for Stars Payment System
-- Date: 2025-12-12
-- Tasks: T029-T036

BEGIN;

-- ============================================================================
-- RLS Policies: stars_products
-- ============================================================================

ALTER TABLE stars_products ENABLE ROW LEVEL SECURITY;

-- Anyone can view active products
CREATE POLICY "Anyone can view active products"
  ON stars_products FOR SELECT
  USING (is_active = true);

-- Only admins can manage products
-- Note: This assumes a user_roles table exists with admin role tracking
CREATE POLICY "Admins can manage products"
  ON stars_products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- RLS Policies: stars_transactions
-- ============================================================================

ALTER TABLE stars_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON stars_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert transactions (Edge Functions)
CREATE POLICY "Service role can insert transactions"
  ON stars_transactions FOR INSERT
  WITH CHECK (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
  ON stars_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- RLS Policies: subscription_history
-- ============================================================================

ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription history
CREATE POLICY "Users can view own subscription history"
  ON subscription_history FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert subscription history (Edge Functions)
CREATE POLICY "Service role can insert subscription history"
  ON subscription_history FOR INSERT
  WITH CHECK (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- Admins can view all subscription history
CREATE POLICY "Admins can view all subscription history"
  ON subscription_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

COMMIT;
