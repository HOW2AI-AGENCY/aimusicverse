-- Create process_stars_payment function for atomic payment processing
-- This function handles payment completion with idempotency and proper locking

CREATE OR REPLACE FUNCTION public.process_stars_payment(
  p_transaction_id uuid,
  p_telegram_payment_charge_id text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_transaction stars_transactions%ROWTYPE;
  v_product stars_products%ROWTYPE;
  v_user_id uuid;
  v_credits_to_add integer;
  v_subscription_tier text;
  v_subscription_days integer;
  v_result jsonb;
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

    -- Update user's subscription in profiles
    UPDATE profiles
    SET subscription_tier = v_subscription_tier::subscription_tier,
        subscription_expires_at = now() + (v_subscription_days || ' days')::interval,
        updated_at = now()
    WHERE user_id = v_user_id;

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