-- Add telegram_id column to user_onboarding table for bot compatibility
ALTER TABLE public.user_onboarding 
ADD COLUMN IF NOT EXISTS telegram_id BIGINT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_onboarding_telegram_id ON public.user_onboarding(telegram_id);

-- Update existing records to link telegram_id from profiles
UPDATE public.user_onboarding uo
SET telegram_id = p.telegram_id
FROM public.profiles p
WHERE uo.user_id = p.user_id AND uo.telegram_id IS NULL;