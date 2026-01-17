-- ============================================================
-- Phase 1 Security Fixes - Remaining Policies
-- ============================================================

-- 3. Add missing DELETE policy for generation_tasks (privacy fix)
DROP POLICY IF EXISTS "Users can delete own generation tasks" ON public.generation_tasks;

CREATE POLICY "Users can delete own generation tasks"
ON public.generation_tasks
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 4. Fix telegram_voice_transcriptions - ensure proper RLS
-- Drop existing policies first
DROP POLICY IF EXISTS "Enable read access for all users" ON public.telegram_voice_transcriptions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.telegram_voice_transcriptions;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.telegram_voice_transcriptions;
DROP POLICY IF EXISTS "Users can view own voice transcriptions" ON public.telegram_voice_transcriptions;
DROP POLICY IF EXISTS "Users can insert own voice transcriptions" ON public.telegram_voice_transcriptions;
DROP POLICY IF EXISTS "Users can update own voice transcriptions" ON public.telegram_voice_transcriptions;
DROP POLICY IF EXISTS "Users can delete own voice transcriptions" ON public.telegram_voice_transcriptions;

-- Create strict policies
CREATE POLICY "Users can view own voice transcriptions"
ON public.telegram_voice_transcriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own voice transcriptions"
ON public.telegram_voice_transcriptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own voice transcriptions"
ON public.telegram_voice_transcriptions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own voice transcriptions"
ON public.telegram_voice_transcriptions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 5. Restrict api_usage_logs to admins only
DROP POLICY IF EXISTS "Users can view own usage" ON public.api_usage_logs;
DROP POLICY IF EXISTS "Users can view own api usage" ON public.api_usage_logs;
DROP POLICY IF EXISTS "Only admins can view api usage logs" ON public.api_usage_logs;
DROP POLICY IF EXISTS "Service role can insert api usage logs" ON public.api_usage_logs;

CREATE POLICY "Only admins can view api usage logs"
ON public.api_usage_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert api usage logs"
ON public.api_usage_logs
FOR INSERT
TO service_role
WITH CHECK (true);