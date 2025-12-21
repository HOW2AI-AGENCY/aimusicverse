-- Create storage bucket for audio references if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-references', 
  'audio-references', 
  true,
  10485760, -- 10MB limit
  ARRAY['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own audio references
CREATE POLICY "Users can upload audio references"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio-references' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to view their own audio references
CREATE POLICY "Users can view their audio references"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'audio-references' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access for audio playback
CREATE POLICY "Public read access for audio references"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'audio-references');

-- Allow authenticated users to delete their own audio references
CREATE POLICY "Users can delete their audio references"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'audio-references' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);