
-- Remove client-side INSERT policy on notifications.
-- Only server code (edge functions running as service_role) should create notifications.
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;

-- Storage RLS for the new private bucket `project-assets-private`.
-- Users can only access objects under their own user-id folder.
DROP POLICY IF EXISTS "Users read own private project assets" ON storage.objects;
CREATE POLICY "Users read own private project assets"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-assets-private'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users insert own private project assets" ON storage.objects;
CREATE POLICY "Users insert own private project assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-assets-private'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users update own private project assets" ON storage.objects;
CREATE POLICY "Users update own private project assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-assets-private'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'project-assets-private'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users delete own private project assets" ON storage.objects;
CREATE POLICY "Users delete own private project assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-assets-private'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
