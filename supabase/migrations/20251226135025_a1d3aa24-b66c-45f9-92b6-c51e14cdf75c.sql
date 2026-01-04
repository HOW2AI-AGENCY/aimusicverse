-- Дополнительные политики для mic-recordings пути (используется в AudioRecordDialog)

-- Политика для загрузки mic-recordings
CREATE POLICY "Users can upload mic-recordings to reference-audio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'reference-audio' AND
  (storage.foldername(name))[1] = 'mic-recordings' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Политика для чтения mic-recordings
CREATE POLICY "Users can read own mic-recordings from reference-audio"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'reference-audio' AND
  (storage.foldername(name))[1] = 'mic-recordings' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Политика для удаления mic-recordings
CREATE POLICY "Users can delete own mic-recordings from reference-audio"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'reference-audio' AND
  (storage.foldername(name))[1] = 'mic-recordings' AND
  (storage.foldername(name))[2] = auth.uid()::text
);