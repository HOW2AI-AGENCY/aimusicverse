-- Drop existing constraint and create a comprehensive one with all needed version types
ALTER TABLE public.track_versions 
DROP CONSTRAINT IF EXISTS track_versions_version_type_check;

ALTER TABLE public.track_versions 
ADD CONSTRAINT track_versions_version_type_check 
CHECK (version_type IN (
  'initial',           -- Original version from generation
  'extension',         -- Extended track (continuation)
  'inpaint',           -- Section replacement
  'remix',             -- Remix/cover version
  'original',          -- Source version marker
  'extended_from',     -- Source for extension
  'replace_section',   -- Section was replaced
  'user_created',      -- User-created version
  'vocal_add',         -- Added vocals to instrumental
  'instrumental_add',  -- Added instrumental to vocals
  'cover',             -- Cover version
  'current'            -- Current active version
));