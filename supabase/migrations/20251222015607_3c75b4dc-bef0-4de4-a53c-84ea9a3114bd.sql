-- Create audio bucket for recordings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('audio', 'audio', true, 52428800, ARRAY['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/mp4', 'audio/x-m4a'])
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload audio to their folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio' AND
  (storage.foldername(name))[1] = 'recordings' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow authenticated users to read their own audio
CREATE POLICY "Users can read their own audio"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'audio' AND
  (storage.foldername(name))[1] = 'recordings' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow public read access to audio files
CREATE POLICY "Public can read audio"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'audio');

-- Allow users to delete their own audio
CREATE POLICY "Users can delete their own audio"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'audio' AND
  (storage.foldername(name))[1] = 'recordings' AND
  (storage.foldername(name))[2] = auth.uid()::text
);