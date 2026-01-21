-- Create user_streaks table for daily activity tracking
CREATE TABLE IF NOT EXISTS public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  max_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  total_active_days INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_streaks
CREATE POLICY "Users can view own streaks" 
ON public.user_streaks FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks" 
ON public.user_streaks FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks" 
ON public.user_streaks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create referrals table for tracking referral relationships
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  reward_granted BOOLEAN NOT NULL DEFAULT false,
  reward_amount INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(referred_id)
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for referrals
CREATE POLICY "Users can view referrals they made" 
ON public.referrals FOR SELECT 
USING (auth.uid() = referrer_id);

CREATE POLICY "Users can see if they were referred" 
ON public.referrals FOR SELECT 
USING (auth.uid() = referred_id);

CREATE POLICY "System can insert referrals" 
ON public.referrals FOR INSERT 
WITH CHECK (auth.uid() = referred_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON public.user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_last_activity ON public.user_streaks(last_activity_date);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON public.referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);

-- Function to update streak on activity
CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_last_date DATE;
  v_current_streak INTEGER;
  v_max_streak INTEGER;
BEGIN
  -- Get current streak data
  SELECT last_activity_date, current_streak, max_streak
  INTO v_last_date, v_current_streak, v_max_streak
  FROM user_streaks
  WHERE user_id = p_user_id;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_streaks (user_id, current_streak, max_streak, last_activity_date, total_active_days)
    VALUES (p_user_id, 1, 1, v_today, 1);
    RETURN;
  END IF;
  
  -- If already active today, do nothing
  IF v_last_date = v_today THEN
    RETURN;
  END IF;
  
  -- If consecutive day, increment streak
  IF v_last_date = v_today - 1 THEN
    v_current_streak := v_current_streak + 1;
    IF v_current_streak > v_max_streak THEN
      v_max_streak := v_current_streak;
    END IF;
  ELSE
    -- Streak broken, reset to 1
    v_current_streak := 1;
  END IF;
  
  -- Update the record
  UPDATE user_streaks
  SET 
    current_streak = v_current_streak,
    max_streak = v_max_streak,
    last_activity_date = v_today,
    total_active_days = total_active_days + 1,
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- Trigger function for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_streak_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for user_streaks
DROP TRIGGER IF EXISTS update_user_streaks_updated_at ON public.user_streaks;
CREATE TRIGGER update_user_streaks_updated_at
BEFORE UPDATE ON public.user_streaks
FOR EACH ROW
EXECUTE FUNCTION public.update_streak_updated_at();