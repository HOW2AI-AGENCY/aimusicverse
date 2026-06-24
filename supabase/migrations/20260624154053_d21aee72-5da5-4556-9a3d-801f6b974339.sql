-- Drop the over-broad SELECT policy that exposed every profile column
-- (including telegram_chat_id and telegram_id) to any authenticated user
-- whenever the target profile was public or owned any public track.
-- Public reads of other users are already served by the safe_public_profiles
-- view, which omits Telegram identifiers.
DROP POLICY IF EXISTS "Users can view profiles safely" ON public.profiles;

-- Keep existing narrower policies in place:
--   * "Users can view own profile"  (auth.uid() = user_id)
--   * "Admins can view all profiles" (has_role(auth.uid(),'admin'))
--   * Insert/Update/Delete own profile policies.

-- Defence in depth: revoke direct column SELECT on Telegram identifiers from
-- the API roles. Only service_role (edge functions: bot notifications,
-- admin tooling) keeps access.
REVOKE SELECT (telegram_chat_id, telegram_id) ON public.profiles FROM anon;
REVOKE SELECT (telegram_chat_id, telegram_id) ON public.profiles FROM authenticated;
GRANT SELECT (telegram_chat_id, telegram_id) ON public.profiles TO service_role;

-- Helper RPC so the owner can still read their own Telegram identifiers
-- without needing direct column SELECT (used by useTrackActions etc.).
CREATE OR REPLACE FUNCTION public.get_own_telegram_ids()
RETURNS TABLE(telegram_id bigint, telegram_chat_id text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.telegram_id::bigint,
    p.telegram_chat_id::text
  FROM public.profiles p
  WHERE p.user_id = auth.uid()
  LIMIT 1
$$;

REVOKE EXECUTE ON FUNCTION public.get_own_telegram_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_own_telegram_ids() TO authenticated;