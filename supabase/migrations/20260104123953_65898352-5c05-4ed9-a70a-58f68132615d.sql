-- Create user_generation_stats table for analytics
CREATE TABLE IF NOT EXISTS public.user_generation_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Generation counters
  generations_count INTEGER DEFAULT 0,
  successful_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  
  -- Generation types
  music_count INTEGER DEFAULT 0,
  vocals_count INTEGER DEFAULT 0,
  instrumental_count INTEGER DEFAULT 0,
  extend_count INTEGER DEFAULT 0,
  stems_count INTEGER DEFAULT 0,
  cover_count INTEGER DEFAULT 0,
  
  -- Costs
  estimated_cost DECIMAL(10,4) DEFAULT 0,
  credits_spent INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_user_generation_stats_user_date 
ON public.user_generation_stats(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_user_generation_stats_date 
ON public.user_generation_stats(date DESC);

-- Enable RLS
ALTER TABLE public.user_generation_stats ENABLE ROW LEVEL SECURITY;

-- Users can view own stats
CREATE POLICY "Users can view own generation stats"
ON public.user_generation_stats FOR SELECT
USING (auth.uid() = user_id);

-- System can insert/update (for triggers)
CREATE POLICY "System can manage generation stats"
ON public.user_generation_stats FOR ALL
USING (true)
WITH CHECK (true);

-- Function to update generation stats on task creation/update
CREATE OR REPLACE FUNCTION public.update_user_generation_stats()
RETURNS TRIGGER AS $$
DECLARE
  gen_mode TEXT;
BEGIN
  -- On INSERT: increment generation count
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.user_generation_stats (user_id, date, generations_count)
    VALUES (NEW.user_id, DATE(NEW.created_at), 1)
    ON CONFLICT (user_id, date) 
    DO UPDATE SET 
      generations_count = user_generation_stats.generations_count + 1,
      updated_at = NOW();
    
    -- Update type-specific counter
    gen_mode := COALESCE(NEW.generation_mode, 'generate');
    
    IF gen_mode IN ('generate', 'custom') THEN
      UPDATE public.user_generation_stats
      SET music_count = music_count + 1
      WHERE user_id = NEW.user_id AND date = DATE(NEW.created_at);
    ELSIF gen_mode = 'add_vocals' THEN
      UPDATE public.user_generation_stats
      SET vocals_count = vocals_count + 1
      WHERE user_id = NEW.user_id AND date = DATE(NEW.created_at);
    ELSIF gen_mode = 'remove_vocals' THEN
      UPDATE public.user_generation_stats
      SET instrumental_count = instrumental_count + 1
      WHERE user_id = NEW.user_id AND date = DATE(NEW.created_at);
    ELSIF gen_mode = 'extend' THEN
      UPDATE public.user_generation_stats
      SET extend_count = extend_count + 1
      WHERE user_id = NEW.user_id AND date = DATE(NEW.created_at);
    ELSIF gen_mode = 'separate_vocals' THEN
      UPDATE public.user_generation_stats
      SET stems_count = stems_count + 1
      WHERE user_id = NEW.user_id AND date = DATE(NEW.created_at);
    ELSIF gen_mode = 'cover' THEN
      UPDATE public.user_generation_stats
      SET cover_count = cover_count + 1
      WHERE user_id = NEW.user_id AND date = DATE(NEW.created_at);
    END IF;
  END IF;
  
  -- On UPDATE: update success/failure counts when status changes
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'completed' THEN
      UPDATE public.user_generation_stats
      SET successful_count = successful_count + 1,
          updated_at = NOW()
      WHERE user_id = NEW.user_id AND date = DATE(NEW.created_at);
    ELSIF NEW.status = 'failed' THEN
      UPDATE public.user_generation_stats
      SET failed_count = failed_count + 1,
          updated_at = NOW()
      WHERE user_id = NEW.user_id AND date = DATE(NEW.created_at);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on generation_tasks
DROP TRIGGER IF EXISTS trg_update_generation_stats ON public.generation_tasks;
CREATE TRIGGER trg_update_generation_stats
AFTER INSERT OR UPDATE ON public.generation_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_user_generation_stats();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_generation_stats_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_generation_stats_timestamp ON public.user_generation_stats;
CREATE TRIGGER trg_generation_stats_timestamp
BEFORE UPDATE ON public.user_generation_stats
FOR EACH ROW EXECUTE FUNCTION public.update_generation_stats_timestamp();