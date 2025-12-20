-- Create broadcast storage bucket for announcement images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('broadcast', 'broadcast', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to broadcast images
CREATE POLICY "Public read access for broadcast images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'broadcast');

-- Only admins can upload broadcast images
CREATE POLICY "Admins can upload broadcast images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'broadcast' AND
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (raw_user_meta_data->>'role' = 'admin')
  )
);

-- Admins can delete broadcast images
CREATE POLICY "Admins can delete broadcast images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'broadcast' AND
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (raw_user_meta_data->>'role' = 'admin')
  )
);