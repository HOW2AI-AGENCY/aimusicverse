ALTER TABLE public.tracks ALTER COLUMN is_public SET DEFAULT false;
DROP POLICY IF EXISTS "Users can view transcriptions for public tracks" ON public.stem_transcriptions;