-- Sprint 053-A3: Add MIDI source provenance columns to track_versions.
--
-- Two new columns on track_versions:
--   midi_url                  — Storage URL of generated MIDI file (set when MIDI generation completes)
--   midi_generation_source    — which provider produced the MIDI ('suno' | 'replicate'),
--                               so the UI can surface provider info and we can choose
--                               the right polling strategy / retry policy.
--
-- These columns were not in the original track_versions schema (created 2025-11-29)
-- because MIDI generation was first handled exclusively by Replicate/Klang.io.
-- Sprint 053-A3 introduces Suno's native /api/v1/generate/midi as a primary provider
-- with graceful fallback to Replicate when Suno fails or times out.
--
-- RLS on track_versions is inherited unchanged (already SELECT/INSERT/UPDATE/DELETE
-- policies exist based on auth.uid() ownership of the parent track).

ALTER TABLE public.track_versions
  ADD COLUMN IF NOT EXISTS midi_url text,
  ADD COLUMN IF NOT EXISTS midi_generation_source text
    CHECK (midi_generation_source IN ('suno', 'replicate'));

-- Index for migration backfill / analytics queries filtering by provider
CREATE INDEX IF NOT EXISTS idx_track_versions_midi_source
  ON public.track_versions (midi_generation_source)
  WHERE midi_generation_source IS NOT NULL;

COMMENT ON COLUMN public.track_versions.midi_url IS
  'Storage URL (Supabase Storage) of the generated MIDI file. NULL = no MIDI generated yet.';
COMMENT ON COLUMN public.track_versions.midi_generation_source IS
  'Provider that generated this MIDI: suno (Suno /api/v1/generate/midi) or replicate (Replicate/Klang.io fallback). NULL if not yet generated.';
