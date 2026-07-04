
-- 1) api_usage_logs: drop the duplicate (subquery) admin policy, keep has_role() one.
DROP POLICY IF EXISTS "Admins can view all API logs" ON public.api_usage_logs;

-- 2) comments: replace fragile self-referencing subquery with a BEFORE UPDATE trigger
--    that hard-locks is_moderated for non-admins. Then simplify the UPDATE policy.
CREATE OR REPLACE FUNCTION public.prevent_comment_moderation_bypass()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins can change moderation state freely.
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  -- Non-admins must never change is_moderated on their own comments.
  IF NEW.is_moderated IS DISTINCT FROM OLD.is_moderated THEN
    RAISE EXCEPTION 'Only moderators can change is_moderated';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_comment_moderation_bypass ON public.comments;
CREATE TRIGGER trg_prevent_comment_moderation_bypass
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_comment_moderation_bypass();

DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
CREATE POLICY "Users can update own comments"
  ON public.comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3) storage: retarget reference-audio policies from public to authenticated.
DROP POLICY IF EXISTS "Users can upload recordings to reference-audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own recordings from reference-audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own recordings from reference-audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload mic-recordings to reference-audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own mic-recordings from reference-audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own mic-recordings from reference-audio" ON storage.objects;

CREATE POLICY "Users can upload recordings to reference-audio"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'reference-audio'
    AND (storage.foldername(name))[1] = 'recordings'
    AND (storage.foldername(name))[2] = (auth.uid())::text
  );

CREATE POLICY "Users can read own recordings from reference-audio"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'reference-audio'
    AND (storage.foldername(name))[1] = 'recordings'
    AND (storage.foldername(name))[2] = (auth.uid())::text
  );

CREATE POLICY "Users can delete own recordings from reference-audio"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'reference-audio'
    AND (storage.foldername(name))[1] = 'recordings'
    AND (storage.foldername(name))[2] = (auth.uid())::text
  );

CREATE POLICY "Users can upload mic-recordings to reference-audio"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'reference-audio'
    AND (storage.foldername(name))[1] = 'mic-recordings'
    AND (storage.foldername(name))[2] = (auth.uid())::text
  );

CREATE POLICY "Users can read own mic-recordings from reference-audio"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'reference-audio'
    AND (storage.foldername(name))[1] = 'mic-recordings'
    AND (storage.foldername(name))[2] = (auth.uid())::text
  );

CREATE POLICY "Users can delete own mic-recordings from reference-audio"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'reference-audio'
    AND (storage.foldername(name))[1] = 'mic-recordings'
    AND (storage.foldername(name))[2] = (auth.uid())::text
  );
