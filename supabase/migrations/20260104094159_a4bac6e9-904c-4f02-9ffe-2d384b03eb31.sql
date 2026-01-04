-- =============================================
-- Tinkoff & Multi-Gateway Payment Integration
-- =============================================

-- 1. Create enum types for payment gateways and statuses
CREATE TYPE payment_gateway AS ENUM ('telegram_stars', 'tinkoff', 'robokassa');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded');

-- 2. Add price_rub_cents column to stars_products
ALTER TABLE stars_products 
ADD COLUMN IF NOT EXISTS price_rub_cents INTEGER;

COMMENT ON COLUMN stars_products.price_rub_cents IS 'Price in Russian rubles (kopecks, 1 rub = 100 kopecks)';

-- 3. Create payment_transactions table for multi-gateway support
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gateway payment_gateway NOT NULL,
  product_code TEXT NOT NULL,
  
  -- Amounts
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RUB',
  
  -- Status
  status payment_status NOT NULL DEFAULT 'pending',
  
  -- Gateway-specific identifiers
  gateway_transaction_id TEXT,
  gateway_payment_url TEXT,
  gateway_order_id TEXT UNIQUE,
  
  -- Results (what was granted)
  credits_granted INTEGER,
  subscription_granted TEXT,
  
  -- Request metadata
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 4. Create indexes for efficient querying
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_gateway ON payment_transactions(gateway);
CREATE INDEX idx_payment_transactions_gateway_order_id ON payment_transactions(gateway_order_id);
CREATE INDEX idx_payment_transactions_created_at ON payment_transactions(created_at DESC);

-- 5. Enable RLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- Users can view their own transactions
CREATE POLICY "Users can view own payment transactions"
  ON payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert/update (via edge functions)
CREATE POLICY "Service role can manage payment transactions"
  ON payment_transactions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 7. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_payment_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_transactions_updated_at();

-- 8. Function to process multi-gateway payment completion
CREATE OR REPLACE FUNCTION process_gateway_payment(
  p_transaction_id UUID,
  p_gateway_transaction_id TEXT,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction payment_transactions%ROWTYPE;
  v_product stars_products%ROWTYPE;
  v_credits_to_add INTEGER;
  v_subscription_tier TEXT;
  v_subscription_days INTEGER;
  v_previous_tier subscription_tier;
  v_result JSONB;
BEGIN
  -- Lock the transaction row
  SELECT * INTO v_transaction
  FROM payment_transactions
  WHERE id = p_transaction_id
  FOR UPDATE;

  -- Transaction not found
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Transaction not found',
      'transaction_id', p_transaction_id
    );
  END IF;

  -- Idempotency check
  IF v_transaction.status = 'completed' THEN
    RETURN jsonb_build_object(
      'success', true,
      'type', 'duplicate',
      'message', 'Transaction already processed',
      'transaction_id', p_transaction_id
    );
  END IF;

  -- Get product details
  SELECT * INTO v_product
  FROM stars_products
  WHERE product_code = v_transaction.product_code;

  IF NOT FOUND THEN
    UPDATE payment_transactions
    SET status = 'failed',
        error_message = 'Product not found',
        updated_at = now()
    WHERE id = p_transaction_id;

    RETURN jsonb_build_object(
      'success', false,
      'error', 'Product not found',
      'product_code', v_transaction.product_code
    );
  END IF;

  -- Process based on product type
  IF v_product.product_type IN ('credits', 'credit_package') THEN
    v_credits_to_add := COALESCE(v_product.credits_amount, 0);

    -- Add credits to user
    INSERT INTO user_credits (user_id, balance, total_earned, experience, level)
    VALUES (v_transaction.user_id, v_credits_to_add, v_credits_to_add, v_credits_to_add * 2, 1)
    ON CONFLICT (user_id) DO UPDATE SET
      balance = user_credits.balance + v_credits_to_add,
      total_earned = user_credits.total_earned + v_credits_to_add,
      experience = user_credits.experience + (v_credits_to_add * 2),
      level = GREATEST(1, FLOOR(SQRT((user_credits.experience + v_credits_to_add * 2) / 100))::integer + 1),
      updated_at = now();

    -- Log credit transaction
    INSERT INTO credit_transactions (user_id, amount, transaction_type, action_type, description, metadata)
    VALUES (
      v_transaction.user_id,
      v_credits_to_add,
      'earn',
      'purchase',
      'Покупка кредитов через ' || v_transaction.gateway::text,
      jsonb_build_object(
        'payment_transaction_id', p_transaction_id,
        'product_code', v_transaction.product_code,
        'amount_cents', v_transaction.amount_cents,
        'gateway', v_transaction.gateway::text
      )
    );

    -- Update transaction
    UPDATE payment_transactions
    SET status = 'completed',
        gateway_transaction_id = p_gateway_transaction_id,
        credits_granted = v_credits_to_add,
        completed_at = now(),
        updated_at = now(),
        metadata = COALESCE(metadata, '{}'::jsonb) || p_metadata
    WHERE id = p_transaction_id;

    v_result := jsonb_build_object(
      'success', true,
      'type', 'credits',
      'credits_granted', v_credits_to_add,
      'transaction_id', p_transaction_id,
      'user_id', v_transaction.user_id
    );

  ELSIF v_product.product_type = 'subscription' THEN
    v_subscription_tier := COALESCE(v_product.subscription_tier, 'pro');
    v_subscription_days := COALESCE(v_product.subscription_days, 30);

    -- Get previous tier
    SELECT subscription_tier INTO v_previous_tier
    FROM profiles
    WHERE user_id = v_transaction.user_id;

    -- Update subscription
    UPDATE profiles
    SET subscription_tier = v_subscription_tier::subscription_tier,
        subscription_expires_at = now() + (v_subscription_days || ' days')::interval,
        updated_at = now()
    WHERE user_id = v_transaction.user_id;

    -- Record history
    INSERT INTO subscription_history (
      user_id, tier, action, previous_tier, expires_at, metadata
    ) VALUES (
      v_transaction.user_id,
      v_subscription_tier::subscription_tier,
      CASE 
        WHEN v_previous_tier IS NULL OR v_previous_tier = 'free' THEN 'activated'
        ELSE 'renewed'
      END,
      COALESCE(v_previous_tier, 'free'),
      now() + (v_subscription_days || ' days')::interval,
      jsonb_build_object(
        'payment_transaction_id', p_transaction_id,
        'gateway', v_transaction.gateway::text
      )
    );

    -- Update transaction
    UPDATE payment_transactions
    SET status = 'completed',
        gateway_transaction_id = p_gateway_transaction_id,
        subscription_granted = v_subscription_tier,
        completed_at = now(),
        updated_at = now(),
        metadata = COALESCE(metadata, '{}'::jsonb) || p_metadata
    WHERE id = p_transaction_id;

    v_result := jsonb_build_object(
      'success', true,
      'type', 'subscription',
      'subscription_tier', v_subscription_tier,
      'subscription_days', v_subscription_days,
      'transaction_id', p_transaction_id,
      'user_id', v_transaction.user_id
    );
  ELSE
    UPDATE payment_transactions
    SET status = 'failed',
        error_message = 'Unknown product type',
        updated_at = now()
    WHERE id = p_transaction_id;

    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unknown product type'
    );
  END IF;

  RETURN v_result;
END;
$$;