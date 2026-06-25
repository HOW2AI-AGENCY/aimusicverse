-- Enforce telegram IDs in user_feedback come from the user's profile, not arbitrary client input.
-- BEFORE INSERT trigger overrides telegram_id / telegram_chat_id with values from profiles.

CREATE OR REPLACE FUNCTION public.enforce_user_feedback_telegram_ids()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tg_id BIGINT;
  v_tg_chat BIGINT;
BEGIN
  -- Always source telegram identifiers from the profiles row, ignoring client input.
  SELECT telegram_id, telegram_id INTO v_tg_id, v_tg_chat
  FROM public.profiles
  WHERE id = NEW.user_id;

  NEW.telegram_id := v_tg_id;
  NEW.telegram_chat_id := v_tg_chat;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_user_feedback_tg ON public.user_feedback;
CREATE TRIGGER trg_enforce_user_feedback_tg
BEFORE INSERT OR UPDATE OF telegram_id, telegram_chat_id
ON public.user_feedback
FOR EACH ROW EXECUTE FUNCTION public.enforce_user_feedback_telegram_ids();

-- Tighten the INSERT policy to require user_id match auth.uid() (already true)
-- and document intent. No additional WITH CHECK needed for telegram_id since the
-- trigger overrides it server-side regardless of client value.
