-- Add Guitar Pro and MusicXML MIME types to project-assets bucket
UPDATE storage.buckets 
SET allowed_mime_types = array_cat(
  COALESCE(allowed_mime_types, ARRAY[]::text[]),
  ARRAY['application/x-guitar-pro', 'application/vnd.recordare.musicxml+xml']::text[]
)
WHERE id = 'project-assets'
AND NOT (
  'application/x-guitar-pro' = ANY(COALESCE(allowed_mime_types, ARRAY[]::text[]))
  AND 'application/vnd.recordare.musicxml+xml' = ANY(COALESCE(allowed_mime_types, ARRAY[]::text[]))
);