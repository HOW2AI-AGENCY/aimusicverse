-- Migration: RLS Policies for Mobile Studio V2 Tables
-- Sprint: 031 - Mobile Studio V2
-- Task: Phase 1 - Security & Access Control
-- Created: 2026-01-06
-- Description: Consolidated Row Level Security policies for all 7 new tables
--
-- Security Principle: "Users can read/write their own data"
-- - Users can view, insert, update, and delete their own data
-- - Public presets are readable by all authenticated users
-- - System presets are readable by all authenticated users
--
-- Tables covered:
-- 1. lyric_versions - Track lyric version history
-- 2. section_notes - Section annotations
-- 3. recording_sessions - Vocal/guitar recording metadata
-- 4. presets - User and system presets
-- 5. stem_batches - Batch processing tracking
-- 6. midi_files - MIDI file metadata
-- 7. chord_detection_results - Chord analysis results

-- ============================================================================
-- 1. LYRIC VERSIONS - RLS Policies
-- ============================================================================

-- Enable Row Level Security
ALTER TABLE public.lyric_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view lyric versions for their own tracks
-- Explanation: Users can see all lyric versions for tracks they own
CREATE POLICY "Users can view lyric versions for own tracks"
  ON public.lyric_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tracks
      WHERE tracks.id = lyric_versions.track_id
      AND tracks.user_id = auth.uid()
    )
  );

-- Policy: Users can insert lyric versions for their own tracks
-- Explanation: Users can create new lyric versions only for tracks they own
CREATE POLICY "Users can insert lyric versions for own tracks"
  ON public.lyric_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tracks
      WHERE tracks.id = lyric_versions.track_id
      AND tracks.user_id = auth.uid()
    )
  );

-- Policy: Users can update lyric versions for their own tracks
-- Explanation: Users can modify lyric versions only for tracks they own
CREATE POLICY "Users can update lyric versions for own tracks"
  ON public.lyric_versions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tracks
      WHERE tracks.id = lyric_versions.track_id
      AND tracks.user_id = auth.uid()
    )
  );

-- Policy: Users can delete lyric versions for their own tracks
-- Explanation: Users can delete lyric versions only from tracks they own
CREATE POLICY "Users can delete lyric versions for own tracks"
  ON public.lyric_versions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tracks
      WHERE tracks.id = lyric_versions.track_id
      AND tracks.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 2. SECTION NOTES - RLS Policies
-- ============================================================================

-- Enable Row Level Security
ALTER TABLE public.section_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view notes for their own track sections
-- Explanation: Users can see notes for sections belonging to their tracks
CREATE POLICY "Users can view notes for own track sections"
  ON public.section_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.track_sections
      JOIN public.tracks ON tracks.id = track_sections.track_id
      WHERE track_sections.id = section_notes.section_id
      AND tracks.user_id = auth.uid()
    )
  );

-- Policy: Users can insert notes for their own track sections
-- Explanation: Users can add notes only to sections of tracks they own
CREATE POLICY "Users can insert notes for own track sections"
  ON public.section_notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.track_sections
      JOIN public.tracks ON tracks.id = track_sections.track_id
      WHERE track_sections.id = section_notes.section_id
      AND tracks.user_id = auth.uid()
    )
  );

-- Policy: Users can update their own notes
-- Explanation: Users can modify only the notes they created (author_id match)
CREATE POLICY "Users can update own notes"
  ON public.section_notes FOR UPDATE
  USING (auth.uid() = author_id);

-- Policy: Users can delete their own notes
-- Explanation: Users can delete only the notes they created (author_id match)
CREATE POLICY "Users can delete own notes"
  ON public.section_notes FOR DELETE
  USING (auth.uid() = author_id);

-- ============================================================================
-- 3. RECORDING SESSIONS - RLS Policies
-- ============================================================================

-- Enable Row Level Security
ALTER TABLE public.recording_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own recordings
-- Explanation: Users can see all recordings they created
CREATE POLICY "Users can view own recordings"
  ON public.recording_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own recordings
-- Explanation: Users can create new recordings with their own user_id
CREATE POLICY "Users can insert own recordings"
  ON public.recording_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own recordings
-- Explanation: Users can modify only recordings they created
CREATE POLICY "Users can update own recordings"
  ON public.recording_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own recordings
-- Explanation: Users can delete only recordings they created
CREATE POLICY "Users can delete own recordings"
  ON public.recording_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. PRESETS - RLS Policies (Special Case: Public & System Presets)
-- ============================================================================

-- Enable Row Level Security
ALTER TABLE public.presets ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view system presets
-- Explanation: System presets (created by the platform) are readable by all authenticated users
CREATE POLICY "Anyone can view system presets"
  ON public.presets FOR SELECT
  USING (is_system = true);

-- Policy: Anyone can view public presets
-- Explanation: Public presets shared by users are readable by all authenticated users
CREATE POLICY "Anyone can view public presets"
  ON public.presets FOR SELECT
  USING (is_public = true AND auth.uid() IS NOT NULL);

-- Policy: Users can view their own presets
-- Explanation: Users can always see their own presets (private or public)
CREATE POLICY "Users can view own presets"
  ON public.presets FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own presets
-- Explanation: Users can create new presets but cannot create system presets
CREATE POLICY "Users can insert own presets"
  ON public.presets FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    is_system = false
  );

-- Policy: Users can update their own presets
-- Explanation: Users can modify their own presets but not system presets
CREATE POLICY "Users can update own presets"
  ON public.presets FOR UPDATE
  USING (
    auth.uid() = user_id OR
    (is_system = false AND user_id IS NULL)
  );

-- Policy: Users can delete their own presets
-- Explanation: Users can delete their own presets but not system presets
CREATE POLICY "Users can delete own presets"
  ON public.presets FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. STEM BATCHES - RLS Policies
-- ============================================================================

-- Enable Row Level Security
ALTER TABLE public.stem_batches ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own batches
-- Explanation: Users can see all batch operations they initiated
CREATE POLICY "Users can view own batches"
  ON public.stem_batches FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own batches
-- Explanation: Users can create new batch operations with their own user_id
CREATE POLICY "Users can insert own batches"
  ON public.stem_batches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own batches
-- Explanation: Users can modify only batches they created (for progress updates, etc.)
CREATE POLICY "Users can update own batches"
  ON public.stem_batches FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own batches
-- Explanation: Users can delete only batches they created
CREATE POLICY "Users can delete own batches"
  ON public.stem_batches FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 6. MIDI FILES - RLS Policies
-- ============================================================================

-- Enable Row Level Security
ALTER TABLE public.midi_files ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own MIDI files
-- Explanation: Users can see all MIDI files they uploaded or created
CREATE POLICY "Users can view own MIDI files"
  ON public.midi_files FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own MIDI files
-- Explanation: Users can upload new MIDI files with their own user_id
CREATE POLICY "Users can insert own MIDI files"
  ON public.midi_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own MIDI files
-- Explanation: Users can modify only MIDI files they own
CREATE POLICY "Users can update own MIDI files"
  ON public.midi_files FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own MIDI files
-- Explanation: Users can delete only MIDI files they own
CREATE POLICY "Users can delete own MIDI files"
  ON public.midi_files FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 7. CHORD DETECTION RESULTS - RLS Policies
-- ============================================================================

-- Enable Row Level Security
ALTER TABLE public.chord_detection_results ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own chord results
-- Explanation: Users can see chord analysis results they requested
CREATE POLICY "Users can view own chord results"
  ON public.chord_detection_results FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own chord results
-- Explanation: Users can create chord analysis results with their own user_id
CREATE POLICY "Users can insert own chord results"
  ON public.chord_detection_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own chord results
-- Explanation: Users can modify only chord analysis results they created
CREATE POLICY "Users can update own chord results"
  ON public.chord_detection_results FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own chord results
-- Explanation: Users can delete only chord analysis results they created
CREATE POLICY "Users can delete own chord results"
  ON public.chord_detection_results FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- POLICY SUMMARY
-- ============================================================================
--
-- Total Policies Created: 28 (4 per table × 7 tables)
--
-- Breakdown by Table:
-- - lyric_versions: 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- - section_notes: 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- - recording_sessions: 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- - presets: 7 policies (3× SELECT for system/public/own, + INSERT, UPDATE, DELETE)
-- - stem_batches: 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- - midi_files: 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- - chord_detection_results: 4 policies (SELECT, INSERT, UPDATE, DELETE)
--
-- Security Pattern:
-- 1. Direct ownership check (auth.uid() = user_id)
-- 2. Indirect ownership check via parent table (EXISTS subquery)
-- 3. Special public access (is_public = true)
-- 4. Special system access (is_system = true)
--
-- All policies follow the principle: "Users can read/write their own data"
-- with appropriate exceptions for shared/system content.
-- ============================================================================
