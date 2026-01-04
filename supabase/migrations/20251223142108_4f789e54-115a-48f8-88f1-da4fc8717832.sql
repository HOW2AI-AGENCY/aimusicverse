-- Create storage bucket for project banners if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-banners', 
  'project-banners', 
  true,
  10485760, -- 10MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- RLS Policies for project-banners bucket
-- Allow authenticated users to upload their own banners
CREATE POLICY "Users can upload project banners"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-banners' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to banners
CREATE POLICY "Public read access for project banners"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'project-banners');

-- Allow users to update their own banners
CREATE POLICY "Users can update their own banners"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-banners' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own banners
CREATE POLICY "Users can delete their own banners"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-banners' AND
  auth.uid()::text = (storage.foldername(name))[1]
);