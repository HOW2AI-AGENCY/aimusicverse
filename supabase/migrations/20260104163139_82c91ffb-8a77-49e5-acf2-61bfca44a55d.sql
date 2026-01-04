-- ===========================================
-- PHASE 5: LOG ARCHIVING
-- ===========================================

-- Archive table for error_logs
CREATE TABLE IF NOT EXISTS public.error_logs_archive (
  LIKE public.error_logs INCLUDING ALL
);

-- Archive table for api_usage_logs
CREATE TABLE IF NOT EXISTS public.api_usage_logs_archive (
  LIKE public.api_usage_logs INCLUDING ALL
);

-- Function to archive old error logs (older than 30 days)
CREATE OR REPLACE FUNCTION public.archive_old_error_logs()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  archived_count integer;
  deleted_count integer;
BEGIN
  -- Insert old logs into archive
  WITH moved_rows AS (
    INSERT INTO public.error_logs_archive
    SELECT * FROM public.error_logs 
    WHERE created_at < now() - interval '30 days'
    RETURNING id
  )
  SELECT count(*) INTO archived_count FROM moved_rows;
  
  -- Delete archived logs from main table
  DELETE FROM public.error_logs 
  WHERE created_at < now() - interval '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'archived', archived_count,
    'deleted', deleted_count,
    'timestamp', now()
  );
END;
$$;

-- Function to archive old API usage logs (older than 14 days)
CREATE OR REPLACE FUNCTION public.archive_old_api_usage_logs()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  archived_count integer;
  deleted_count integer;
BEGIN
  -- Insert old logs into archive
  WITH moved_rows AS (
    INSERT INTO public.api_usage_logs_archive
    SELECT * FROM public.api_usage_logs 
    WHERE created_at < now() - interval '14 days'
    RETURNING id
  )
  SELECT count(*) INTO archived_count FROM moved_rows;
  
  -- Delete archived logs from main table
  DELETE FROM public.api_usage_logs 
  WHERE created_at < now() - interval '14 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'archived', archived_count,
    'deleted', deleted_count,
    'timestamp', now()
  );
END;
$$;

-- Combined cleanup function
CREATE OR REPLACE FUNCTION public.run_log_archival()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  error_result jsonb;
  api_result jsonb;
BEGIN
  error_result := public.archive_old_error_logs();
  api_result := public.archive_old_api_usage_logs();
  
  RETURN jsonb_build_object(
    'error_logs', error_result,
    'api_usage_logs', api_result,
    'completed_at', now()
  );
END;
$$;

-- Add RLS to archive tables
ALTER TABLE public.error_logs_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs_archive ENABLE ROW LEVEL SECURITY;

-- Only admins can access archive tables
CREATE POLICY "Admin access to error_logs_archive"
  ON public.error_logs_archive
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin access to api_usage_logs_archive"
  ON public.api_usage_logs_archive
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));