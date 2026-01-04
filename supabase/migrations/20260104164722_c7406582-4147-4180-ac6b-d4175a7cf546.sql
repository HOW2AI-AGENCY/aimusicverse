-- Phase 1: Link transcriptions to track versions
-- Add version_id to stem_transcriptions
ALTER TABLE stem_transcriptions 
ADD COLUMN IF NOT EXISTS version_id uuid REFERENCES track_versions(id) ON DELETE SET NULL;

-- Add transcription_data cache to track_versions for quick access
ALTER TABLE track_versions 
ADD COLUMN IF NOT EXISTS transcription_data jsonb;

-- Create index for version_id lookup
CREATE INDEX IF NOT EXISTS idx_stem_transcriptions_version 
ON stem_transcriptions(version_id) WHERE version_id IS NOT NULL;

-- Create index for transcription_data
CREATE INDEX IF NOT EXISTS idx_track_versions_transcription 
ON track_versions USING GIN (transcription_data) 
WHERE transcription_data IS NOT NULL;

-- Function to link transcription to version and cache data
CREATE OR REPLACE FUNCTION link_transcription_to_version(
  p_transcription_id uuid,
  p_version_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transcription record;
BEGIN
  -- Update stem_transcriptions with version_id
  UPDATE stem_transcriptions 
  SET version_id = p_version_id
  WHERE id = p_transcription_id;
  
  -- Get transcription data
  SELECT midi_url, mxml_url, gp5_url, pdf_url, notes, bpm, key_detected, time_signature
  INTO v_transcription
  FROM stem_transcriptions
  WHERE id = p_transcription_id;
  
  -- Cache transcription data in track_versions
  UPDATE track_versions
  SET transcription_data = jsonb_build_object(
    'transcription_id', p_transcription_id,
    'midi_url', v_transcription.midi_url,
    'mxml_url', v_transcription.mxml_url,
    'gp5_url', v_transcription.gp5_url,
    'pdf_url', v_transcription.pdf_url,
    'notes_count', CASE WHEN v_transcription.notes IS NOT NULL THEN jsonb_array_length(v_transcription.notes) ELSE 0 END,
    'bpm', v_transcription.bpm,
    'key', v_transcription.key_detected,
    'time_signature', v_transcription.time_signature
  )
  WHERE id = p_version_id;
END;
$$;

-- Function to get or create version for a track
CREATE OR REPLACE FUNCTION ensure_track_version(
  p_track_id uuid,
  p_audio_url text,
  p_label text DEFAULT 'A',
  p_version_type text DEFAULT 'original'
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_version_id uuid;
BEGIN
  -- Check if version exists with this audio_url
  SELECT id INTO v_version_id
  FROM track_versions
  WHERE track_id = p_track_id 
    AND audio_url = p_audio_url
  LIMIT 1;
  
  -- If not exists, create it
  IF v_version_id IS NULL THEN
    INSERT INTO track_versions (track_id, audio_url, version_label, version_type, is_primary)
    VALUES (p_track_id, p_audio_url, p_label, p_version_type, TRUE)
    RETURNING id INTO v_version_id;
  END IF;
  
  RETURN v_version_id;
END;
$$;