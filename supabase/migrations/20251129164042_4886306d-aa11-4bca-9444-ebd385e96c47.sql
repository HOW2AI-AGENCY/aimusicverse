-- Enable realtime for project_tracks table (if not already enabled)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'project_tracks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE project_tracks;
  END IF;
END $$;