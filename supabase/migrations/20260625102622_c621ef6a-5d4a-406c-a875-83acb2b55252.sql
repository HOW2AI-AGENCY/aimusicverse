DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'audio-references owner update'
  ) THEN
    CREATE POLICY "audio-references owner update"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'audio-references'
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
      WITH CHECK (
        bucket_id = 'audio-references'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END$$;