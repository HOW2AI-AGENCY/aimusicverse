-- Migration: Create Storage Buckets for Media Assets
-- Sprint: 010 Infrastructure Setup
-- Created: 2025-12-03

-- Create storage buckets for different media types
-- Each bucket has specific size limits and allowed MIME types

-- 1. Tracks bucket (private, audio files up to 50MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('tracks', 'tracks', false, 52428800, ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/flac'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Covers bucket (public, optimized images up to 5MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('covers', 'covers', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. Stems bucket (private, large audio files up to 100MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('stems', 'stems', false, 104857600, ARRAY['audio/wav', 'audio/flac', 'audio/aiff'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 4. Uploads bucket (private, user-uploaded audio up to 50MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('uploads', 'uploads', false, 52428800, ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/mp4'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 5. Avatars bucket (public, profile images up to 2MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 6. Banners bucket (public, banner images up to 5MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('banners', 'banners', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 7. Temp bucket (private, temporary processing files up to 100MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('temp', 'temp', false, 104857600, NULL)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for tracks bucket
CREATE POLICY "Users can view own tracks"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'tracks' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload own tracks"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tracks' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own tracks"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'tracks' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own tracks"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'tracks' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Public tracks viewable by all
CREATE POLICY "Public tracks viewable by all"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'tracks' AND
  EXISTS (
    SELECT 1 FROM tracks 
    WHERE tracks.audio_url LIKE '%' || storage.objects.name || '%'
    AND tracks.is_public = true
  )
);

-- Storage policies for covers bucket (public bucket)
CREATE POLICY "Anyone can view covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'covers');

CREATE POLICY "Users can upload own covers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'covers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own covers"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'covers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own covers"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'covers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for stems bucket (premium feature)
CREATE POLICY "Premium users can view own stems"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'stems' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Premium users can upload stems"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'stems' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own stems"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'stems' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for uploads bucket
CREATE POLICY "Users can view own uploads"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own uploads"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for avatars bucket (public)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for banners bucket (public)
CREATE POLICY "Anyone can view banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

CREATE POLICY "Users can upload own banner"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'banners' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own banner"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'banners' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own banner"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'banners' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for temp bucket
CREATE POLICY "Users can view own temp files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'temp' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload temp files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'temp' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own temp files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'temp' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add comments for documentation
COMMENT ON SCHEMA storage IS 'Schema for Supabase Storage';

COMMENT ON TABLE storage.buckets IS 'Storage buckets for organizing files by type and access level';
