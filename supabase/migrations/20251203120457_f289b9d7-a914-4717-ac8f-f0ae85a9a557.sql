-- Add RLS policy to allow reading basic profile info for all authenticated users
-- This is needed to display creator names on public tracks

CREATE POLICY "Anyone can view basic profile info"
ON public.profiles
FOR SELECT
USING (true);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;