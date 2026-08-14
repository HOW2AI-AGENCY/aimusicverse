DROP POLICY IF EXISTS "Users can insert own analytics events" ON public.user_analytics_events;
CREATE POLICY "Users can insert own analytics events"
ON public.user_analytics_events FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can insert inline choices" ON public.inline_result_chosen;
CREATE POLICY "Authenticated users can insert inline choices"
ON public.inline_result_chosen FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own transcriptions" ON public.telegram_voice_transcriptions;