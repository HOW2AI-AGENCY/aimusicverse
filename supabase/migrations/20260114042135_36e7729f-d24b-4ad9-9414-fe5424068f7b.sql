-- Create the missing deduct_generation_credits function
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
  v_current_credits INTEGER;
  v_new_credits INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Get current credits with lock
  SELECT credits INTO v_current_credits
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- If no record exists, create one with 0 credits
  IF v_current_credits IS NULL THEN
    INSERT INTO user_credits (user_id, credits, experience_points, level)
    VALUES (p_user_id, 0, 0, 1)
    ON CONFLICT (user_id) DO NOTHING;
    v_current_credits := 0;
  END IF;
  
  -- Check if user has enough credits
  IF v_current_credits < p_cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_credits',
      'current_credits', v_current_credits,
      'required', p_cost
    );
  END IF;
  
  -- Deduct credits
  v_new_credits := v_current_credits - p_cost;
  
  UPDATE user_credits
  SET credits = v_new_credits,
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
    'debit',
    'generation',
    COALESCE(p_description, 'Music generation'),
    p_metadata
  )
  RETURNING id INTO v_transaction_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'previous_credits', v_current_credits,
    'new_credits', v_new_credits,
    'cost', p_cost,
    'transaction_id', v_transaction_id
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.deduct_generation_credits TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_generation_credits TO service_role;