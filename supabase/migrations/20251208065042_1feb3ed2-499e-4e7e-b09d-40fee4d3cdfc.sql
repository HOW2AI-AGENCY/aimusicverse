-- Phase 3: Storage bucket restrictions
-- Add file size limit (50MB) and allowed mime types for project-assets bucket
UPDATE storage.buckets 
SET 
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/webm', 'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
WHERE id = 'project-assets';