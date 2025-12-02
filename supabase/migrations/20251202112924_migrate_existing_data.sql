-- Migration: Populate version_number and is_master for existing data
-- Task: T006 - Data migration for existing track versions

-- Step 1: Assign sequential version_numbers to existing versions
WITH numbered_versions AS (
  SELECT 
    id,
    track_id,
    ROW_NUMBER() OVER (PARTITION BY track_id ORDER BY created_at ASC) as row_num
  FROM public.track_versions
)
UPDATE public.track_versions
SET version_number = numbered_versions.row_num
FROM numbered_versions
WHERE track_versions.id = numbered_versions.id;

-- Step 2: Set the first version (or primary version) as master
-- First, try to set is_primary versions as master
UPDATE public.track_versions
SET is_master = true
WHERE is_primary = true;

-- For tracks without a primary version, set the first version as master
UPDATE public.track_versions
SET is_master = true
WHERE id IN (
  SELECT DISTINCT ON (track_id) id
  FROM public.track_versions
  WHERE track_id NOT IN (
    SELECT DISTINCT track_id 
    FROM public.track_versions 
    WHERE is_master = true
  )
  ORDER BY track_id, version_number ASC
);

-- Step 3: Populate master_version_id in tracks table
UPDATE public.tracks
SET master_version_id = (
  SELECT id 
  FROM public.track_versions 
  WHERE track_versions.track_id = tracks.id 
  AND track_versions.is_master = true
  LIMIT 1
);

-- Step 4: Create initial changelog entries for existing versions
INSERT INTO public.track_changelog (track_id, version_id, change_type, change_data, user_id)
SELECT 
  tv.track_id,
  tv.id as version_id,
  'version_created' as change_type,
  jsonb_build_object(
    'version_number', tv.version_number,
    'version_type', tv.version_type,
    'is_master', tv.is_master,
    'migration_note', 'Initial version from data migration'
  ) as change_data,
  t.user_id
FROM public.track_versions tv
JOIN public.tracks t ON t.id = tv.track_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.track_changelog
  WHERE track_changelog.version_id = tv.id
  AND track_changelog.change_type = 'version_created'
);

-- Add comment about migration
COMMENT ON TABLE public.track_versions IS 'Track versions with sequential numbering and master version tracking';
