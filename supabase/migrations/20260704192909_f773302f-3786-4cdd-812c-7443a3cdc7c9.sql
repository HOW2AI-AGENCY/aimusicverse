DROP POLICY IF EXISTS "Authenticated users can read midi files" ON storage.objects;
CREATE POLICY "Authenticated users can read own midi files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'midi' AND (auth.uid())::text = (storage.foldername(name))[1]);