-- Migration: Atomic Credit Deduction Function
-- Created: 2025-12-12
-- Purpose: Fix race condition in credit deduction during generation completion

-- Drop function if exists (for redeployment)
DROP FUNCTION IF EXISTS deduct_generation_credits(UUID, INTEGER, TEXT, JSONB);

-- Create atomic credit deduction function
CREATE OR REPLACE FUNCTION deduct_generation_credits(
  p_user_id UUID,
  p_cost INTEGER,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (new_balance INTEGER, success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_total_spent INTEGER;
BEGIN
  -- Lock row for this user to prevent race conditions
  -- This ensures only one deduction can happen at a time per user
  SELECT balance, total_spent INTO v_current_balance, v_total_spent
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Check if user_credits record exists
  IF NOT FOUND THEN
    -- Create initial record if doesn't exist
    INSERT INTO user_credits (user_id, balance, total_spent, created_at, updated_at)
    VALUES (p_user_id, 0, 0, NOW(), NOW());

    v_current_balance := 0;
    v_total_spent := 0;

    -- Log this for monitoring
    RAISE WARNING 'Created new user_credits record for user %', p_user_id;
  END IF;

  -- Check if user has sufficient credits
  IF v_current_balance < p_cost THEN
    RETURN QUERY SELECT v_current_balance, FALSE,
      FORMAT('Insufficient credits. Balance: %s, Required: %s', v_current_balance, p_cost);
    RETURN;
  END IF;

  -- Calculate new balance (ensure it doesn't go negative)
  v_new_balance := GREATEST(0, v_current_balance - p_cost);

  -- Atomically update user_credits
  UPDATE user_credits
  SET
    balance = v_new_balance,
    total_spent = COALESCE(total_spent, 0) + p_cost,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Log the transaction in credit_transactions table
  INSERT INTO credit_transactions (
    user_id,
    amount,
    transaction_type,
    action_type,
    description,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    p_cost,
    'spend',
    'generation',
    p_description,
    p_metadata,
    NOW()
  );

  -- Return success with new balance
  RETURN QUERY SELECT v_new_balance, TRUE, 'Credits deducted successfully'::TEXT;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return failure
    RAISE WARNING 'Error in deduct_generation_credits for user %: %', p_user_id, SQLERRM;
    RETURN QUERY SELECT v_current_balance, FALSE,
      FORMAT('Error: %s', SQLERRM);
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION deduct_generation_credits IS
  'Atomically deducts credits from user balance with row-level locking to prevent race conditions. ' ||
  'Returns (new_balance, success, message). Created to fix Issue #7 from Track Generation Audit 2025-12-12.';

-- Grant execute permission to authenticated users (via service role in Edge Functions)
GRANT EXECUTE ON FUNCTION deduct_generation_credits TO service_role;
GRANT EXECUTE ON FUNCTION deduct_generation_credits TO authenticated;
