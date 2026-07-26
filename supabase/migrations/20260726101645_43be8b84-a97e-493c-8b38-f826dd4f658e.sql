DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'lyrics_section_notes','lyrics_versions','lyrics_templates','reference_audio',
        'tasks','task_categories','custom_voices','generation_tasks','project_tracks',
        'stem_separation_tasks','stem_batches','user_tag_preferences','prompt_templates'
      )
      AND roles = '{public}'
      AND (coalesce(qual,'') || coalesce(with_check,'')) LIKE '%auth.uid()%'
  LOOP
    EXECUTE format('ALTER POLICY %I ON public.%I TO authenticated', r.policyname, r.tablename);
  END LOOP;
END $$;