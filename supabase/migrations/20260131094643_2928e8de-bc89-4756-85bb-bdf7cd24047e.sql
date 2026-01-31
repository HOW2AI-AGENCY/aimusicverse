-- Phase 1.1: Fix RLS policy for user_analytics_events to allow anonymous inserts
-- Problem: Current INSERT policy requires auth.uid(), blocking anonymous users

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can insert own analytics" ON public.user_analytics_events;

-- Create new policy that allows anonymous inserts (user_id can be NULL)
-- and authenticated users can only insert their own data
CREATE POLICY "Allow analytics insert for all users"
ON public.user_analytics_events 
FOR INSERT 
TO public
WITH CHECK (
  user_id IS NULL 
  OR auth.uid() = user_id
);