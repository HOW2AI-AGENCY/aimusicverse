-- Enable realtime for stem_separation_tasks table
ALTER PUBLICATION supabase_realtime ADD TABLE public.stem_separation_tasks;

-- Enable realtime for track_stems table  
ALTER PUBLICATION supabase_realtime ADD TABLE public.track_stems;