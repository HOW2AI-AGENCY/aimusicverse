-- Migration: Create stem_batches table
-- Task: T005 - Batch processing tracking for stem operations in Mobile Studio V2
-- Description: Tracks batch operations for stem transcription and separation with progress tracking

-- Create enums for operation types and batch status
CREATE TYPE batch_operation_type AS ENUM ('transcription', 'separation');
CREATE TYPE batch_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Create stem_batches table
CREATE TABLE public.stem_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_type batch_operation_type NOT NULL,
  stem_ids UUID[] NOT NULL,
  status batch_status NOT NULL DEFAULT 'pending',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  results JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Create indexes for optimized queries
CREATE INDEX idx_stem_batches_track_created ON public.stem_batches(track_id, created_at DESC);
CREATE INDEX idx_stem_batches_user_status ON public.stem_batches(user_id, status);
CREATE INDEX idx_stem_batches_status_created ON public.stem_batches(status, created_at DESC)
  WHERE status IN ('processing', 'pending');

-- Enable Row Level Security
ALTER TABLE public.stem_batches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own batches"
  ON public.stem_batches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own batches"
  ON public.stem_batches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own batches"
  ON public.stem_batches FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own batches"
  ON public.stem_batches FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE public.stem_batches IS 'Batch processing operations for stem transcription and separation';
COMMENT ON COLUMN public.stem_batches.track_id IS 'Track being processed';
COMMENT ON COLUMN public.stem_batches.operation_type IS 'Type of operation: transcription or separation';
COMMENT ON COLUMN public.stem_batches.stem_ids IS 'Array of stem IDs created or being processed';
COMMENT ON COLUMN public.stem_batches.status IS 'Current status: pending, processing, completed, or failed';
COMMENT ON COLUMN public.stem_batches.progress IS 'Progress percentage (0-100)';
COMMENT ON COLUMN public.stem_batches.results IS 'Operation results as JSON (output varies by operation type)';
COMMENT ON COLUMN public.stem_batches.error_message IS 'Error details if operation failed';
COMMENT ON COLUMN public.stem_batches.completed_at IS 'Timestamp when operation completed (NULL if in progress)';
