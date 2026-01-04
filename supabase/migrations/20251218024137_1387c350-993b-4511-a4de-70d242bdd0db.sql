-- Create user_generation_history table for persisting generation history between sessions
CREATE TABLE IF NOT EXISTS public.user_generation_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  prompt text NOT NULL,
  style text,
  tags text[],
  generation_mode text,
  model_name text,
  is_instrumental boolean DEFAULT false,
  lyrics text,
  reference_audio_id uuid REFERENCES public.reference_audio(id) ON DELETE SET NULL,
  track_id uuid REFERENCES public.tracks(id) ON DELETE SET NULL,
  status text DEFAULT 'completed',
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_generation_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own history
CREATE POLICY "Users can view own generation history"
ON public.user_generation_history FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own history
CREATE POLICY "Users can insert own generation history"
ON public.user_generation_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own history
CREATE POLICY "Users can delete own generation history"
ON public.user_generation_history FOR DELETE
USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_generation_history_user_id ON public.user_generation_history(user_id);
CREATE INDEX idx_generation_history_created_at ON public.user_generation_history(created_at DESC);

-- Cleanup old entries (keep last 100 per user)
CREATE OR REPLACE FUNCTION public.cleanup_old_generation_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.user_generation_history
  WHERE user_id = NEW.user_id
    AND id NOT IN (
      SELECT id FROM public.user_generation_history
      WHERE user_id = NEW.user_id
      ORDER BY created_at DESC
      LIMIT 100
    );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_cleanup_generation_history
AFTER INSERT ON public.user_generation_history
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_generation_history();