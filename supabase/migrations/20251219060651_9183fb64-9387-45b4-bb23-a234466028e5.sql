-- ============================================
-- PHASE 1: Update Stars Products Pricing (100 credits = $1)
-- 1 Star ≈ $0.02, so 50 Stars = $1, 1 Star = 2 credits
-- ============================================

-- Clear existing products and insert new ones with correct pricing
DELETE FROM stars_products;

-- Credit Packages
INSERT INTO stars_products (product_code, product_type, name, description, stars_price, credits_amount, is_popular, sort_order, status) VALUES
-- 100 credits = $1 = 50 Stars
('credits_100', 'credit_package', 
  '{"ru": "100 кредитов", "en": "100 Credits"}', 
  '{"ru": "Начальный пакет для создания музыки", "en": "Starter pack for music creation"}', 
  50, 100, false, 1, 'active'),

-- 250 credits = $2 = 100 Stars (+25 bonus = 12.5% bonus)
('credits_250', 'credit_package', 
  '{"ru": "250 кредитов", "en": "250 Credits"}', 
  '{"ru": "Популярный выбор: +25 бонусных кредитов", "en": "Popular choice: +25 bonus credits"}', 
  100, 250, true, 2, 'active'),

-- 600 credits = $5 = 250 Stars (+100 bonus = 20% bonus)  
('credits_600', 'credit_package', 
  '{"ru": "600 кредитов", "en": "600 Credits"}', 
  '{"ru": "Лучшая ценность: +100 бонусных кредитов", "en": "Best value: +100 bonus credits"}', 
  250, 600, true, 3, 'active'),

-- 1500 credits = $10 = 500 Stars (+500 bonus = 50% bonus)
('credits_1500', 'credit_package', 
  '{"ru": "1500 кредитов", "en": "1500 Credits"}', 
  '{"ru": "Максимальная выгода: +500 бонусных кредитов", "en": "Maximum value: +500 bonus credits"}', 
  500, 1500, false, 4, 'active');

-- Subscriptions
INSERT INTO stars_products (product_code, product_type, name, description, stars_price, credits_amount, subscription_days, features, is_popular, sort_order, status) VALUES
-- Basic: $2/month = 100 Stars, 150 credits/month (+50 bonus)
('sub_basic', 'subscription', 
  '{"ru": "Basic подписка", "en": "Basic Subscription"}', 
  '{"ru": "Идеально для начинающих музыкантов", "en": "Perfect for beginner musicians"}', 
  100, 150, 30, 
  '["150 кредитов/мес (+50 бонус)", "Приоритетная генерация", "Базовая поддержка"]'::jsonb,
  false, 10, 'active'),

-- Pro: $5/month = 250 Stars, 500 credits/month (+200 bonus)
('sub_pro', 'subscription', 
  '{"ru": "Pro подписка", "en": "Pro Subscription"}', 
  '{"ru": "Для активных создателей контента", "en": "For active content creators"}', 
  250, 500, 30, 
  '["500 кредитов/мес (+200 бонус)", "Приоритетная генерация", "Расширенная аналитика", "Приоритетная поддержка"]'::jsonb,
  true, 11, 'active'),

-- Enterprise: $15/month = 750 Stars, 1500 credits/month (+500 bonus)  
('sub_enterprise', 'subscription', 
  '{"ru": "Enterprise подписка", "en": "Enterprise Subscription"}', 
  '{"ru": "Максимальные возможности для профессионалов", "en": "Maximum capabilities for professionals"}', 
  750, 1500, 30, 
  '["1500 кредитов/мес (+500 бонус)", "Мгновенная генерация", "Полная аналитика", "VIP поддержка", "API доступ"]'::jsonb,
  false, 12, 'active');

-- ============================================
-- PHASE 2: Payment Analytics Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.payment_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  
  -- Daily aggregates
  total_transactions integer DEFAULT 0,
  completed_transactions integer DEFAULT 0,
  failed_transactions integer DEFAULT 0,
  
  -- Revenue metrics
  total_stars_collected bigint DEFAULT 0,
  total_credits_granted bigint DEFAULT 0,
  total_usd_equivalent numeric(10,2) DEFAULT 0,
  
  -- Product breakdown
  credit_package_sales integer DEFAULT 0,
  subscription_sales integer DEFAULT 0,
  
  -- User metrics
  unique_paying_users integer DEFAULT 0,
  new_paying_users integer DEFAULT 0,
  repeat_buyers integer DEFAULT 0,
  
  -- Conversion
  invoice_created_count integer DEFAULT 0,
  conversion_rate numeric(5,2) DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(date)
);

ALTER TABLE payment_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view payment analytics"
ON payment_analytics FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- PHASE 3: Promo Codes Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_percent integer CHECK (discount_percent >= 0 AND discount_percent <= 100),
  discount_stars integer CHECK (discount_stars >= 0),
  bonus_credits integer DEFAULT 0,
  
  -- Limits
  max_uses integer,
  current_uses integer DEFAULT 0,
  max_uses_per_user integer DEFAULT 1,
  
  -- Validity
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  
  -- Targeting
  product_codes text[] DEFAULT '{}',
  min_purchase_stars integer DEFAULT 0,
  
  -- Tracking
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promo codes"
ON promo_codes FOR SELECT
USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

CREATE POLICY "Admins can manage promo codes"
ON promo_codes FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Promo code usage tracking
CREATE TABLE IF NOT EXISTS public.promo_code_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES stars_transactions(id),
  discount_applied integer DEFAULT 0,
  bonus_credits_applied integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(promo_code_id, transaction_id)
);

ALTER TABLE promo_code_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own promo usage"
ON promo_code_usage FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service can insert promo usage"
ON promo_code_usage FOR INSERT
WITH CHECK (true);

-- ============================================
-- PHASE 4: Referral System
-- ============================================

-- Add referral fields to user_credits
ALTER TABLE user_credits 
ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
ADD COLUMN IF NOT EXISTS referral_earnings integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_count integer DEFAULT 0;

-- Generate unique referral codes for existing users
UPDATE user_credits 
SET referral_code = UPPER(SUBSTRING(MD5(user_id::text || RANDOM()::text) FROM 1 FOR 8))
WHERE referral_code IS NULL;

-- Referral rewards table
CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES stars_transactions(id),
  
  -- Reward amounts
  stars_amount integer NOT NULL,
  credits_reward integer NOT NULL,
  reward_percent numeric(5,2) DEFAULT 10.00,
  
  -- Status
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'credited', 'failed')),
  credited_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(referred_id, transaction_id)
);

ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral rewards"
ON referral_rewards FOR SELECT
USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Service can insert referral rewards"
ON referral_rewards FOR INSERT
WITH CHECK (true);

-- ============================================
-- PHASE 5: New Gamification Achievements
-- ============================================

-- Add new achievements for payments and engagement
INSERT INTO achievements (code, name, description, icon, category, requirement_type, requirement_value, credits_reward, experience_reward, is_hidden) VALUES
-- Payment achievements
('first_purchase', 'Покупатель', 'Совершите первую покупку за Stars', '💳', 'payment', 'purchases', 1, 25, 50, false),
('big_spender', 'Меценат', 'Потратьте 500+ Stars на покупки', '💎', 'payment', 'stars_spent', 500, 100, 200, false),
('subscriber', 'Подписчик', 'Оформите любую подписку', '👑', 'payment', 'subscription', 1, 50, 100, false),
('vip_member', 'VIP Участник', 'Оформите Enterprise подписку', '🌟', 'payment', 'subscription_tier', 1, 200, 500, true),

-- Engagement achievements
('collector_50', 'Коллекционер', 'Создайте 50 треков', '📀', 'creation', 'tracks_created', 50, 75, 150, false),
('collector_100', 'Мастер-коллекционер', 'Создайте 100 треков', '💿', 'creation', 'tracks_created', 100, 150, 300, false),
('popular_100', 'Популярный', 'Получите 100 лайков на свои треки', '❤️', 'social', 'likes_received', 100, 50, 100, false),
('popular_500', 'Звезда', 'Получите 500 лайков на свои треки', '⭐', 'social', 'likes_received', 500, 150, 300, false),
('streamer_1000', 'Стример', 'Ваши треки прослушали 1000 раз', '🎧', 'social', 'total_plays', 1000, 100, 200, false),
('streamer_10000', 'Хит-мейкер', 'Ваши треки прослушали 10000 раз', '🔥', 'social', 'total_plays', 10000, 300, 600, true),

-- Referral achievements
('referrer_1', 'Рекрутер', 'Пригласите 1 друга', '👋', 'referral', 'referrals', 1, 50, 75, false),
('referrer_5', 'Амбассадор', 'Пригласите 5 друзей', '🤝', 'referral', 'referrals', 5, 150, 250, false),
('referrer_10', 'Лидер сообщества', 'Пригласите 10 друзей', '👥', 'referral', 'referrals', 10, 300, 500, false)

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  credits_reward = EXCLUDED.credits_reward,
  experience_reward = EXCLUDED.experience_reward;

-- ============================================
-- PHASE 6: Analytics Functions
-- ============================================

-- Function to get comprehensive payment analytics
CREATE OR REPLACE FUNCTION get_payment_analytics(_time_period interval DEFAULT '30 days')
RETURNS TABLE (
  total_revenue_usd numeric,
  total_stars_collected bigint,
  total_transactions bigint,
  completed_transactions bigint,
  conversion_rate numeric,
  avg_transaction_stars numeric,
  unique_buyers bigint,
  repeat_buyer_rate numeric,
  revenue_by_day jsonb,
  top_products jsonb,
  subscription_breakdown jsonb
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _total_revenue numeric;
  _total_stars bigint;
  _total_tx bigint;
  _completed bigint;
  _conv_rate numeric;
  _avg_tx numeric;
  _unique_buyers bigint;
  _repeat_rate numeric;
  _by_day jsonb;
  _top_products jsonb;
  _sub_breakdown jsonb;
BEGIN
  -- Total stats
  SELECT 
    COALESCE(SUM(stars_amount) * 0.02, 0),
    COALESCE(SUM(stars_amount), 0),
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    ROUND(COUNT(*) FILTER (WHERE status = 'completed')::numeric / NULLIF(COUNT(*), 0) * 100, 2),
    ROUND(AVG(stars_amount) FILTER (WHERE status = 'completed'), 2),
    COUNT(DISTINCT user_id) FILTER (WHERE status = 'completed')
  INTO _total_revenue, _total_stars, _total_tx, _completed, _conv_rate, _avg_tx, _unique_buyers
  FROM stars_transactions
  WHERE created_at >= now() - _time_period;

  -- Repeat buyer rate
  SELECT ROUND(COUNT(*) FILTER (WHERE tx_count > 1)::numeric / NULLIF(COUNT(*), 0) * 100, 2)
  INTO _repeat_rate
  FROM (
    SELECT user_id, COUNT(*) as tx_count
    FROM stars_transactions
    WHERE status = 'completed' AND created_at >= now() - _time_period
    GROUP BY user_id
  ) sub;

  -- Revenue by day
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  INTO _by_day
  FROM (
    SELECT 
      date_trunc('day', created_at)::date as day,
      SUM(stars_amount) as stars,
      ROUND(SUM(stars_amount) * 0.02, 2) as usd,
      COUNT(*) as transactions
    FROM stars_transactions
    WHERE status = 'completed' AND created_at >= now() - _time_period
    GROUP BY day
    ORDER BY day
  ) t;

  -- Top products
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  INTO _top_products
  FROM (
    SELECT 
      product_code,
      COUNT(*) as sales,
      SUM(stars_amount) as total_stars,
      SUM(credits_granted) as total_credits
    FROM stars_transactions
    WHERE status = 'completed' AND created_at >= now() - _time_period
    GROUP BY product_code
    ORDER BY sales DESC
    LIMIT 10
  ) t;

  -- Subscription breakdown
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  INTO _sub_breakdown
  FROM (
    SELECT 
      product_code,
      COUNT(*) as active_count,
      SUM(stars_amount) as revenue_stars
    FROM stars_transactions
    WHERE status = 'completed' 
      AND subscription_granted IS NOT NULL
      AND created_at >= now() - _time_period
    GROUP BY product_code
  ) t;

  RETURN QUERY SELECT
    COALESCE(_total_revenue, 0),
    COALESCE(_total_stars, 0),
    COALESCE(_total_tx, 0),
    COALESCE(_completed, 0),
    COALESCE(_conv_rate, 0),
    COALESCE(_avg_tx, 0),
    COALESCE(_unique_buyers, 0),
    COALESCE(_repeat_rate, 0),
    _by_day,
    _top_products,
    _sub_breakdown;
END;
$$;

-- Function to get gamification analytics
CREATE OR REPLACE FUNCTION get_gamification_analytics(_time_period interval DEFAULT '30 days')
RETURNS TABLE (
  total_users bigint,
  active_users bigint,
  avg_level numeric,
  max_level integer,
  total_experience bigint,
  total_credits_earned bigint,
  total_credits_spent bigint,
  level_distribution jsonb,
  top_achievers jsonb,
  checkin_stats jsonb,
  achievement_popularity jsonb
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _total_users bigint;
  _active_users bigint;
  _avg_level numeric;
  _max_level integer;
  _total_exp bigint;
  _total_earned bigint;
  _total_spent bigint;
  _level_dist jsonb;
  _top_achievers jsonb;
  _checkin_stats jsonb;
  _achievement_pop jsonb;
BEGIN
  -- User stats
  SELECT 
    COUNT(*),
    ROUND(AVG(level), 2),
    MAX(level),
    COALESCE(SUM(experience), 0),
    COALESCE(SUM(total_earned), 0),
    COALESCE(SUM(total_spent), 0)
  INTO _total_users, _avg_level, _max_level, _total_exp, _total_earned, _total_spent
  FROM user_credits;

  -- Active users (activity in period)
  SELECT COUNT(DISTINCT user_id)
  INTO _active_users
  FROM credit_transactions
  WHERE created_at >= now() - _time_period;

  -- Level distribution
  SELECT COALESCE(jsonb_object_agg(level, cnt), '{}'::jsonb)
  INTO _level_dist
  FROM (
    SELECT level, COUNT(*) as cnt
    FROM user_credits
    GROUP BY level
    ORDER BY level
  ) sub;

  -- Top achievers
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  INTO _top_achievers
  FROM (
    SELECT 
      uc.user_id,
      p.username,
      uc.level,
      uc.experience,
      uc.total_earned,
      (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = uc.user_id) as achievements
    FROM user_credits uc
    LEFT JOIN profiles p ON p.user_id = uc.user_id
    ORDER BY uc.experience DESC
    LIMIT 10
  ) t;

  -- Checkin stats
  SELECT jsonb_build_object(
    'total_checkins', COUNT(*),
    'unique_users', COUNT(DISTINCT user_id),
    'avg_streak', ROUND(AVG(streak_day), 2),
    'max_streak', MAX(streak_day),
    'by_day_of_week', (
      SELECT jsonb_object_agg(dow, cnt)
      FROM (
        SELECT EXTRACT(DOW FROM checkin_date) as dow, COUNT(*) as cnt
        FROM user_checkins
        WHERE created_at >= now() - _time_period
        GROUP BY dow
      ) sub
    )
  )
  INTO _checkin_stats
  FROM user_checkins
  WHERE created_at >= now() - _time_period;

  -- Achievement popularity
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  INTO _achievement_pop
  FROM (
    SELECT 
      a.code,
      a.name,
      COUNT(ua.id) as unlocked_count,
      a.credits_reward,
      a.experience_reward
    FROM achievements a
    LEFT JOIN user_achievements ua ON ua.achievement_id = a.id
    GROUP BY a.id, a.code, a.name, a.credits_reward, a.experience_reward
    ORDER BY unlocked_count DESC
  ) t;

  RETURN QUERY SELECT
    _total_users,
    _active_users,
    COALESCE(_avg_level, 1),
    COALESCE(_max_level, 1),
    COALESCE(_total_exp, 0),
    COALESCE(_total_earned, 0),
    COALESCE(_total_spent, 0),
    COALESCE(_level_dist, '{}'::jsonb),
    COALESCE(_top_achievers, '[]'::jsonb),
    COALESCE(_checkin_stats, '{}'::jsonb),
    COALESCE(_achievement_pop, '[]'::jsonb);
END;
$$;

-- ============================================
-- PHASE 7: Economy Constants Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.economy_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE economy_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read economy config"
ON economy_config FOR SELECT
USING (true);

CREATE POLICY "Admins can update economy config"
ON economy_config FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default economy values
INSERT INTO economy_config (key, value, description) VALUES
('CREDITS_PER_USD', '100'::jsonb, '100 credits = $1'),
('STARS_PER_USD', '50'::jsonb, '50 Stars = $1'),
('CREDITS_PER_STAR', '2'::jsonb, '1 Star = 2 credits'),
('GENERATION_COST', '10'::jsonb, 'Cost to generate a track'),
('STEM_SEPARATION_COST', '5'::jsonb, 'Cost to separate stems'),
('MIDI_EXPORT_COST', '3'::jsonb, 'Cost to export MIDI'),
('DAILY_CHECKIN_CREDITS', '5'::jsonb, 'Credits for daily check-in'),
('DAILY_CHECKIN_XP', '10'::jsonb, 'XP for daily check-in'),
('STREAK_BONUS_CREDITS', '2'::jsonb, 'Extra credits per streak day'),
('STREAK_BONUS_XP', '5'::jsonb, 'Extra XP per streak day'),
('SHARE_REWARD_CREDITS', '3'::jsonb, 'Credits for sharing'),
('LIKE_RECEIVED_CREDITS', '1'::jsonb, 'Credits for receiving a like'),
('REFERRAL_PERCENT', '10'::jsonb, 'Percent of referral purchase as reward'),
('PURCHASE_XP_PER_100_STARS', '10'::jsonb, 'XP earned per 100 Stars spent')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();