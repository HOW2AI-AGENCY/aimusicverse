-- 1. Create subscription_history table
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier subscription_tier NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('activated', 'renewed', 'cancelled', 'expired', 'upgraded', 'downgraded')),
  stars_transaction_id UUID REFERENCES public.stars_transactions(id),
  previous_tier subscription_tier,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_subscription_history_user_id ON public.subscription_history(user_id);
CREATE INDEX idx_subscription_history_created_at ON public.subscription_history(created_at DESC);

-- Enable RLS
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own subscription history"
  ON public.subscription_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can insert subscription history"
  ON public.subscription_history FOR INSERT
  WITH CHECK (true);

-- 2. Create/replace get_subscription_status function to read from profiles
CREATE OR REPLACE FUNCTION public.get_subscription_status(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tier subscription_tier;
  v_expires_at TIMESTAMP WITH TIME ZONE;
  v_days_remaining INTEGER;
  v_has_subscription BOOLEAN;
BEGIN
  -- Read from profiles table (source of truth)
  SELECT 
    COALESCE(subscription_tier, 'free'),
    subscription_expires_at
  INTO v_tier, v_expires_at
  FROM profiles
  WHERE user_id = p_user_id;

  -- If no profile found, return free tier
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'has_subscription', false,
      'tier', 'free',
      'expires_at', null,
      'days_remaining', null
    );
  END IF;

  -- Check if subscription is active
  IF v_tier != 'free' AND v_expires_at IS NOT NULL AND v_expires_at > now() THEN
    v_has_subscription := true;
    v_days_remaining := GREATEST(0, EXTRACT(DAY FROM (v_expires_at - now()))::INTEGER);
  ELSE
    -- Subscription expired or free tier
    v_has_subscription := false;
    v_tier := 'free';
    v_days_remaining := null;
    
    -- Auto-downgrade expired subscriptions
    IF v_expires_at IS NOT NULL AND v_expires_at <= now() THEN
      UPDATE profiles 
      SET subscription_tier = 'free', updated_at = now()
      WHERE user_id = p_user_id AND subscription_tier != 'free';
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'has_subscription', v_has_subscription,
    'tier', v_tier::text,
    'expires_at', v_expires_at,
    'days_remaining', v_days_remaining
  );
END;
$$;

-- 3. Update process_stars_payment to record subscription history
CREATE OR REPLACE FUNCTION public.process_stars_payment(
  p_transaction_id UUID,
  p_telegram_payment_charge_id TEXT,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_transaction stars_transactions%ROWTYPE;
  v_product stars_products%ROWTYPE;
  v_user_id UUID;
  v_credits_to_add INTEGER;
  v_subscription_tier TEXT;
  v_subscription_days INTEGER;
  v_previous_tier subscription_tier;
  v_result JSONB;
BEGIN
  -- Lock the transaction row for update (prevents race conditions)
  SELECT * INTO v_transaction
  FROM stars_transactions
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

  -- Idempotency check: already processed
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
    -- Update transaction as failed
    UPDATE stars_transactions
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

  v_user_id := v_transaction.user_id;

  -- Process based on product type
  IF v_product.product_type IN ('credits', 'credit_package') THEN
    v_credits_to_add := COALESCE(v_product.credits_amount, 0);

    -- Add credits to user
    INSERT INTO user_credits (user_id, balance, total_earned, experience, level)
    VALUES (v_user_id, v_credits_to_add, v_credits_to_add, v_credits_to_add * 2, 1)
    ON CONFLICT (user_id) DO UPDATE SET
      balance = user_credits.balance + v_credits_to_add,
      total_earned = user_credits.total_earned + v_credits_to_add,
      experience = user_credits.experience + (v_credits_to_add * 2),
      level = GREATEST(1, FLOOR(SQRT((user_credits.experience + v_credits_to_add * 2) / 100))::integer + 1),
      updated_at = now();

    -- Log credit transaction
    INSERT INTO credit_transactions (user_id, amount, transaction_type, action_type, description, metadata)
    VALUES (
      v_user_id,
      v_credits_to_add,
      'earn',
      'purchase',
      'Покупка кредитов через Telegram Stars',
      jsonb_build_object(
        'stars_transaction_id', p_transaction_id,
        'product_code', v_transaction.product_code,
        'stars_amount', v_transaction.stars_amount
      )
    );

    -- Update transaction
    UPDATE stars_transactions
    SET status = 'completed',
        telegram_payment_charge_id = p_telegram_payment_charge_id,
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
      'user_id', v_user_id
    );

  ELSIF v_product.product_type = 'subscription' THEN
    v_subscription_tier := COALESCE(v_product.subscription_tier, 'pro');
    v_subscription_days := COALESCE(v_product.subscription_days, 30);

    -- Get previous tier for history
    SELECT subscription_tier INTO v_previous_tier
    FROM profiles
    WHERE user_id = v_user_id;

    -- Update user's subscription in profiles
    UPDATE profiles
    SET subscription_tier = v_subscription_tier::subscription_tier,
        subscription_expires_at = now() + (v_subscription_days || ' days')::interval,
        updated_at = now()
    WHERE user_id = v_user_id;

    -- Record subscription history
    INSERT INTO subscription_history (
      user_id,
      tier,
      action,
      stars_transaction_id,
      previous_tier,
      expires_at,
      metadata
    ) VALUES (
      v_user_id,
      v_subscription_tier::subscription_tier,
      CASE 
        WHEN v_previous_tier IS NULL OR v_previous_tier = 'free' THEN 'activated'
        WHEN v_previous_tier::text < v_subscription_tier THEN 'upgraded'
        WHEN v_previous_tier::text > v_subscription_tier THEN 'downgraded'
        ELSE 'renewed'
      END,
      p_transaction_id,
      COALESCE(v_previous_tier, 'free'),
      now() + (v_subscription_days || ' days')::interval,
      jsonb_build_object(
        'stars_amount', v_transaction.stars_amount,
        'product_code', v_transaction.product_code,
        'days_granted', v_subscription_days
      )
    );

    -- Update transaction
    UPDATE stars_transactions
    SET status = 'completed',
        telegram_payment_charge_id = p_telegram_payment_charge_id,
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
      'previous_tier', COALESCE(v_previous_tier::text, 'free'),
      'transaction_id', p_transaction_id,
      'user_id', v_user_id
    );

  ELSE
    -- Unknown product type
    UPDATE stars_transactions
    SET status = 'failed',
        error_message = 'Unknown product type: ' || v_product.product_type,
        updated_at = now()
    WHERE id = p_transaction_id;

    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unknown product type',
      'product_type', v_product.product_type
    );
  END IF;

  RETURN v_result;
END;
$$;