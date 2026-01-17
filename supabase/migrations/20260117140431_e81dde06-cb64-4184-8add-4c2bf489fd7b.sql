-- Fix deduct_generation_credits function to use correct column names
-- The function was using 'credits' instead of 'balance' and 'experience_points' instead of 'experience'

CREATE OR REPLACE FUNCTION public.deduct_generation_credits(
  p_user_id UUID,
  p_cost INTEGER,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Get current balance using correct column name
  SELECT balance INTO v_current_balance
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Initialize if user doesn't exist
  IF v_current_balance IS NULL THEN
    INSERT INTO user_credits (user_id, balance, experience, level, total_earned, total_spent, current_streak)
    VALUES (p_user_id, 0, 0, 1, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    SELECT balance INTO v_current_balance
    FROM user_credits
    WHERE user_id = p_user_id;
    
    IF v_current_balance IS NULL THEN
      v_current_balance := 0;
    END IF;
  END IF;
  
  -- Check sufficient balance
  IF v_current_balance < p_cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_credits',
      'current_credits', v_current_balance,
      'required', p_cost
    );
  END IF;
  
  v_new_balance := v_current_balance - p_cost;
  
  -- Update balance using correct column name
  UPDATE user_credits
  SET balance = v_new_balance,
      total_spent = COALESCE(total_spent, 0) + p_cost,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Log transaction
  INSERT INTO credit_transactions (
    user_id,
    amount,
    transaction_type,
    action_type,
    description,
    metadata
  ) VALUES (
    p_user_id,
    -p_cost,
    'spend',
    'generation',
    COALESCE(p_description, 'Music generation'),
    p_metadata
  )
  RETURNING id INTO v_transaction_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'previous_credits', v_current_balance,
    'new_credits', v_new_balance,
    'cost', p_cost,
    'transaction_id', v_transaction_id
  );
END;
$$;

-- Also fix add_credits function if it exists with wrong column names
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_action_type TEXT DEFAULT 'bonus',
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Get or create user credits record
  INSERT INTO user_credits (user_id, balance, experience, level, total_earned, total_spent, current_streak)
  VALUES (p_user_id, 0, 0, 1, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Get current balance
  SELECT balance INTO v_current_balance
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  v_new_balance := COALESCE(v_current_balance, 0) + p_amount;
  
  -- Update balance
  UPDATE user_credits
  SET balance = v_new_balance,
      total_earned = COALESCE(total_earned, 0) + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Log transaction
  INSERT INTO credit_transactions (
    user_id,
    amount,
    transaction_type,
    action_type,
    description,
    metadata
  ) VALUES (
    p_user_id,
    p_amount,
    'earn',
    p_action_type,
    p_description,
    p_metadata
  )
  RETURNING id INTO v_transaction_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'previous_credits', v_current_balance,
    'new_credits', v_new_balance,
    'amount_added', p_amount,
    'transaction_id', v_transaction_id
  );
END;
$$;