
-- Fix: Add admin full access to profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Fix: Add admin full access to user_credits for viewing
DROP POLICY IF EXISTS "Admins can view all user credits" ON user_credits;
CREATE POLICY "Admins can view all user credits"
ON user_credits FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Fix: Add admin update access to user_credits (for manual adjustments)
DROP POLICY IF EXISTS "Admins can update user credits" ON user_credits;
CREATE POLICY "Admins can update user credits"
ON user_credits FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Fix missing credit records for 2 users who don't have them
INSERT INTO user_credits (user_id, balance, total_earned, total_spent, experience, level, current_streak, longest_streak)
SELECT 
  p.user_id,
  50, -- INITIAL_CREDITS
  50,
  0,
  0,
  1,
  0,
  0
FROM profiles p
LEFT JOIN user_credits uc ON p.user_id = uc.user_id
WHERE uc.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Log registration bonus for newly created credit records
INSERT INTO credit_transactions (user_id, amount, transaction_type, action_type, description)
SELECT 
  p.user_id,
  50,
  'earn',
  'registration_bonus_fix',
  'Бонус за регистрацию (исправление)'
FROM profiles p
LEFT JOIN credit_transactions ct ON p.user_id = ct.user_id AND ct.action_type = 'registration_bonus'
WHERE ct.user_id IS NULL;

-- Fix users who didn't get full 50 credits - add the difference
UPDATE user_credits
SET 
  balance = balance + (50 - total_earned),
  total_earned = 50
WHERE total_earned < 50 AND total_earned >= 0;

-- Log the fix transactions for users who got topped up
INSERT INTO credit_transactions (user_id, amount, transaction_type, action_type, description, metadata)
SELECT 
  uc.user_id,
  50 - ct_sum.total_registration,
  'earn',
  'registration_bonus_fix',
  'Доначисление бонуса за регистрацию',
  jsonb_build_object('original_earned', ct_sum.total_registration, 'topped_up_to', 50)
FROM user_credits uc
LEFT JOIN (
  SELECT user_id, COALESCE(SUM(amount) FILTER (WHERE action_type LIKE 'registration%'), 0) as total_registration
  FROM credit_transactions
  GROUP BY user_id
) ct_sum ON uc.user_id = ct_sum.user_id
WHERE ct_sum.total_registration < 50 AND ct_sum.total_registration >= 0;
