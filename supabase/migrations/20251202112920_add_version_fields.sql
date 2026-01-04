-- Migration: Add version_number and is_master fields to track_versions table
-- Task: T002 - Add versioning fields for smart version management

-- Add version_number column (sequential per track)
ALTER TABLE public.track_versions
ADD COLUMN version_number INTEGER NOT NULL DEFAULT 1;

-- Add is_master column (indicates active version)
ALTER TABLE public.track_versions
ADD COLUMN is_master BOOLEAN NOT NULL DEFAULT false;

-- Create unique index to ensure sequential version numbers per track
CREATE UNIQUE INDEX idx_unique_version_number_per_track 
ON public.track_versions(track_id, version_number);

-- Create unique index to ensure only one master per track
CREATE UNIQUE INDEX idx_one_master_per_track 
ON public.track_versions(track_id) 
WHERE is_master = true;

-- Create composite index for fast master version lookups
CREATE INDEX idx_track_versions_master ON public.track_versions(track_id, is_master);

-- Add comments
COMMENT ON COLUMN public.track_versions.version_number IS 'Sequential version number (1, 2, 3...) unique per track';
COMMENT ON COLUMN public.track_versions.is_master IS 'True if this is the active/primary version displayed to users';
