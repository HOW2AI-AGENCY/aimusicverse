
REVOKE SELECT (telegram_chat_id) ON public.profiles FROM anon;
REVOKE SELECT (telegram_chat_id) ON public.profiles FROM authenticated;

CREATE OR REPLACE FUNCTION public.get_own_telegram_chat_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT telegram_chat_id
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

REVOKE EXECUTE ON FUNCTION public.get_own_telegram_chat_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_own_telegram_chat_id() TO authenticated;
