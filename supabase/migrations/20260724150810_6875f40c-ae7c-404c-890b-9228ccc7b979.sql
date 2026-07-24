
-- ============================================================
-- stem_batches table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stem_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','processing','completed','failed','cancelled')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  mode TEXT CHECK (mode IN ('simple','detailed')),
  results JSONB NOT NULL DEFAULT '{"stems":[],"summary":{"total":0,"success":0,"processing":0,"failed":0}}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stem_batches_user_id_idx ON public.stem_batches(user_id);
CREATE INDEX IF NOT EXISTS stem_batches_track_id_idx ON public.stem_batches(track_id);
CREATE INDEX IF NOT EXISTS stem_batches_status_idx ON public.stem_batches(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stem_batches TO authenticated;
GRANT ALL ON public.stem_batches TO service_role;

ALTER TABLE public.stem_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own stem batches" ON public.stem_batches;
CREATE POLICY "Users manage own stem batches"
  ON public.stem_batches
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime
ALTER TABLE public.stem_batches REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'stem_batches'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.stem_batches';
  END IF;
END $$;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.stem_batches_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stem_batches_updated_at ON public.stem_batches;
CREATE TRIGGER stem_batches_updated_at
  BEFORE UPDATE ON public.stem_batches
  FOR EACH ROW EXECUTE FUNCTION public.stem_batches_set_updated_at();

-- ============================================================
-- RPC: batch_stem_start
-- Creates a new batch row owned by the caller.
-- ============================================================
CREATE OR REPLACE FUNCTION public.batch_stem_start(
  p_track_id UUID,
  p_mode TEXT DEFAULT 'simple',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS public.stem_batches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.stem_batches;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;
  IF p_mode NOT IN ('simple','detailed') THEN
    RAISE EXCEPTION 'invalid mode: %', p_mode;
  END IF;

  INSERT INTO public.stem_batches (user_id, track_id, status, mode, metadata)
  VALUES (auth.uid(), p_track_id, 'queued', p_mode, COALESCE(p_metadata, '{}'::jsonb))
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.batch_stem_start(UUID, TEXT, JSONB) FROM public;
GRANT EXECUTE ON FUNCTION public.batch_stem_start(UUID, TEXT, JSONB) TO authenticated;

-- ============================================================
-- RPC: batch_stem_update_progress
-- ============================================================
CREATE OR REPLACE FUNCTION public.batch_stem_update_progress(
  p_batch_id UUID,
  p_progress INTEGER,
  p_status TEXT DEFAULT NULL,
  p_results JSONB DEFAULT NULL
)
RETURNS public.stem_batches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.stem_batches;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;
  IF p_progress < 0 OR p_progress > 100 THEN
    RAISE EXCEPTION 'progress out of range';
  END IF;
  IF p_status IS NOT NULL AND p_status NOT IN ('queued','processing','completed','failed','cancelled') THEN
    RAISE EXCEPTION 'invalid status: %', p_status;
  END IF;

  UPDATE public.stem_batches
  SET progress = p_progress,
      status = COALESCE(p_status, status),
      results = COALESCE(p_results, results)
  WHERE id = p_batch_id AND user_id = auth.uid()
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'batch not found or not owned by caller';
  END IF;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.batch_stem_update_progress(UUID, INTEGER, TEXT, JSONB) FROM public;
GRANT EXECUTE ON FUNCTION public.batch_stem_update_progress(UUID, INTEGER, TEXT, JSONB) TO authenticated;

-- ============================================================
-- RPC: batch_stem_cancel
-- ============================================================
CREATE OR REPLACE FUNCTION public.batch_stem_cancel(p_batch_id UUID)
RETURNS public.stem_batches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.stem_batches;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  UPDATE public.stem_batches
  SET status = 'cancelled'
  WHERE id = p_batch_id
    AND user_id = auth.uid()
    AND status IN ('queued','processing')
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'batch not found, not owned, or not cancellable';
  END IF;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.batch_stem_cancel(UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.batch_stem_cancel(UUID) TO authenticated;

-- ============================================================
-- RPC: batch_stem_get
-- ============================================================
CREATE OR REPLACE FUNCTION public.batch_stem_get(p_batch_id UUID)
RETURNS public.stem_batches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_row public.stem_batches;
BEGIN
  SELECT * INTO v_row FROM public.stem_batches
  WHERE id = p_batch_id AND user_id = auth.uid();

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'batch not found or not owned by caller';
  END IF;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.batch_stem_get(UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.batch_stem_get(UUID) TO authenticated;
