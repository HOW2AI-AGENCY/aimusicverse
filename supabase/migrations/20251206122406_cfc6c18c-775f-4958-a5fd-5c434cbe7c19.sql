-- User credits and gamification system

-- Credits balance table
CREATE TABLE public.user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance integer NOT NULL DEFAULT 0,
  total_earned integer NOT NULL DEFAULT 0,
  total_spent integer NOT NULL DEFAULT 0,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_checkin_date date,
  level integer NOT NULL DEFAULT 1,
  experience integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Credit transactions log
CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  transaction_type text NOT NULL, -- 'earn' or 'spend'
  action_type text NOT NULL, -- 'checkin', 'share', 'like_received', 'generation', 'achievement', 'streak_bonus', 'spend_generation'
  description text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Daily check-ins tracking
CREATE TABLE public.user_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  checkin_date date NOT NULL DEFAULT CURRENT_DATE,
  credits_earned integer NOT NULL DEFAULT 0,
  streak_day integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, checkin_date)
);

-- Achievements/badges system
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL, -- 'creation', 'social', 'streak', 'milestone', 'special'
  credits_reward integer NOT NULL DEFAULT 0,
  experience_reward integer NOT NULL DEFAULT 0,
  requirement_type text NOT NULL, -- 'count', 'streak', 'special'
  requirement_value integer NOT NULL DEFAULT 1,
  is_hidden boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- User achievements (unlocked badges)
CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Leaderboard view (will use function for dynamic ranking)
CREATE OR REPLACE FUNCTION public.get_leaderboard(_limit integer DEFAULT 50)
RETURNS TABLE(
  rank bigint,
  user_id uuid,
  username text,
  photo_url text,
  level integer,
  experience integer,
  total_earned integer,
  current_streak integer,
  achievements_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ROW_NUMBER() OVER (ORDER BY uc.experience DESC, uc.total_earned DESC) as rank,
    uc.user_id,
    p.username,
    p.photo_url,
    uc.level,
    uc.experience,
    uc.total_earned,
    uc.current_streak,
    (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = uc.user_id) as achievements_count
  FROM user_credits uc
  LEFT JOIN profiles p ON p.user_id = uc.user_id
  WHERE p.is_public = true OR p.user_id = auth.uid()
  ORDER BY uc.experience DESC, uc.total_earned DESC
  LIMIT _limit;
$$;

-- Function to get level from experience
CREATE OR REPLACE FUNCTION public.get_level_from_experience(_experience integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT GREATEST(1, FLOOR(SQRT(_experience / 100))::integer + 1);
$$;

-- Function to get experience needed for next level
CREATE OR REPLACE FUNCTION public.get_experience_for_level(_level integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ((_level - 1) * (_level - 1) * 100)::integer;
$$;

-- Enable RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_credits
CREATE POLICY "Users can view own credits" ON public.user_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credits" ON public.user_credits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own credits" ON public.user_credits FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for credit_transactions
CREATE POLICY "Users can view own transactions" ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.credit_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_checkins
CREATE POLICY "Users can view own checkins" ON public.user_checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own checkins" ON public.user_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for achievements (public read)
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public can view achievements for leaderboard" ON public.user_achievements FOR SELECT 
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = user_achievements.user_id AND p.is_public = true));

-- Add notification settings for likes
ALTER TABLE public.user_notification_settings 
ADD COLUMN IF NOT EXISTS notify_likes boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_comments boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_achievements boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_daily_reminder boolean DEFAULT false;

-- Insert default achievements
INSERT INTO public.achievements (code, name, description, icon, category, credits_reward, experience_reward, requirement_type, requirement_value) VALUES
-- Streak achievements
('streak_3', 'Начинающий', '3 дня подряд', '🔥', 'streak', 10, 50, 'streak', 3),
('streak_7', 'Постоянный', '7 дней подряд', '🔥', 'streak', 25, 100, 'streak', 7),
('streak_14', 'Преданный', '14 дней подряд', '💪', 'streak', 50, 250, 'streak', 14),
('streak_30', 'Легенда', '30 дней подряд', '👑', 'streak', 100, 500, 'streak', 30),
-- Creation achievements
('tracks_1', 'Первый трек', 'Создай свой первый трек', '🎵', 'creation', 5, 25, 'count', 1),
('tracks_10', 'Продюсер', 'Создай 10 треков', '🎹', 'creation', 25, 100, 'count', 10),
('tracks_50', 'Мастер', 'Создай 50 треков', '🎧', 'creation', 100, 500, 'count', 50),
('tracks_100', 'Легендарный продюсер', 'Создай 100 треков', '🏆', 'creation', 250, 1000, 'count', 100),
-- Social achievements
('likes_10', 'Популярный', 'Получи 10 лайков', '❤️', 'social', 15, 75, 'count', 10),
('likes_50', 'Звезда', 'Получи 50 лайков', '⭐', 'social', 50, 250, 'count', 50),
('likes_100', 'Суперзвезда', 'Получи 100 лайков', '🌟', 'social', 100, 500, 'count', 100),
('shares_5', 'Активист', 'Поделись 5 треками', '📤', 'social', 20, 100, 'count', 5),
('shares_20', 'Промоутер', 'Поделись 20 треками', '📣', 'social', 75, 300, 'count', 20),
-- Milestone achievements
('level_5', 'Уровень 5', 'Достигни 5 уровня', '📈', 'milestone', 25, 0, 'count', 5),
('level_10', 'Уровень 10', 'Достигни 10 уровня', '🚀', 'milestone', 50, 0, 'count', 10),
('level_25', 'Элита', 'Достигни 25 уровня', '💎', 'milestone', 150, 0, 'count', 25),
-- Special achievements
('first_public', 'Открытый', 'Сделай первый публичный трек', '🌍', 'special', 10, 50, 'special', 1),
('first_artist', 'Создатель', 'Создай AI-артиста', '🎤', 'special', 15, 75, 'special', 1),
('first_project', 'Планировщик', 'Создай первый проект', '📁', 'special', 15, 75, 'special', 1);

-- Indexes for performance
CREATE INDEX idx_user_credits_user_id ON public.user_credits(user_id);
CREATE INDEX idx_user_credits_experience ON public.user_credits(experience DESC);
CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);
CREATE INDEX idx_user_checkins_user_id_date ON public.user_checkins(user_id, checkin_date DESC);
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);

-- Trigger to update user_credits.updated_at
CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();