-- Add foreign keys to moderation_reports table for proper joins
-- First, add FK for reporter_id -> profiles.user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'moderation_reports_reporter_id_fkey' 
    AND table_name = 'moderation_reports'
  ) THEN
    ALTER TABLE public.moderation_reports 
    ADD CONSTRAINT moderation_reports_reporter_id_fkey 
    FOREIGN KEY (reporter_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add FK for reported_user_id -> profiles.user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'moderation_reports_reported_user_id_fkey' 
    AND table_name = 'moderation_reports'
  ) THEN
    ALTER TABLE public.moderation_reports 
    ADD CONSTRAINT moderation_reports_reported_user_id_fkey 
    FOREIGN KEY (reported_user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add FK for reviewed_by -> profiles.user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'moderation_reports_reviewed_by_fkey' 
    AND table_name = 'moderation_reports'
  ) THEN
    ALTER TABLE public.moderation_reports 
    ADD CONSTRAINT moderation_reports_reviewed_by_fkey 
    FOREIGN KEY (reviewed_by) REFERENCES public.profiles(user_id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for faster lookups on reported_user_id
CREATE INDEX IF NOT EXISTS idx_moderation_reports_reported_user ON public.moderation_reports(reported_user_id);