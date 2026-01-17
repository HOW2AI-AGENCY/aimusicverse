-- Remove duplicate permissive policy on subscription_history
DROP POLICY IF EXISTS "System can insert subscription history" ON public.subscription_history;