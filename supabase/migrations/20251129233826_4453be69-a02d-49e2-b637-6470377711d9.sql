-- Create track_likes table for likes functionality
CREATE TABLE IF NOT EXISTS public.track_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(track_id, user_id)
);

-- Create track_analytics table for tracking plays, downloads, shares
CREATE TABLE IF NOT EXISTS public.track_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  user_id UUID,
  event_type TEXT NOT NULL CHECK (event_type IN ('play', 'download', 'share')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_track_likes_track_id ON public.track_likes(track_id);
CREATE INDEX IF NOT EXISTS idx_track_likes_user_id ON public.track_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_track_analytics_track_id ON public.track_analytics(track_id);
CREATE INDEX IF NOT EXISTS idx_track_analytics_event_type ON public.track_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_track_analytics_created_at ON public.track_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_tracks_status ON public.tracks(status);
CREATE INDEX IF NOT EXISTS idx_tracks_user_id_status ON public.tracks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_status ON public.generation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_suno_task_id ON public.generation_tasks(suno_task_id);

-- Enable RLS
ALTER TABLE public.track_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for track_likes
CREATE POLICY "Users can view all likes"
  ON public.track_likes
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own likes"
  ON public.track_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON public.track_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for track_analytics
CREATE POLICY "Users can view analytics for own tracks"
  ON public.track_analytics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tracks
      WHERE tracks.id = track_analytics.track_id
      AND tracks.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert analytics"
  ON public.track_analytics
  FOR INSERT
  WITH CHECK (true);

-- Function to increment play count atomically
CREATE OR REPLACE FUNCTION public.increment_track_play_count(track_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.tracks
  SET play_count = COALESCE(play_count, 0) + 1
  WHERE id = track_id_param;
END;
$$;