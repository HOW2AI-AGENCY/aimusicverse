-- Create playlists table
CREATE TABLE public.playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  cover_url TEXT,
  is_public BOOLEAN DEFAULT false,
  track_count INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create playlist_tracks table (many-to-many)
CREATE TABLE public.playlist_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(playlist_id, track_id)
);

-- Enable RLS
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;

-- Playlists policies
CREATE POLICY "Users can view own or public playlists" 
ON public.playlists FOR SELECT 
USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create own playlists" 
ON public.playlists FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own playlists" 
ON public.playlists FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own playlists" 
ON public.playlists FOR DELETE 
USING (auth.uid() = user_id);

-- Playlist tracks policies
CREATE POLICY "Users can view tracks in accessible playlists" 
ON public.playlist_tracks FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.playlists 
  WHERE playlists.id = playlist_tracks.playlist_id 
  AND (playlists.user_id = auth.uid() OR playlists.is_public = true)
));

CREATE POLICY "Users can add tracks to own playlists" 
ON public.playlist_tracks FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.playlists 
  WHERE playlists.id = playlist_tracks.playlist_id 
  AND playlists.user_id = auth.uid()
));

CREATE POLICY "Users can update tracks in own playlists" 
ON public.playlist_tracks FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.playlists 
  WHERE playlists.id = playlist_tracks.playlist_id 
  AND playlists.user_id = auth.uid()
));

CREATE POLICY "Users can remove tracks from own playlists" 
ON public.playlist_tracks FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.playlists 
  WHERE playlists.id = playlist_tracks.playlist_id 
  AND playlists.user_id = auth.uid()
));

-- Indexes for performance
CREATE INDEX idx_playlists_user_id ON public.playlists(user_id);
CREATE INDEX idx_playlists_is_public ON public.playlists(is_public) WHERE is_public = true;
CREATE INDEX idx_playlist_tracks_playlist_id ON public.playlist_tracks(playlist_id);
CREATE INDEX idx_playlist_tracks_track_id ON public.playlist_tracks(track_id);
CREATE INDEX idx_playlist_tracks_position ON public.playlist_tracks(playlist_id, position);

-- Trigger for updated_at
CREATE TRIGGER update_playlists_updated_at
BEFORE UPDATE ON public.playlists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update playlist stats (track_count, total_duration)
CREATE OR REPLACE FUNCTION public.update_playlist_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'DELETE' THEN
    UPDATE public.playlists 
    SET 
      track_count = (
        SELECT COUNT(*) FROM public.playlist_tracks 
        WHERE playlist_id = COALESCE(NEW.playlist_id, OLD.playlist_id)
      ),
      total_duration = (
        SELECT COALESCE(SUM(t.duration_seconds), 0) 
        FROM public.playlist_tracks pt
        JOIN public.tracks t ON t.id = pt.track_id
        WHERE pt.playlist_id = COALESCE(NEW.playlist_id, OLD.playlist_id)
      ),
      updated_at = now()
    WHERE id = COALESCE(NEW.playlist_id, OLD.playlist_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger to auto-update playlist stats
CREATE TRIGGER update_playlist_stats_trigger
AFTER INSERT OR DELETE ON public.playlist_tracks
FOR EACH ROW
EXECUTE FUNCTION public.update_playlist_stats();