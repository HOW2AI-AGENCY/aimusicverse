-- Fix auth.users access errors - replace with has_role() function and user_roles table

-- 1. Drop and recreate broadcast_templates policy to use has_role() instead of auth.users
DROP POLICY IF EXISTS "Admins can manage broadcast templates" ON public.broadcast_templates;

CREATE POLICY "Admins can manage broadcast templates"
ON public.broadcast_templates
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Fix storage policies for broadcast bucket - drop old and create new
DROP POLICY IF EXISTS "Admins can upload broadcast images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete broadcast images" ON storage.objects;

-- Recreate with has_role function
CREATE POLICY "Admins can upload broadcast images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'broadcast' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete broadcast images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'broadcast' AND
  public.has_role(auth.uid(), 'admin')
);

-- 3. Add streaming_ready timeout handling - add column to track streaming_ready_at
ALTER TABLE public.generation_tasks 
ADD COLUMN IF NOT EXISTS streaming_ready_at TIMESTAMPTZ;

-- 4. Create function to cleanup stuck tasks (called by pg_cron or edge function)
CREATE OR REPLACE FUNCTION public.cleanup_stuck_generation_tasks()
RETURNS TABLE(
  tasks_failed INTEGER,
  tracks_failed INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tasks_failed INTEGER := 0;
  v_tracks_failed INTEGER := 0;
  v_task_ids UUID[];
BEGIN
  -- 1. Mark tasks stuck in 'pending' or 'processing' for > 1 hour as failed
  WITH updated_tasks AS (
    UPDATE generation_tasks
    SET 
      status = 'failed',
      error_message = 'Task timed out after 1 hour in ' || status || ' status',
      completed_at = now()
    WHERE status IN ('pending', 'processing')
      AND created_at < now() - INTERVAL '1 hour'
    RETURNING id, track_id
  )
  SELECT ARRAY_AGG(id) INTO v_task_ids FROM updated_tasks;
  
  v_tasks_failed := COALESCE(array_length(v_task_ids, 1), 0);
  
  -- 2. Mark tasks stuck in 'streaming_ready' for > 30 minutes as failed
  WITH streaming_stuck AS (
    UPDATE generation_tasks
    SET 
      status = 'failed',
      error_message = 'Task timed out waiting for audio completion',
      completed_at = now()
    WHERE status = 'streaming_ready'
      AND (streaming_ready_at < now() - INTERVAL '30 minutes' 
           OR (streaming_ready_at IS NULL AND updated_at < now() - INTERVAL '30 minutes'))
    RETURNING id, track_id
  )
  SELECT v_tasks_failed + COUNT(*) INTO v_tasks_failed FROM streaming_stuck;
  
  -- 3. Update corresponding tracks to failed
  WITH failed_tracks AS (
    UPDATE tracks t
    SET 
      status = 'failed',
      error_message = 'Generation timed out'
    FROM generation_tasks gt
    WHERE t.id = gt.track_id
      AND gt.status = 'failed'
      AND gt.completed_at > now() - INTERVAL '5 minutes'
      AND t.status NOT IN ('completed', 'failed')
    RETURNING t.id
  )
  SELECT COUNT(*) INTO v_tracks_failed FROM failed_tracks;
  
  RETURN QUERY SELECT v_tasks_failed, v_tracks_failed;
END;
$$;

-- 5. Create index for faster stuck task queries
CREATE INDEX IF NOT EXISTS idx_generation_tasks_stuck 
ON public.generation_tasks (status, created_at) 
WHERE status IN ('pending', 'processing', 'streaming_ready');

-- 6. Grant execute to service role
GRANT EXECUTE ON FUNCTION public.cleanup_stuck_generation_tasks() TO service_role;