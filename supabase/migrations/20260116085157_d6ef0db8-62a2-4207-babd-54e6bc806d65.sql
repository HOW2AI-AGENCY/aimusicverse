-- Drop and recreate policies with correct admin check via user_roles table
DROP POLICY IF EXISTS "Users can view own subscription history" ON public.subscription_history;
DROP POLICY IF EXISTS "Admins can view all subscription history" ON public.subscription_history;
DROP POLICY IF EXISTS "System can insert subscription history" ON public.subscription_history;

-- Create policies
CREATE POLICY "Users can view own subscription history"
ON public.subscription_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscription history"
ON public.subscription_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "System can insert subscription history"
ON public.subscription_history
FOR INSERT
WITH CHECK (true);

-- Add missing feature_permissions
INSERT INTO public.feature_permissions (feature_key, name, description, min_tier, is_admin_only, credits_per_use, daily_limit)
VALUES 
  ('track_privacy', '{"en": "Private Tracks", "ru": "Приватные треки"}', 'Make tracks private/visible only to you', 'pro', false, 0, null),
  ('priority_generation', '{"en": "Priority Generation", "ru": "Приоритетная генерация"}', 'Get priority queue for music generation', 'basic', false, 0, null),
  ('unlimited_projects', '{"en": "Unlimited Projects", "ru": "Безлимитные проекты"}', 'Create unlimited music projects', 'pro', false, 0, null)
ON CONFLICT (feature_key) DO NOTHING;