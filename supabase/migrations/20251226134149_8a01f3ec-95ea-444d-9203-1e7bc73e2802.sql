-- Storage policies для микрофонных записей
-- Путь загрузки: recordings/{user_id}/filename (текущий путь в коде)

-- Политика для загрузки записей
CREATE POLICY "Users can upload recordings to reference-audio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'reference-audio' AND
  (storage.foldername(name))[1] = 'recordings' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Политика для чтения своих записей
CREATE POLICY "Users can read own recordings from reference-audio"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'reference-audio' AND
  (storage.foldername(name))[1] = 'recordings' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Политика для удаления своих записей  
CREATE POLICY "Users can delete own recordings from reference-audio"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'reference-audio' AND
  (storage.foldername(name))[1] = 'recordings' AND
  (storage.foldername(name))[2] = auth.uid()::text
);